import { resolve } from 'path';
import { defineConfig } from 'vite';
import checkoutHandler from './api/checkout.js';
import webhookHandler from './api/payfast-webhook.js';
import ticketsCountHandler from './api/tickets-count.js';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/tickets-count') && req.method === 'GET') {
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          try {
            await ticketsCountHandler(req, res);
          } catch (err) {
            console.error('API Dev Server Error:', err);
            res.status(500).json({ error: err.message });
          }
          return;
        }

        if (req.url.startsWith('/api/checkout') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body || '{}');
            } catch (e) {
              req.body = {};
            }
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.send = (data) => {
              res.end(data);
              return res;
            };
            try {
              await checkoutHandler(req, res);
            } catch (err) {
              console.error('API Dev Server Error:', err);
              res.status(500).json({ error: err.message });
            }
          });
          return;
        }

        if (req.url.startsWith('/api/payfast-webhook') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
                req.body = Object.fromEntries(new URLSearchParams(body));
              } else {
                req.body = JSON.parse(body || '{}');
              }
            } catch (e) {
              req.body = {};
            }
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.send = (data) => {
              res.end(data);
              return res;
            };
            try {
              await webhookHandler(req, res);
            } catch (err) {
              console.error('API Dev Server Error:', err);
              res.status(500).send(err.message);
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [apiDevServerPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        draw: resolve(__dirname, 'draw.html'),
        test: resolve(__dirname, 'index-test.html'),
      },
    },
  },
});
