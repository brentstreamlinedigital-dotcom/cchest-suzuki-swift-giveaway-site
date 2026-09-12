import { google } from 'googleapis';
import { DEFAULT_SPREADSHEET_ID } from './helpers.js';

export default async function handler(req, res) {
  // Set cache headers so Vercel CDN caches results for 60 seconds
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  // 1. Try public Google Sheet gviz JSON endpoint
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(gvizUrl);
    
    if (response.ok) {
      const text = await response.text();
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
      
      if (jsonMatch && jsonMatch[1]) {
        const data = JSON.parse(jsonMatch[1]);
        const rows = data.table?.rows || [];

        let totalTickets = 0;
        let validRowCount = 0;

        for (const row of rows) {
          const cells = row.c || [];
          // Skip header row if present
          const col0 = String(cells[0]?.v || '').toLowerCase();
          if (col0.includes('timestamp') || col0.includes('date')) continue;

          // Check tickets column (Index 6 / Column G)
          const ticketsCell = cells[6]?.v || cells[6]?.f || '';
          const statusCell = String(cells[7]?.v || cells[7]?.f || '').toLowerCase();

          // Skip if explicitly marked cancelled or failed
          if (statusCell.includes('cancel') || statusCell.includes('fail')) continue;

          validRowCount++;

          if (ticketsCell) {
            const ticketStr = String(ticketsCell).trim();
            if (ticketStr.includes(',')) {
              const ticketList = ticketStr.split(',').map(t => t.trim()).filter(Boolean);
              totalTickets += Math.max(1, ticketList.length);
            } else if (!isNaN(Number(ticketStr)) && Number(ticketStr) > 0) {
              totalTickets += parseInt(ticketStr, 10);
            } else {
              totalTickets += 1;
            }
          } else {
            totalTickets += 1;
          }
        }

        return res.status(200).json({
          success: true,
          count: totalTickets,
          countFormatted: totalTickets.toLocaleString(),
          rowsCount: validRowCount,
          source: 'gviz'
        });
      }
    }
  } catch (err) {
    console.warn('gviz endpoint parsing failed, attempting API fallback:', err);
  }

  // 2. Fallback: Google Cloud Service Account API
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );

      const sheets = google.sheets({ version: 'v4', auth });
      const sheetsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A2:H',
      });

      const rows = sheetsRes.data.values || [];
      let totalTickets = 0;

      for (const row of rows) {
        const ticketsCol = row[6] || '';
        const statusCol = String(row[7] || '').toLowerCase();

        if (statusCol.includes('cancel') || statusCol.includes('fail')) continue;

        if (ticketsCol) {
          const ticketList = String(ticketsCol).split(',').map(t => t.trim()).filter(Boolean);
          totalTickets += Math.max(1, ticketList.length);
        } else {
          totalTickets += 1;
        }
      }

      return res.status(200).json({
        success: true,
        count: totalTickets,
        countFormatted: totalTickets.toLocaleString(),
        rowsCount: rows.length,
        source: 'sheets-api'
      });
    } catch (err) {
      console.error('Google Sheets API fallback failed:', err);
    }
  }

  // 3. Fallback default if spreadsheet has no entries yet or is empty
  return res.status(200).json({
    success: true,
    count: 0,
    countFormatted: '0',
    rowsCount: 0,
    source: 'default'
  });
}
