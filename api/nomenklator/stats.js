// Nomenklator Stats API
import fs from 'fs';
import path from 'path';

let nomenklatorData = null;

// Load nomenklator data
function loadNomenklatorData() {
    if (nomenklatorData) return nomenklatorData;
    
    try {
        const dataPath = path.join(process.cwd(), 'nomenklator.json');
        const jsonData = fs.readFileSync(dataPath, 'utf8');
        nomenklatorData = JSON.parse(jsonData);
        console.log(`✅ Loaded ${nomenklatorData.length} nomenklator entries for stats`);
        return nomenklatorData;
    } catch (error) {
        console.error('❌ Error loading nomenklator data for stats:', error);
        return [];
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = loadNomenklatorData();
        
        const stats = {
            total: data.length,
            withSynonyms: data.filter(entry => entry.SINONIMO && entry.SINONIMO.trim() && entry.SINONIMO !== '-').length,
            withoutSynonyms: data.filter(entry => !entry.SINONIMO || !entry.SINONIMO.trim() || entry.SINONIMO === '-').length
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}