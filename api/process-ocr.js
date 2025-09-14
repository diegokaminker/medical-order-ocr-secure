// Vercel Serverless Function for OCR Processing
import NomenklatorMatcher from '../services/nomenklator-matcher.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data, mimeType, allowPartialMatches = true } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Data or mimeType' });
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `Extract the following information from this medical order:
    - Order Number
    - Order Date
    - Clinician Name
    - Clinician ID Type (national, provincial, gpf)
    - Clinician ID Number
    - Diagnosis
    - Notes
    - Requested Services

Please provide the information in a structured format. If any information is not found, leave it empty.`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }, {
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to process with Gemini API',
        details: errorData
      });
    }

    const data = await response.json();
    const extractedText = data.candidates[0].content.parts[0].text;

    // Parse the extracted text
    const parsedData = parseExtractedData(extractedText);

    // Match services with nomenklator
    const matcher = new NomenklatorMatcher();
    await matcher.loadNomenklatorData();
    const matchedServices = matcher.processServices(parsedData.requestedServices, 0.6, allowPartialMatches);
    
    // Add matched services to the response
    parsedData.matchedServices = matchedServices;

    res.status(200).json({
      success: true,
      data: parsedData,
      rawText: extractedText
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

function parseExtractedData(text) {
  const data = {
    orderNumber: '',
    orderDate: '',
    clinicianName: '',
    clinicianIdType: '',
    clinicianIdNumber: '',
    diagnosis: '',
    notes: '',
    requestedServices: []
  };

  const lines = text.split('\n');
  
  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('order number') || lowerLine.includes('número de orden')) {
      data.orderNumber = extractValue(line);
    } else if (lowerLine.includes('order date') || lowerLine.includes('fecha de orden')) {
      data.orderDate = extractValue(line);
    } else if (lowerLine.includes('clinician name') || lowerLine.includes('nombre del clínico')) {
      data.clinicianName = extractValue(line);
    } else if (lowerLine.includes('clinician id type') || lowerLine.includes('tipo de id')) {
      data.clinicianIdType = extractValue(line);
    } else if (lowerLine.includes('clinician id number') || lowerLine.includes('número de id')) {
      const idValue = extractValue(line);
      // Handle multiple identifiers - take the first one
      const identifiers = idValue.split(/[,;]/).map(id => id.trim()).filter(id => id);
      if (identifiers.length > 0) {
        data.clinicianIdNumber = identifiers[0];
        
        // Auto-detect identifier type based on the ID
        const id = data.clinicianIdNumber.toLowerCase();
        if (id.includes('mp')) {
          data.clinicianIdType = 'provincial';
        } else if (id.includes('mn')) {
          data.clinicianIdType = 'nacional';
        }
      }
    } else if (lowerLine.includes('diagnosis') || lowerLine.includes('diagnóstico')) {
      data.diagnosis = extractValue(line);
    } else if (lowerLine.includes('notes') || lowerLine.includes('notas')) {
      data.notes = extractValue(line);
    } else if (lowerLine.includes('requested services') || lowerLine.includes('servicios solicitados')) {
      const serviceLines = lines.slice(lines.indexOf(line) + 1);
      for (let serviceLine of serviceLines) {
        if (serviceLine.trim() && !serviceLine.toLowerCase().includes(':')) {
          // Remove quotes from service names
          const cleanService = serviceLine.trim().replace(/^["']|["']$/g, '').trim();
          data.requestedServices.push(cleanService);
        }
      }
    }
  }

  return data;
}

function extractValue(line) {
  const colonIndex = line.indexOf(':');
  if (colonIndex !== -1) {
    const value = line.substring(colonIndex + 1).trim();
    // Remove quotes from the beginning and end
    return value.replace(/^["']|["']$/g, '').trim();
  }
  return '';
}
