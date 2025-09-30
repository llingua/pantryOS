const https = require('https');
const fs = require('fs');
const path = require('path');

// Carica i certificati SSL
const options = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem')
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
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './pantryos/pantryos-addon/app/public/index.html';
  } else if (filePath.startsWith('./pantryos/')) {
    // Mantieni il path originale per i file dell'app
    filePath = filePath;
  } else {
    // Per altri file, cerca nella directory public
    filePath = './pantryos/pantryos-addon/app/public' + req.url;
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
  console.log(`🏠 App PantryOS: https://localhost:${PORT}/`);
  console.log('\n⚠️  Il browser potrebbe mostrare un avviso di sicurezza.');
  console.log('   Clicca "Avanzate" → "Procedi verso localhost (non sicuro)"');
});
