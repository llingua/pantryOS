const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const MANUAL_DIR = __dirname;
const APP_PUBLIC_DIR = path.join(ROOT_DIR, 'pantryos/app/public');

// Carica i certificati SSL
const options = {
  key: fs.readFileSync(path.join(ROOT_DIR, 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(ROOT_DIR, 'localhost+2.pem'))
};

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Server HTTPS
const server = https.createServer(options, (req, res) => {
  let filePath = path.join(MANUAL_DIR, req.url === '/' ? 'test-barcode.html' : req.url.replace(/^\//, ''));
  if (req.url === '/') {
    filePath = path.join(MANUAL_DIR, 'test-barcode.html');
  } else if (req.url.startsWith('/app/')) {
    filePath = path.join(APP_PUBLIC_DIR, req.url.replace(/^\/app\//, ''));
  } else {
    filePath = path.join(MANUAL_DIR, req.url.replace(/^\//, ''));
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>404 - File Not Found</h1>
          <p>File: ${filePath}</p>
          <p>URL: ${req.url}</p>
        `);
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8443;
server.listen(PORT, () => {
  console.log(`🚀 Server HTTPS avviato su https://localhost:${PORT}`);
  console.log(`📱 Test barcode scanner: https://localhost:${PORT}/test-barcode.html`);
  console.log(`🏠 App PantryOS: https://localhost:${PORT}/app/index.html`);
  console.log('\n⚠️  Il browser potrebbe mostrare un avviso di sicurezza.');
  console.log('   Clicca "Avanzate" → "Procedi verso localhost (non sicuro)"');
});
