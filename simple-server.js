// Simple HTTP server without external dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Get the URL path
  let filePath = '.';
  
  if (req.url === '/' || req.url === '/index.html') {
    filePath = './test-api.html';
  } else if (req.url === '/socket' || req.url === '/socket.html') {
    filePath = './test-socket.html';
  } else {
    filePath = '.' + req.url;
  }
  
  // Get the file extension
  const extname = path.extname(filePath);
  
  // Set content type based on file extension
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        fs.readFile('./404.html', (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`API tester available at http://localhost:${PORT}/`);
  console.log(`Socket tester available at http://localhost:${PORT}/socket`);
});
