// Nomenklator API - reads from nomenklator.json file
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
        console.log(`✅ Loaded ${nomenklatorData.length} nomenklator entries`);
        return nomenklatorData;
    } catch (error) {
        console.error('❌ Error loading nomenklator data:', error);
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

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = loadNomenklatorData();
        
        if (req.method === 'POST') {
            // Create new entry
            const newEntry = {
                CODIGO: parseInt(req.body.CODIGO),
                DESCRIPCION: req.body.DESCRIPCION,
                SINONIMO: req.body.SINONIMO || '-',
                ATAJO: parseInt(req.body.ATAJO) || 1
            };
            
            // Check if code already exists
            if (data.find(entry => entry.CODIGO == newEntry.CODIGO)) {
                return res.status(400).json({
                    success: false,
                    error: 'El código ya existe'
                });
            }
            
            // In Vercel, we can't write to files, so we simulate the addition
            console.log(`➕ Simulated addition of new entry:`, newEntry);
            
            res.status(201).json({
                success: true,
                data: newEntry,
                message: 'Entrada simulada (modo de solo lectura en Vercel)'
            });
        } else {
            // GET request - return filtered data
            const url = new URL(req.url, `http://${req.headers.host}`);
            const searchTerm = url.searchParams.get('search');
            
            let filteredData = data;
            
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                filteredData = data.filter(entry => 
                    entry.DESCRIPCION.toLowerCase().includes(search) ||
                    (entry.SINONIMO && entry.SINONIMO.toLowerCase().includes(search)) ||
                    entry.CODIGO.toString().includes(search)
                );
            }

            res.status(200).json({
                success: true,
                data: filteredData
            });
        }
    } catch (error) {
        console.error('Nomenklator API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}