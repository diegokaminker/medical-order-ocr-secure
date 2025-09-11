const fs = require('fs');
const path = require('path');

class NomenklatorAPI {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'nomenklator.json');
        this.data = null;
        this.loadData();
    }

    loadData() {
        try {
            const jsonData = fs.readFileSync(this.dataFile, 'utf8');
            this.data = JSON.parse(jsonData);
            console.log(`✅ Loaded ${this.data.length} nomenklator entries`);
        } catch (error) {
            console.error('Error loading nomenklator data:', error);
            this.data = [];
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            console.log('✅ Nomenklator data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving nomenklator data:', error);
            return false;
        }
    }

    // Get all entries
    getAllEntries() {
        return this.data;
    }

    // Get entry by code
    getEntryByCode(codigo) {
        return this.data.find(entry => entry.CODIGO == codigo);
    }

    // Search entries
    searchEntries(query) {
        if (!query) return this.data;
        
        const searchTerm = query.toLowerCase();
        return this.data.filter(entry => 
            entry.DESCRIPCION.toLowerCase().includes(searchTerm) ||
            (entry.SINONIMO && entry.SINONIMO.toLowerCase().includes(searchTerm)) ||
            entry.CODIGO.toString().includes(searchTerm)
        );
    }

    // Add new entry
    addEntry(newEntry) {
        // Validate required fields
        if (!newEntry.CODIGO || !newEntry.DESCRIPCION) {
            throw new Error('CODIGO and DESCRIPCION are required');
        }

        // Check if code already exists
        if (this.getEntryByCode(newEntry.CODIGO)) {
            throw new Error(`Entry with code ${newEntry.CODIGO} already exists`);
        }

        // Set default values
        const entry = {
            CODIGO: parseInt(newEntry.CODIGO),
            DESCRIPCION: newEntry.DESCRIPCION.trim(),
            SINONIMO: newEntry.SINONIMO ? newEntry.SINONIMO.trim() : '-',
            ATAJO: newEntry.ATAJO ? parseInt(newEntry.ATAJO) : this.getNextAtajo()
        };

        this.data.push(entry);
        this.saveData();
        return entry;
    }

    // Update existing entry
    updateEntry(codigo, updates) {
        const index = this.data.findIndex(entry => entry.CODIGO == codigo);
        if (index === -1) {
            throw new Error(`Entry with code ${codigo} not found`);
        }

        // Update fields
        if (updates.DESCRIPCION !== undefined) {
            this.data[index].DESCRIPCION = updates.DESCRIPCION.trim();
        }
        if (updates.SINONIMO !== undefined) {
            this.data[index].SINONIMO = updates.SINONIMO ? updates.SINONIMO.trim() : '-';
        }
        if (updates.ATAJO !== undefined) {
            this.data[index].ATAJO = parseInt(updates.ATAJO);
        }

        this.saveData();
        return this.data[index];
    }

    // Delete entry
    deleteEntry(codigo) {
        const index = this.data.findIndex(entry => entry.CODIGO == codigo);
        if (index === -1) {
            throw new Error(`Entry with code ${codigo} not found`);
        }

        const deletedEntry = this.data.splice(index, 1)[0];
        this.saveData();
        return deletedEntry;
    }

    // Get next available atajo number
    getNextAtajo() {
        const maxAtajo = Math.max(...this.data.map(entry => entry.ATAJO || 0));
        return maxAtajo + 1;
    }

    // Get next available code
    getNextCode() {
        const maxCode = Math.max(...this.data.map(entry => entry.CODIGO || 0));
        return maxCode + 1;
    }

    // Get statistics
    getStats() {
        const entriesWithSynonyms = this.data.filter(entry => 
            entry.SINONIMO && entry.SINONIMO !== '-'
        ).length;

        return {
            totalEntries: this.data.length,
            entriesWithSynonyms: entriesWithSynonyms,
            entriesWithoutSynonyms: this.data.length - entriesWithSynonyms,
            lastCode: Math.max(...this.data.map(entry => entry.CODIGO || 0)),
            nextCode: this.getNextCode(),
            nextAtajo: this.getNextAtajo()
        };
    }

    // Bulk import entries
    bulkImport(entries) {
        const results = {
            success: 0,
            errors: [],
            imported: []
        };

        for (const entry of entries) {
            try {
                const importedEntry = this.addEntry(entry);
                results.imported.push(importedEntry);
                results.success++;
            } catch (error) {
                results.errors.push({
                    entry: entry,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Export data
    exportData(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.data, null, 2);
        } else if (format === 'csv') {
            const headers = ['CODIGO', 'DESCRIPCION', 'SINONIMO', 'ATAJO'];
            const csvContent = [
                headers.join(','),
                ...this.data.map(entry => 
                    headers.map(header => 
                        `"${entry[header] || ''}"`
                    ).join(',')
                )
            ].join('\n');
            return csvContent;
        }
        return null;
    }
}

module.exports = NomenklatorAPI;
