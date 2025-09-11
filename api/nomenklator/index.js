// Nomenklator API with blob storage persistence
import { getAllEntries, searchEntries, createEntry } from './db.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (req.method === 'POST') {
            // Create new entry
            const newEntry = {
                CODIGO: parseInt(req.body.CODIGO),
                DESCRIPCION: req.body.DESCRIPCION,
                SINONIMO: req.body.SINONIMO || '-',
                ATAJO: parseInt(req.body.ATAJO) || 1
            };

            try {
                const createdEntry = await createEntry(newEntry);
                console.log('✅ New entry created:', createdEntry);
                
                res.status(201).json({
                    success: true,
                    data: createdEntry
                });
            } catch (createError) {
                if (createError.code === '23505') { // Unique violation
                    res.status(400).json({
                        success: false,
                        error: 'El código ya existe'
                    });
                } else {
                    throw createError;
                }
            }
        } else {
            // GET request - return filtered data
            const url = new URL(req.url, `http://${req.headers.host}`);
            const searchTerm = url.searchParams.get('search');
            
            let entries;
            if (searchTerm) {
                entries = await searchEntries(searchTerm);
            } else {
                entries = await getAllEntries();
            }

            res.status(200).json({
                success: true,
                data: entries
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