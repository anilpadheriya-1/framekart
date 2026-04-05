const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'build');

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ ERROR: build/ directory not found. Run "npm run build" first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let filePath = path.join(BUILD_DIR, req.url);
  
  // SPA fallback: serve index.html for non-existent files
  if (req.url === '/' || req.url.startsWith('/?')) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback for SPA routes - serve index.html for 404s
      fs.readFile(path.join(BUILD_DIR, 'index.html'), (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': indexData.length });
        res.end(indexData);
      });
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.json') contentType = 'application/json';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg') contentType = 'image/jpeg';
    if (ext === '.svg') contentType = 'image/svg+xml';
    if (ext === '.wasm') contentType = 'application/wasm';
    if (ext === '.map') contentType = 'application/json';
    if (ext === '.webp') contentType = 'image/webp';
    
    res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': data.length });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
