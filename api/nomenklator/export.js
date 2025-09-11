// Nomenklator Export API using blob storage
import { getAllEntries } from './db.js';

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
        const data = await getAllEntries();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const format = url.searchParams.get('format') || 'json';
        
        console.log(`📊 Exporting ${data.length} entries in ${format} format`);
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="nomenklator.json"');
            res.status(200).json(data);
        } else if (format === 'csv') {
            // Convert to CSV
            const csvHeader = 'CODIGO,DESCRIPCION,SINONIMO,ATAJO\n';
            const csvData = data.map(entry => 
                `${entry.CODIGO},"${entry.DESCRIPCION.replace(/"/g, '""')}","${(entry.SINONIMO || '').replace(/"/g, '""')}",${entry.ATAJO || ''}`
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
