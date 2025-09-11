// Nomenklator individual entry API (GET, PUT, DELETE by codigo)
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
        console.log(`✅ Loaded ${nomenklatorData.length} nomenklator entries for individual operations`);
        return nomenklatorData;
    } catch (error) {
        console.error('❌ Error loading nomenklator data for individual operations:', error);
        return [];
    }
}

// Save nomenklator data
function saveNomenklatorData() {
    try {
        const dataPath = path.join(process.cwd(), 'nomenklator.json');
        fs.writeFileSync(dataPath, JSON.stringify(nomenklatorData, null, 2));
        console.log('✅ Nomenklator data saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving nomenklator data:', error);
        return false;
    }
}

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

    try {
        const { codigo } = req.query;
        const data = loadNomenklatorData();
        
        // Find the entry
        const entryIndex = data.findIndex(entry => entry.CODIGO == codigo);
        
        if (entryIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Entrada no encontrada'
            });
        }

        if (req.method === 'GET') {
            // Get individual entry
            res.status(200).json({
                success: true,
                data: data[entryIndex]
            });
        } else if (req.method === 'PUT') {
            // Update entry (read-only mode - changes not persisted)
            const updatedEntry = {
                CODIGO: parseInt(codigo),
                DESCRIPCION: req.body.DESCRIPCION || data[entryIndex].DESCRIPCION,
                SINONIMO: req.body.SINONIMO || data[entryIndex].SINONIMO,
                ATAJO: req.body.ATAJO || data[entryIndex].ATAJO
            };
            
            // In Vercel, we can't write to files, so we simulate the update
            console.log(`📝 Simulated update for entry ${codigo}:`, updatedEntry);
            
            res.status(200).json({
                success: true,
                data: updatedEntry,
                message: 'Cambios simulados (modo de solo lectura en Vercel)'
            });
        } else if (req.method === 'DELETE') {
            // Delete entry (read-only mode - changes not persisted)
            const deletedEntry = data[entryIndex];
            
            // In Vercel, we can't write to files, so we simulate the deletion
            console.log(`🗑️ Simulated deletion for entry ${codigo}:`, deletedEntry);
            
            res.status(200).json({
                success: true,
                data: deletedEntry,
                message: 'Eliminación simulada (modo de solo lectura en Vercel)'
            });
        } else {
            res.status(405).json({ 
                success: false,
                error: 'Método no permitido' 
            });
        }
    } catch (error) {
        console.error('Individual Entry API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
