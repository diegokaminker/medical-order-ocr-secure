// Database connection and operations for nomenklator
import { sql } from '@vercel/postgres';

// Initialize database table
export async function initializeDatabase() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS nomenklator (
                codigo INTEGER PRIMARY KEY,
                descripcion TEXT NOT NULL,
                sinonimo TEXT DEFAULT '-',
                atajo INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Database table initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        return false;
    }
}

// Get all entries
export async function getAllEntries() {
    try {
        const result = await sql`SELECT * FROM nomenklator ORDER BY codigo`;
        return result.rows;
    } catch (error) {
        console.error('❌ Error getting entries:', error);
        return [];
    }
}

// Get entry by codigo
export async function getEntryByCodigo(codigo) {
    try {
        const result = await sql`SELECT * FROM nomenklator WHERE codigo = ${codigo}`;
        return result.rows[0] || null;
    } catch (error) {
        console.error('❌ Error getting entry:', error);
        return null;
    }
}

// Search entries
export async function searchEntries(searchTerm) {
    try {
        const result = await sql`
            SELECT * FROM nomenklator 
            WHERE descripcion ILIKE ${'%' + searchTerm + '%'} 
               OR sinonimo ILIKE ${'%' + searchTerm + '%'}
               OR codigo::text ILIKE ${'%' + searchTerm + '%'}
            ORDER BY codigo
        `;
        return result.rows;
    } catch (error) {
        console.error('❌ Error searching entries:', error);
        return [];
    }
}

// Create new entry
export async function createEntry(entry) {
    try {
        const result = await sql`
            INSERT INTO nomenklator (codigo, descripcion, sinonimo, atajo)
            VALUES (${entry.CODIGO}, ${entry.DESCRIPCION}, ${entry.SINONIMO || '-'}, ${entry.ATAJO || 1})
            RETURNING *
        `;
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error creating entry:', error);
        throw error;
    }
}

// Update entry
export async function updateEntry(codigo, updates) {
    try {
        const result = await sql`
            UPDATE nomenklator 
            SET descripcion = ${updates.DESCRIPCION}, 
                sinonimo = ${updates.SINONIMO}, 
                atajo = ${updates.ATAJO},
                updated_at = CURRENT_TIMESTAMP
            WHERE codigo = ${codigo}
            RETURNING *
        `;
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error updating entry:', error);
        throw error;
    }
}

// Delete entry
export async function deleteEntry(codigo) {
    try {
        const result = await sql`
            DELETE FROM nomenklator 
            WHERE codigo = ${codigo}
            RETURNING *
        `;
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error deleting entry:', error);
        throw error;
    }
}

// Get statistics
export async function getStats() {
    try {
        const totalResult = await sql`SELECT COUNT(*) as total FROM nomenklator`;
        const withSynonymsResult = await sql`
            SELECT COUNT(*) as count FROM nomenklator 
            WHERE sinonimo IS NOT NULL AND sinonimo != '-' AND sinonimo != ''
        `;
        
        return {
            total: parseInt(totalResult.rows[0].total),
            withSynonyms: parseInt(withSynonymsResult.rows[0].count),
            withoutSynonyms: parseInt(totalResult.rows[0].total) - parseInt(withSynonymsResult.rows[0].count)
        };
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return { total: 0, withSynonyms: 0, withoutSynonyms: 0 };
    }
}

// Import data from JSON (for initial setup)
export async function importFromJSON(jsonData) {
    try {
        // Clear existing data
        await sql`DELETE FROM nomenklator`;
        
        // Insert new data
        for (const entry of jsonData) {
            await sql`
                INSERT INTO nomenklator (codigo, descripcion, sinonimo, atajo)
                VALUES (${entry.CODIGO}, ${entry.DESCRIPCION}, ${entry.SINONIMO || '-'}, ${entry.ATAJO || 1})
            `;
        }
        
        console.log(`✅ Imported ${jsonData.length} entries to database`);
        return true;
    } catch (error) {
        console.error('❌ Error importing data:', error);
        return false;
    }
}
