import { google } from 'googleapis';
import { DEFAULT_SPREADSHEET_ID } from './helpers.js';

export const PUBLISHED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSItV5BarzKpjqRObkLg0OoSwsv1wQ4a_bJsQycheSDr9Ktd5cq3gZCFPTuAdNqiYkNw6CsW5NNpvyF/pub?output=csv';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows = [];

  for (const line of lines) {
    const cells = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    rows.push(cells);
  }

  return rows;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  const publishedUrl = process.env.GOOGLE_PUBLISHED_SHEET_URL || PUBLISHED_SHEET_URL;
  const webappUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || '';
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';

  const diagnostics = {
    spreadsheetId,
    publishedUrl,
    hasWebappUrl: !!webappUrl,
    hasServiceAccountEmail: !!serviceAccountEmail,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    attempts: []
  };

  // 1. Try Published CSV URL
  try {
    const csvRes = await fetch(publishedUrl);
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const rows = parseCSV(csvText);

      diagnostics.attempts.push({
        method: 'published-csv',
        totalRows: rows.length,
        rawCsvLength: csvText.length,
        sampleRows: rows.slice(0, 5)
      });

      let totalTickets = 0;
      let validRowCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const firstCol = String(row[0] || '').toLowerCase();

        // Skip header
        if (i === 0 && (firstCol.includes('date') || firstCol.includes('time') || firstCol.includes('id') || firstCol.includes('name') || firstCol.includes('timestamp'))) {
          continue;
        }

        const ticketsCol = row[6] || row[5] || '';
        const statusCol = String(row[7] || row[6] || '').toLowerCase();

        if (statusCol.includes('cancel') || statusCol.includes('fail')) continue;

        validRowCount++;
        let rowTickets = 1;

        if (ticketsCol) {
          const str = String(ticketsCol).replace(/^"|"$/g, '').trim();
          if (str.includes(',')) {
            const list = str.split(',').map(t => t.trim()).filter(Boolean);
            rowTickets = Math.max(1, list.length);
          } else if (!isNaN(Number(str)) && Number(str) > 0) {
            rowTickets = parseInt(str, 10);
          }
        }

        totalTickets += rowTickets;
      }

      if (rows.length > 0) {
        return res.status(200).json({
          success: true,
          count: totalTickets,
          countFormatted: totalTickets.toLocaleString(),
          rowsCount: validRowCount,
          source: 'published-csv',
          diagnostics
        });
      }
    }
  } catch (err) {
    diagnostics.attempts.push({ method: 'published-csv', error: err.message });
  }

  // 2. Try Google Sheets API via Service Account (if configured in env)
  if (serviceAccountEmail && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const auth = new google.auth.JWT(
        serviceAccountEmail,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );

      const sheets = google.sheets({ version: 'v4', auth });
      
      const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetTabs = metaRes.data.sheets?.map(s => s.properties?.title) || [];
      const targetSheet = sheetTabs[0] || 'Sheet1';

      const sheetsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${targetSheet}!A1:Z5000`,
      });

      const allRows = sheetsRes.data.values || [];
      let totalTickets = 0;
      let validRowCount = 0;

      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const firstCol = String(row[0] || '').toLowerCase();
        
        if (i === 0 && (firstCol.includes('date') || firstCol.includes('time') || firstCol.includes('id') || firstCol.includes('name'))) {
          continue;
        }

        const ticketsCol = row[6] || row[5] || '';
        const statusCol = String(row[7] || row[6] || '').toLowerCase();

        if (statusCol.includes('cancel') || statusCol.includes('fail')) continue;

        validRowCount++;
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
      }

      diagnostics.attempts.push({
        method: 'sheets-api',
        sheetTabs,
        totalRows: allRows.length,
        validEntries: validRowCount
      });

      return res.status(200).json({
        success: true,
        count: totalTickets,
        countFormatted: totalTickets.toLocaleString(),
        rowsCount: validRowCount,
        source: 'sheets-api',
        diagnostics
      });
    } catch (err) {
      diagnostics.attempts.push({ method: 'sheets-api', error: err.message });
    }
  }

  // 3. Try Apps Script Web App GET (if configured in env)
  if (webappUrl) {
    try {
      const getUrl = `${webappUrl}?action=getTicketsCount&t=${Date.now()}`;
      const appScriptRes = await fetch(getUrl);
      const appScriptData = await appScriptRes.json();

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
      diagnostics.attempts.push({ method: 'webapp-url', error: err.message });
    }
  }

  // 4. Try Google gviz endpoint (for public / shared Google Sheets)
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
          rowsCount: rows.length
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
    diagnostics.attempts.push({ method: 'gviz', error: err.message });
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
