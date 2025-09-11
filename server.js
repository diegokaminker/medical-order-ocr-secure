const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
app.use(express.static('public'));

// Import the local API function
const { processOCR } = require('./api-local.js');
const NomenklatorAPI = require('./services/nomenklator-api.js');

// Initialize nomenklator API
const nomenklatorAPI = new NomenklatorAPI();

// API endpoint
app.post('/api/process-ocr', async (req, res) => {
  try {
    // Set environment variables for local development
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCVjYnN8c6gqy9P97SNltkaZzP9MbtLROg';
    process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
    
    // Call the API function
    await processOCR(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Nomenklator Management API Routes

// Get all nomenklator entries
app.get('/api/nomenklator', (req, res) => {
  try {
    const { search } = req.query;
    const entries = search ? nomenklatorAPI.searchEntries(search) : nomenklatorAPI.getAllEntries();
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get nomenklator statistics
app.get('/api/nomenklator/stats', (req, res) => {
  try {
    const stats = nomenklatorAPI.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single entry by code
app.get('/api/nomenklator/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const entry = nomenklatorAPI.getEntryByCode(codigo);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new entry
app.post('/api/nomenklator', (req, res) => {
  try {
    const newEntry = nomenklatorAPI.addEntry(req.body);
    res.status(201).json({ success: true, data: newEntry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update entry
app.put('/api/nomenklator/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const updatedEntry = nomenklatorAPI.updateEntry(codigo, req.body);
    res.json({ success: true, data: updatedEntry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete entry
app.delete('/api/nomenklator/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const deletedEntry = nomenklatorAPI.deleteEntry(codigo);
    res.json({ success: true, data: deletedEntry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk import
app.post('/api/nomenklator/import', (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: 'Entries must be an array' });
    }
    const results = nomenklatorAPI.bulkImport(entries);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export data
app.get('/api/nomenklator/export/:format', (req, res) => {
  try {
    const { format } = req.params;
    const data = nomenklatorAPI.exportData(format);
    if (!data) {
      return res.status(400).json({ success: false, error: 'Invalid export format' });
    }
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="nomenklator.json"');
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="nomenklator.csv"');
    }
    
    res.send(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
