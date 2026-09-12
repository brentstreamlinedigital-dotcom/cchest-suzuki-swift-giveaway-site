import { google } from 'googleapis';
import { DEFAULT_SPREADSHEET_ID } from './helpers.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  const webappUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || '';
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;

  const diagnostics = {
    spreadsheetId,
    hasWebappUrl: !!webappUrl,
    hasServiceAccountEmail: !!serviceAccountEmail,
    hasPrivateKey,
    attempts: []
  };

  // 1. Try Google Sheets API via Service Account (if configured)
  if (serviceAccountEmail && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const auth = new google.auth.JWT(
        serviceAccountEmail,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/spreadsheets']
      );

      const sheets = google.sheets({ version: 'v4', auth });
      
      // Get spreadsheet metadata to list all sheet tab names
      const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetTabs = metaRes.data.sheets?.map(s => s.properties?.title) || [];

      // Read from the first sheet tab or Sheet1
      const targetSheet = sheetTabs[0] || 'Sheet1';
      const sheetsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${targetSheet}!A1:Z5000`,
      });

      const allRows = sheetsRes.data.values || [];
      diagnostics.attempts.push({
        method: 'sheets-api',
        sheetTabs,
        targetSheet,
        totalRowsInSheet: allRows.length,
        sampleRows: allRows.slice(0, 5) // Inspect header & top 4 rows
      });

      let totalTickets = 0;
      let validEntries = [];

      // Loop through rows skipping header
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const firstCol = String(row[0] || '').toLowerCase();
        
        // Skip header row
        if (i === 0 && (firstCol.includes('date') || firstCol.includes('time') || firstCol.includes('id') || firstCol.includes('name'))) {
          continue;
        }

        const ticketsCol = row[6] || row[5] || '';
        const statusCol = String(row[7] || row[6] || '').toLowerCase();

        if (statusCol.includes('cancel') || statusCol.includes('fail')) continue;

        let rowTickets = 1;
        if (ticketsCol) {
          const str = String(ticketsCol).trim();
          if (str.includes(',')) {
            const list = str.split(',').map(t => t.trim()).filter(Boolean);
            rowTickets = Math.max(1, list.length);
          } else if (!isNaN(Number(str)) && Number(str) > 0) {
            rowTickets = parseInt(str, 10);
          }
        }

        totalTickets += rowTickets;
        validEntries.push({ rowIdx: i + 1, ticketsCount: rowTickets, rowData: row });
      }

      return res.status(200).json({
        success: true,
        count: totalTickets,
        countFormatted: totalTickets.toLocaleString(),
        rowsCount: validEntries.length,
        source: 'sheets-api',
        diagnostics
      });
    } catch (err) {
      diagnostics.attempts.push({
        method: 'sheets-api',
        error: err.message,
        stack: err.stack
      });
    }
  }

  // 2. Try Apps Script Web App (if configured)
  if (webappUrl) {
    try {
      const getUrl = `${webappUrl}?action=getTicketsCount&t=${Date.now()}`;
      const appScriptRes = await fetch(getUrl);
      const appScriptText = await appScriptRes.text();
      let appScriptData = {};
      try {
        appScriptData = JSON.parse(appScriptText);
      } catch (e) {
        appScriptData = { rawText: appScriptText };
      }

      diagnostics.attempts.push({
        method: 'webapp-url',
        response: appScriptData
      });

      if (appScriptData && typeof appScriptData.count === 'number') {
        return res.status(200).json({
          success: true,
          count: appScriptData.count,
          countFormatted: appScriptData.count.toLocaleString(),
          source: 'webapp-url',
          diagnostics
        });
      }
    } catch (err) {
      diagnostics.attempts.push({
        method: 'webapp-url',
        error: err.message
      });
    }
  }

  // 3. Try gviz endpoint (public sheet fallback)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(gvizUrl);
    
    if (response.ok) {
      const text = await response.text();
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
      
      if (jsonMatch && jsonMatch[1]) {
        const data = JSON.parse(jsonMatch[1]);
        const rows = data.table?.rows || [];

        diagnostics.attempts.push({
          method: 'gviz',
          colsCount: data.table?.cols?.length || 0,
          rowsCount: rows.length,
          cols: data.table?.cols
        });

        let totalTickets = 0;
        let validRowCount = 0;

        for (const row of rows) {
          const cells = row.c || [];
          const col0 = String(cells[0]?.v || '').toLowerCase();
          if (col0.includes('timestamp') || col0.includes('date')) continue;

          const ticketsCell = cells[6]?.v || cells[6]?.f || '';
          const statusCell = String(cells[7]?.v || cells[7]?.f || '').toLowerCase();

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
          source: 'gviz',
          diagnostics
        });
      }
    }
  } catch (err) {
    diagnostics.attempts.push({
      method: 'gviz',
      error: err.message
    });
  }

  return res.status(200).json({
    success: false,
    count: 0,
    countFormatted: '0',
    rowsCount: 0,
    source: 'none',
    diagnostics
  });
}
