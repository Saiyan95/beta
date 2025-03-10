const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3003;

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-socket.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Socket tester available at http://localhost:${PORT}/socket`);
});
