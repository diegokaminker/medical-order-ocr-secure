// Import nomenklator data from JSON to database
import fs from 'fs';
import path from 'path';
import { importFromJSON, initializeDatabase } from './db.js';

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
        // Initialize database
        await initializeDatabase();
        
        // Load JSON data
        const dataPath = path.join(process.cwd(), 'nomenklator.json');
        const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        console.log(`📊 Importing ${jsonData.length} entries from JSON to database`);
        
        // Import to database
        const success = await importFromJSON(jsonData);
        
        if (success) {
            res.status(200).json({
                success: true,
                message: `Successfully imported ${jsonData.length} entries to database`,
                count: jsonData.length
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to import data to database'
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
