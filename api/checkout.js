import { logToGoogleSheets, sendEmails } from './helpers.js';
import { generatePayfastSignature } from './payfast-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, qty, price } = req.body;

    if (!name || !email || !phone || !qty || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique payment ID
    const paymentId = `CC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate ticket numbers in advance
    const ticketNums = [];
    for (let i = 0; i < qty; i++) {
      const num = Math.floor(1000 + Math.random() * 9000);
      const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      ticketNums.push(`CC-75${num}-${char}`);
    }
    const ticketsStr = ticketNums.join(',');

    // Bypassing payment gateway for direct Sheet logging & Email testing phase
    if (process.env.BYPASS_PAYMENT === 'true') {
      console.log('Payment bypass is active. Logging and emailing immediately...');
      
      // Save directly to Google Sheet
      await logToGoogleSheets({
        paymentId,
        name,
        email,
        phone,
        amount: parseFloat(price).toFixed(2),
        tickets: ticketsStr,
        status: 'Paid (Test)',
      });

      // Send emails directly
      await sendEmails({
        name,
        email,
        phone,
        amount: parseFloat(price).toFixed(2),
        tickets: ticketsStr,
        paymentId,
      });

      // Return success data directly to the client
      return res.status(200).json({
        success: true,
        tickets: ticketsStr,
        paymentId,
        name,
        qty,
        price,
      });
    }

    // Standard Payfast checkout parameters (Production / Sandbox Redirection)
    const merchantId = process.env.PAYFAST_MERCHANT_ID || '16459315';
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || 'dunru7loviq5p';
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const payfastUrl = process.env.PAYFAST_IS_LIVE === 'false' 
      ? 'https://sandbox.payfast.co.za/eng/process' 
      : 'https://www.payfast.co.za/eng/process';

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
      : (req.headers.origin || 'http://localhost:5173');

    // Clean URL construction without pre-encoding variables (avoids double URL encoding)
    const returnUrlObj = new URL(`${baseUrl}/index.html`);
    returnUrlObj.searchParams.set('payment', 'success');
    returnUrlObj.searchParams.set('name', name);
    returnUrlObj.searchParams.set('qty', String(qty));
    returnUrlObj.searchParams.set('price', String(price));
    returnUrlObj.searchParams.set('tickets', ticketsStr);

    const params = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrlObj.toString(),
      cancel_url: `${baseUrl}/index.html#tickets`,
      notify_url: `${baseUrl}/api/payfast-webhook`,
      name_first: name.trim().split(' ')[0] || name,
      name_last: name.trim().split(' ').slice(1).join(' ') || 'Customer',
      email_address: email.trim(),
      m_payment_id: paymentId,
      amount: parseFloat(price).toFixed(2),
      item_name: `Suzuki Swift Raffle - ${qty} Ticket(s)`,
      custom_str1: phone.trim(),
      custom_str2: ticketsStr,
    };

    // Calculate MD5 signature using standardized utility
    params.signature = generatePayfastSignature(params, passphrase);

    return res.status(200).json({
      url: payfastUrl,
      fields: params
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
