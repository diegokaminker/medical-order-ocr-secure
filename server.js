const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
app.use(express.static('public'));

// Import the local API function
const { processOCR } = require('./api-local.js');

// API endpoint
app.post('/api/process-ocr', async (req, res) => {
  try {
    // Set environment variables for local development
    process.env.GEMINI_API_KEY = 'AIzaSyBiZNn_im3eUN1bDg0g7xAfxGF50cCiLA8';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash-001';
    
    // Call the API function
    await processOCR(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from public/`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/process-ocr`);
});
