import { sendEmails } from './helpers.js';

export default async function handler(req, res) {
  try {
    const defaultTestRecipients = ['colettep@cchestpe.org.za', 'brent.streamlinedigital@gmail.com'];
    
    // Allow recipient query parameter if provided, otherwise default to requested recipients
    const recipientQuery = req.query?.email;
    const recipients = recipientQuery
      ? recipientQuery.split(',').map(e => e.trim()).filter(Boolean)
      : defaultTestRecipients;

    const testPayload = {
      name: 'Test Entry (Notification Verification)',
      email: 'brent.streamlinedigital@gmail.com',
      phone: '0820000000',
      amount: '100.00',
      tickets: 'CC-759999-TEST',
      paymentId: `TEST-${Date.now()}`,
      customRecipients: recipients
    };

    console.log('Triggering test notification email dispatch to:', recipients);

    const sendResults = await sendEmails(testPayload);

    return res.status(200).json({
      success: true,
      message: 'Test notification emails triggered successfully',
      recipientsSentTo: recipients,
      results: sendResults
    });
  } catch (error) {
    console.error('Test email execution exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
