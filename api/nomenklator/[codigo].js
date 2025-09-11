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

            // Convert database format to frontend format
            const formattedEntry = {
                CODIGO: entry.codigo,
                DESCRIPCION: entry.descripcion,
                SINONIMO: entry.sinonimo,
                ATAJO: entry.atajo
            };

            res.status(200).json({
                success: true,
                data: formattedEntry
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

                // Convert database format to frontend format
                const formattedEntry = {
                    CODIGO: updatedEntry.codigo,
                    DESCRIPCION: updatedEntry.descripcion,
                    SINONIMO: updatedEntry.sinonimo,
                    ATAJO: updatedEntry.atajo
                };

                console.log('✅ Entry updated:', formattedEntry);
                
                res.status(200).json({
                    success: true,
                    data: formattedEntry
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

                // Convert database format to frontend format
                const formattedEntry = {
                    CODIGO: deletedEntry.codigo,
                    DESCRIPCION: deletedEntry.descripcion,
                    SINONIMO: deletedEntry.sinonimo,
                    ATAJO: deletedEntry.atajo
                };

                console.log('✅ Entry deleted:', formattedEntry);
                
                res.status(200).json({
                    success: true,
                    data: formattedEntry
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