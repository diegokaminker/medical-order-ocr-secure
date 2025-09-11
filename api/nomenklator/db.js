// Database operations using Vercel Blob storage
import { put, del, list, head } from '@vercel/blob';

const BLOB_KEY = 'nomenklator-data.json';

// Get all entries from blob storage
export async function getAllEntries() {
    try {
        const { data } = await list({
            prefix: BLOB_KEY,
            limit: 1
        });
        
        if (data.length === 0) {
            // No data exists yet, return empty array
            return [];
        }
        
        // Fetch the actual data
        const response = await fetch(data[0].url);
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error('❌ Error getting entries from blob:', error);
        return [];
    }
}

// Get entry by codigo
export async function getEntryByCodigo(codigo) {
    try {
        const entries = await getAllEntries();
        return entries.find(entry => entry.CODIGO == codigo) || null;
    } catch (error) {
        console.error('❌ Error getting entry from blob:', error);
        return null;
    }
}

// Search entries
export async function searchEntries(searchTerm) {
    try {
        const entries = await getAllEntries();
        const search = searchTerm.toLowerCase();
        
        return entries.filter(entry => 
            entry.DESCRIPCION.toLowerCase().includes(search) ||
            (entry.SINONIMO && entry.SINONIMO.toLowerCase().includes(search)) ||
            entry.CODIGO.toString().includes(search)
        );
    } catch (error) {
        console.error('❌ Error searching entries in blob:', error);
        return [];
    }
}

// Save all entries to blob storage
async function saveAllEntries(entries) {
    try {
        const jsonString = JSON.stringify(entries, null, 2);
        
        await put(BLOB_KEY, jsonString, {
            access: 'public',
            contentType: 'application/json',
        });
        
        console.log(`✅ Saved ${entries.length} entries to blob storage`);
        return true;
    } catch (error) {
        console.error('❌ Error saving entries to blob:', error);
        return false;
    }
}

// Create new entry
export async function createEntry(newEntry) {
    try {
        const entries = await getAllEntries();
        
        // Check if codigo already exists
        if (entries.find(entry => entry.CODIGO == newEntry.CODIGO)) {
            throw new Error('El código ya existe');
        }
        
        // Add new entry
        entries.push(newEntry);
        
        // Save to blob
        const success = await saveAllEntries(entries);
        if (!success) {
            throw new Error('Failed to save new entry');
        }
        
        return newEntry;
    } catch (error) {
        console.error('❌ Error creating entry in blob:', error);
        throw error;
    }
}

// Update entry
export async function updateEntry(codigo, updates) {
    try {
        const entries = await getAllEntries();
        const entryIndex = entries.findIndex(entry => entry.CODIGO == codigo);
        
        if (entryIndex === -1) {
            throw new Error('Entrada no encontrada');
        }
        
        // Update the entry
        entries[entryIndex] = {
            ...entries[entryIndex],
            DESCRIPCION: updates.DESCRIPCION || entries[entryIndex].DESCRIPCION,
            SINONIMO: updates.SINONIMO || entries[entryIndex].SINONIMO,
            ATAJO: updates.ATAJO || entries[entryIndex].ATAJO
        };
        
        // Save to blob
        const success = await saveAllEntries(entries);
        if (!success) {
            throw new Error('Failed to save updated entry');
        }
        
        return entries[entryIndex];
    } catch (error) {
        console.error('❌ Error updating entry in blob:', error);
        throw error;
    }
}

// Delete entry
export async function deleteEntry(codigo) {
    try {
        const entries = await getAllEntries();
        const entryIndex = entries.findIndex(entry => entry.CODIGO == codigo);
        
        if (entryIndex === -1) {
            throw new Error('Entrada no encontrada');
        }
        
        // Remove the entry
        const deletedEntry = entries.splice(entryIndex, 1)[0];
        
        // Save to blob
        const success = await saveAllEntries(entries);
        if (!success) {
            throw new Error('Failed to save after deletion');
        }
        
        return deletedEntry;
    } catch (error) {
        console.error('❌ Error deleting entry from blob:', error);
        throw error;
    }
}

// Get statistics
export async function getStats() {
    try {
        const entries = await getAllEntries();
        
        return {
            total: entries.length,
            withSynonyms: entries.filter(entry => 
                entry.SINONIMO && entry.SINONIMO.trim() && entry.SINONIMO !== '-'
            ).length,
            withoutSynonyms: entries.filter(entry => 
                !entry.SINONIMO || !entry.SINONIMO.trim() || entry.SINONIMO === '-'
            ).length
        };
    } catch (error) {
        console.error('❌ Error getting stats from blob:', error);
        return { total: 0, withSynonyms: 0, withoutSynonyms: 0 };
    }
}

// Import data from local JSON (for initial setup)
export async function importFromJSON(jsonData) {
    try {
        const success = await saveAllEntries(jsonData);
        console.log(`✅ Imported ${jsonData.length} entries to blob storage`);
        return success;
    } catch (error) {
        console.error('❌ Error importing data to blob:', error);
        return false;
    }
}

// Check if blob data exists
export async function dataExists() {
    try {
        const { data } = await list({
            prefix: BLOB_KEY,
            limit: 1
        });
        return data.length > 0;
    } catch (error) {
        console.error('❌ Error checking if data exists:', error);
        return false;
    }
}