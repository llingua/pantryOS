const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const MANUAL_DIR = __dirname;
const APP_PUBLIC_DIR = path.join(ROOT_DIR, 'pantryos/app/public');

// Funzione per leggere il body delle richieste
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

// Carica i certificati SSL
const options = {
  key: fs.readFileSync(path.join(ROOT_DIR, 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(ROOT_DIR, 'localhost+2.pem'))
};

// Server HTTPS semplice
const server = https.createServer(options, async (req, res) => {
  console.log(`📥 Richiesta: ${req.method} ${req.url}`);

  // Headers CORS per test
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath;

  // Gestione API endpoints
  if (req.url.startsWith('/api/')) {
    // Reindirizza le chiamate API al server PantryOS
    const targetUrl = `http://localhost:8080${req.url}`;

    console.log(`🔄 Proxy API: ${req.url} -> ${targetUrl}`);

    // Usa http invece di fetch per compatibilità
    const http = require('http');
    const url = require('url');
    const parsedUrl = url.parse(targetUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(data);
      });
    });

    proxyReq.on('error', (error) => {
      console.error('❌ Errore proxy API:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API Server not available' }));
    });

    if (req.method !== 'GET') {
      getRequestBody(req).then(body => {
        proxyReq.write(body);
        proxyReq.end();
      });
    } else {
      proxyReq.end();
    }
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(MANUAL_DIR, 'test-barcode.html');
  } else if (req.url === '/test-open-facts' || req.url === '/test-open-facts.html') {
    filePath = path.join(MANUAL_DIR, 'test-open-facts.html');
  } else if (req.url === '/test-api-v3' || req.url === '/test-api-v3.html') {
    filePath = path.join(MANUAL_DIR, 'test-api-v3.html');
  } else if (req.url === '/app/' || req.url === '/app') {
    filePath = path.join(APP_PUBLIC_DIR, 'index.html');
  } else if (req.url.startsWith('/app/')) {
    filePath = path.join(APP_PUBLIC_DIR, req.url.replace(/^\/app\//, ''));
  } else {
    filePath = path.join(MANUAL_DIR, req.url.replace(/^\//, ''));
  }

  // MIME types
  const ext = path.extname(filePath);
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

  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.log(`❌ Errore file: ${filePath} - ${error.message}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>404 - File Not Found</h1>
        <p>File: ${filePath}</p>
        <p>URL: ${req.url}</p>
        <p>Error: ${error.message}</p>
      `);
    } else {
      console.log(`✅ Servito: ${filePath}`);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8443;
server.listen(PORT, () => {
  console.log(`🚀 Server HTTPS avviato su https://localhost:${PORT}`);
  console.log(`📱 Test barcode scanner: https://localhost:${PORT}/`);
  console.log(`🧪 Test Open Facts API: https://localhost:${PORT}/test-open-facts`);
  console.log(`🔬 Test Open Facts API v3: https://localhost:${PORT}/test-api-v3`);
  console.log(`🏠 App PantryOS: https://localhost:${PORT}/app/`);
  console.log('\n⚠️  Il browser potrebbe mostrare un avviso di sicurezza.');
  console.log('   Clicca "Avanzate" → "Procedi verso localhost (non sicuro)"');
  console.log('\n📋 Istruzioni:');
  console.log('   1. Apri https://localhost:8443/');
  console.log('   2. Clicca "Verifica Supporto"');
  console.log('   3. Clicca "Avvia Scanner"');
  console.log('   4. Clicca "Consenti" quando richiesto');
});
