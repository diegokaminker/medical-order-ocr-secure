// Nomenklator Export API
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
        console.log(`✅ Loaded ${nomenklatorData.length} nomenklator entries for export`);
        return nomenklatorData;
    } catch (error) {
        console.error('❌ Error loading nomenklator data for export:', error);
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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const format = url.searchParams.get('format') || 'json';
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="nomenklator.json"');
            res.status(200).json(data);
        } else if (format === 'csv') {
            // Convert to CSV
            const csvHeader = 'CODIGO,DESCRIPCION,SINONIMO\n';
            const csvData = data.map(entry => 
                `${entry.CODIGO},"${entry.DESCRIPCION.replace(/"/g, '""')}","${(entry.SINONIMO || '').replace(/"/g, '""')}"`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="nomenklator.csv"');
            res.status(200).send(csvHeader + csvData);
        } else {
            res.status(400).json({
                success: false,
                error: 'Formato no soportado. Use json o csv.'
            });
        }
    } catch (error) {
        console.error('Export API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
