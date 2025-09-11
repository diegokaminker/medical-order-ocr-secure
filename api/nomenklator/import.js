// Import nomenklator data from JSON to blob storage
import fs from 'fs';
import path from 'path';
import { importFromJSON, dataExists } from './db.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if data already exists
        const exists = await dataExists();
        if (exists && !req.body.force) {
            return res.status(400).json({
                success: false,
                error: 'Data already exists in blob storage. Use force=true to overwrite.',
                exists: true
            });
        }
        
        // Load JSON data
        const dataPath = path.join(process.cwd(), 'nomenklator.json');
        const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        console.log(`📊 Importing ${jsonData.length} entries from JSON to blob storage`);
        
        // Import to blob storage
        const success = await importFromJSON(jsonData);
        
        if (success) {
            res.status(200).json({
                success: true,
                message: `Successfully imported ${jsonData.length} entries to blob storage`,
                count: jsonData.length
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to import data to blob storage'
            });
        }
    } catch (error) {
        console.error('Import API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error importing data',
            details: error.message 
        });
    }
}
