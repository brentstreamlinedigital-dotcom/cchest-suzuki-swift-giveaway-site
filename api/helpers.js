import { google } from 'googleapis';
import { Resend } from 'resend';

// Default values from user input
export const DEFAULT_SPREADSHEET_ID = '1MsSIsNoDCjRtHBgCQ4zKMzf89KXD1hBbBXjSqxbz_-I';
export const DEFAULT_ADMIN_EMAILS = [
  'brent.streamlinedigital@gmail.com',
  'selwynw@cchestpe.org.za',
  'colettep@cchestpe.org.za'
];

// Helper to log transaction row to Google Sheets
export async function logToGoogleSheets(data) {
  // Option A: Apps Script Web App
  if (process.env.GOOGLE_SHEET_WEBAPP_URL) {
    try {
      const response = await fetch(process.env.GOOGLE_SHEET_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      console.log('Google Apps Script logging status:', resData);
      return;
    } catch (err) {
      console.error('Apps Script logging failed. Attempting fallback option if configured.', err);
    }
  }

  // Option B: Google Cloud Service Account Credentials
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && spreadsheetId) {
    try {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      const sheets = google.sheets({ version: 'v4', auth });
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            data.paymentId,
            data.name,
            data.email,
            data.phone,
            data.amount,
            data.tickets,
            data.status
          ]]
        }
      });
      console.log('Direct Google Sheets API log success.');
    } catch (err) {
      console.error('Direct Google Sheets API logging exception:', err);
    }
  } else {
    console.warn('Google Sheets logging is not configured (missing required environment variables).');
  }
}

// Helper to send customer receipt & admin emails via Resend
export async function sendEmails({ name, email, phone, amount, tickets, paymentId, customRecipients }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend email API key not configured. Dispatches skipped.');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  // Buyer Receipt HTML
  const buyerHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Community Chest</h1>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Eastern Cape • 75th Anniversary Celebration</p>
      </div>
      <h2 style="color: #10b981; font-size: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">Payment Successful!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for entering the Community Chest Suzuki Swift Raffle. Your support directly aids local charities in the Eastern Cape region.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Ticket Details</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Payment ID:</td><td style="padding: 8px 0; text-align: right;">${paymentId}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Amount Paid:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">R${amount}</td></tr>
          <tr><td style="font-weight: bold; padding: 8px 0; color: #475569; vertical-align: top;">Ticket Numbers:</td><td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #1e3a8a; word-break: break-all;">${tickets.split(',').join(', ')}</td></tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #475569;">The raffle draws 16 monthly finalists who will be invited to our 75th Anniversary Gala for the Grand Key Ceremony where they will stand a chance to drive away in a brand new Suzuki Swift!</p>
      <p style="font-size: 14px; color: #475569; margin-top: 25px;">Good luck,</p>
      <p style="font-weight: bold; color: #0f172a; margin: 0;">Community Chest of the Eastern Cape</p>
    </div>
  `;

  // Admin Notification HTML
  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <h2 style="color: #1e3a8a; font-size: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; margin-top: 0;">New Suzuki Swift Raffle Entry!</h2>
      <p>A new purchase has been completed and verified successfully.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Name:</td><td style="padding: 8px 0; text-align: right;">${name}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Email:</td><td style="padding: 8px 0; text-align: right;">${email}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Phone:</td><td style="padding: 8px 0; text-align: right;">${phone}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569;">Amount Paid:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">R${amount}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="font-weight: bold; padding: 8px 0; color: #475569; vertical-align: top;">Ticket Numbers:</td><td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #1e3a8a; word-break: break-all;">${tickets.split(',').join(', ')}</td></tr>
          <tr><td style="font-weight: bold; padding: 8px 0; color: #475569;">Payment ID:</td><td style="padding: 8px 0; text-align: right;">${paymentId}</td></tr>
        </table>
      </div>
    </div>
  `;

  // Send receipt email to buyer (if valid buyer email provided)
  if (email && email.includes('@')) {
    try {
      await resend.emails.send({
        from: `CCEC Suzuki Swift Raffle <${senderEmail}>`,
        to: email,
        subject: 'Your Suzuki Swift Raffle Ticket Receipt',
        html: buyerHtml,
      });
      console.log('Customer receipt email sent successfully to:', email);
    } catch (err) {
      console.error('Failed to send buyer receipt email:', err);
    }
  }

  // Gather configured admin recipient emails
  let targetAdmins = [];
  if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
    targetAdmins = customRecipients;
  } else {
    const rawList = [...DEFAULT_ADMIN_EMAILS];
    if (process.env.ADMIN_EMAILS) {
      rawList.push(...process.env.ADMIN_EMAILS.split(','));
    }
    if (process.env.ADMIN_EMAIL_USER) rawList.push(process.env.ADMIN_EMAIL_USER);
    if (process.env.ADMIN_EMAIL_COLETTE) rawList.push(process.env.ADMIN_EMAIL_COLETTE);
    if (process.env.ADMIN_EMAIL_COLETTEP) rawList.push(process.env.ADMIN_EMAIL_COLETTEP);
    if (process.env.ADMIN_EMAIL_SELWYN) rawList.push(process.env.ADMIN_EMAIL_SELWYN);

    targetAdmins = rawList;
  }

  // Sanitize, normalize, fix typos, and deduplicate email addresses
  const sanitizedAdmins = Array.from(new Set(
    targetAdmins
      .map(e => String(e).trim().toLowerCase())
      .map(e => e === 'colette@cchestpe.org.za' ? 'colettep@cchestpe.org.za' : e)
      .filter(e => e && e.includes('@'))
  ));

  console.log('Sending admin notification emails individually to:', sanitizedAdmins);

  // Send admin notification emails individually to prevent single-recipient failure blocking others
  const results = await Promise.allSettled(
    sanitizedAdmins.map(async (adminEmail) => {
      try {
        const response = await resend.emails.send({
          from: `CCEC Raffle Notifications <${senderEmail}>`,
          to: adminEmail,
          subject: `New Raffle Entry: ${name} (R${amount})`,
          html: adminHtml,
        });
        console.log(`Admin notification email sent successfully to ${adminEmail}`, response);
        return { email: adminEmail, status: 'fulfilled', response };
      } catch (err) {
        console.error(`Error sending admin notification email to ${adminEmail}:`, err);
        throw err;
      }
    })
  );

  return results;
}

