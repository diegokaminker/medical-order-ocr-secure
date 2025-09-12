// Database operations using Vercel Blob storage
import { put, del, list, head } from '@vercel/blob';

const BLOB_KEY = 'nomenklator-data.json';

// Get all entries from blob storage
export async function getAllEntries() {
    try {
        console.log('🔍 Fetching entries from blob storage...');
        
        // List all blobs
        const result = await list({
            limit: 10
        });
        
        const blobs = result.blobs || [];
        console.log('📋 Found blobs:', blobs.map(b => b.pathname));
        
        // Find the latest nomenklator blob (most recent uploadedAt)
        const nomenklatorBlobs = blobs.filter(blob => blob.pathname === BLOB_KEY);
        const nomenklatorBlob = nomenklatorBlobs.length > 0 
            ? nomenklatorBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0]
            : null;
        
        if (!nomenklatorBlob) {
            console.log('❌ No nomenklator data found in blob storage');
            return [];
        }
        
        console.log('✅ Found nomenklator blob:', nomenklatorBlob.pathname);
        
        // Fetch the actual data
        const response = await fetch(nomenklatorBlob.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob data: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log(`✅ Loaded ${jsonData.length} entries from blob storage`);
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
        console.log(`💾 Saving ${entries.length} entries to blob storage...`);
        
        const jsonString = JSON.stringify(entries, null, 2);
        
        const result = await put(BLOB_KEY, jsonString, {
            access: 'public',
            contentType: 'application/json',
        });
        
        console.log(`✅ Saved ${entries.length} entries to blob storage:`, result.url);
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
            DESCRIPCION: updates.DESCRIPCION !== undefined ? updates.DESCRIPCION : entries[entryIndex].DESCRIPCION,
            SINONIMO: updates.SINONIMO !== undefined ? updates.SINONIMO : entries[entryIndex].SINONIMO,
            ATAJO: updates.ATAJO !== undefined ? updates.ATAJO : entries[entryIndex].ATAJO
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