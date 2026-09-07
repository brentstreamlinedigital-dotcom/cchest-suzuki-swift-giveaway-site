import { logToGoogleSheets, sendEmails } from './helpers.js';
import { generatePayfastSignature } from './payfast-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const data = req.body || {};
    console.log('Received IPN payload:', data);

    const signature = data.signature;
    if (!signature) {
      console.error('IPN request missing signature');
      return res.status(400).send('Missing signature');
    }

    // 1. Re-calculate MD5 Signature for verification using standard utility
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const calculatedSignature = generatePayfastSignature(data, passphrase);

    if (calculatedSignature !== signature) {
      console.error('Signature verification failed', {
        calculated: calculatedSignature,
        received: signature,
      });
      return res.status(400).send('Invalid signature');
    }

    // 2. Query Payfast to validate transaction authenticity
    const payfastUrl = process.env.PAYFAST_IS_LIVE === 'false'
      ? 'https://sandbox.payfast.co.za/eng/query/validate'
      : 'https://www.payfast.co.za/eng/query/validate';

    const rawPayload = Object.keys(data)
      .map(key => {
        const val = String(data[key] || '').trim();
        const encodedVal = encodeURIComponent(val)
          .replace(/%20/g, '+')
          .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
        return `${key}=${encodedVal}`;
      })
      .join('&');

    const validationResponse = await fetch(payfastUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: rawPayload,
    });

    const validationText = await validationResponse.text();
    if (validationText.trim() !== 'VALID') {
      console.error('Payfast security validation failed:', validationText);
      return res.status(400).send('Invalid transaction validation');
    }

    // 3. Check Payment Status
    if (data.payment_status !== 'COMPLETE') {
      console.log('Payment received but status not COMPLETE:', data.payment_status);
      return res.status(200).send('Acknowledged'); // Accept to avoid constant retry from Payfast
    }

    // 4. Extract order metadata
    const name = `${data.name_first || ''} ${data.name_last || ''}`.trim() || 'Raffle Supporter';
    const email = data.email_address || '';
    const phone = data.custom_str1 || '';
    const ticketsStr = data.custom_str2 || '';
    const amount = data.amount_gross || '';
    const paymentId = data.m_payment_id || '';

    // 5. Append transaction details to Google Sheets
    await logToGoogleSheets({
      paymentId,
      name,
      email,
      phone,
      amount,
      tickets: ticketsStr,
      status: 'Paid',
    });

    // 6. Send Receipts and Admin Notifications
    await sendEmails({
      name,
      email,
      phone,
      amount,
      tickets: ticketsStr,
      paymentId,
    });

    return res.status(200).send('COMPLETE');
  } catch (error) {
    console.error('Webhook processing exception:', error);
    return res.status(500).send('Internal Server Error');
  }
}
