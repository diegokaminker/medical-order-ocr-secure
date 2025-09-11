// Nomenklator individual entry API with blob storage persistence
import { getEntryByCodigo, updateEntry, deleteEntry } from './db.js';

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
        
        if (req.method === 'GET') {
            // Get individual entry
            const entry = await getEntryByCodigo(codigo);
            
            if (!entry) {
                return res.status(404).json({
                    success: false,
                    error: 'Entrada no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                data: entry
            });
        } else if (req.method === 'PUT') {
            // Update entry
            const updates = {
                DESCRIPCION: req.body.DESCRIPCION,
                SINONIMO: req.body.SINONIMO,
                ATAJO: parseInt(req.body.ATAJO)
            };

            try {
                const updatedEntry = await updateEntry(codigo, updates);
                
                if (!updatedEntry) {
                    return res.status(404).json({
                        success: false,
                        error: 'Entrada no encontrada'
                    });
                }

                console.log('✅ Entry updated:', updatedEntry);
                
                res.status(200).json({
                    success: true,
                    data: updatedEntry
                });
            } catch (updateError) {
                console.error('❌ Error updating entry:', updateError);
                res.status(500).json({
                    success: false,
                    error: 'Error al actualizar la entrada'
                });
            }
        } else if (req.method === 'DELETE') {
            // Delete entry
            try {
                const deletedEntry = await deleteEntry(codigo);
                
                if (!deletedEntry) {
                    return res.status(404).json({
                        success: false,
                        error: 'Entrada no encontrada'
                    });
                }

                console.log('✅ Entry deleted:', deletedEntry);
                
                res.status(200).json({
                    success: true,
                    data: deletedEntry
                });
            } catch (deleteError) {
                console.error('❌ Error deleting entry:', deleteError);
                res.status(500).json({
                    success: false,
                    error: 'Error al eliminar la entrada'
                });
            }
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