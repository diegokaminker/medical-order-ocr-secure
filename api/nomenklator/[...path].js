// Vercel serverless function for nomenklator API with dynamic routing
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NomenklatorAPI {
    constructor() {
        this.dataFile = path.join(process.cwd(), 'nomenklator.json');
        this.data = null;
        this.loadData();
    }

    loadData() {
        try {
            console.log(`🔍 Looking for nomenklator.json at: ${this.dataFile}`);
            const jsonData = fs.readFileSync(this.dataFile, 'utf8');
            this.data = JSON.parse(jsonData);
            console.log(`✅ Loaded ${this.data.length} nomenklator entries`);
        } catch (error) {
            console.error('❌ Error loading nomenklator data:', error);
            console.error('❌ File path:', this.dataFile);
            console.error('❌ Current working directory:', process.cwd());
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

    // Get statistics
    getStats() {
        return {
            total: this.data.length,
            withSynonyms: this.data.filter(entry => entry.SINONIMO && entry.SINONIMO.trim()).length,
            withoutSynonyms: this.data.filter(entry => !entry.SINONIMO || !entry.SINONIMO.trim()).length
        };
    }

    // Add new entry
    addEntry(newEntry) {
        // Validate required fields
        if (!newEntry.CODIGO || !newEntry.DESCRIPCION) {
            throw new Error('Código y descripción son requeridos');
        }

        // Check if code already exists
        if (this.getEntryByCode(newEntry.CODIGO)) {
            throw new Error('El código ya existe');
        }

        // Add new entry
        const entry = {
            CODIGO: newEntry.CODIGO,
            DESCRIPCION: newEntry.DESCRIPCION.trim(),
            SINONIMO: newEntry.SINONIMO ? newEntry.SINONIMO.trim() : ''
        };

        this.data.push(entry);
        this.saveData();
        return entry;
    }

    // Update entry
    updateEntry(codigo, updatedEntry) {
        const index = this.data.findIndex(entry => entry.CODIGO == codigo);
        if (index === -1) {
            throw new Error('Entrada no encontrada');
        }

        // Update fields
        if (updatedEntry.DESCRIPCION) {
            this.data[index].DESCRIPCION = updatedEntry.DESCRIPCION.trim();
        }
        if (updatedEntry.SINONIMO !== undefined) {
            this.data[index].SINONIMO = updatedEntry.SINONIMO.trim();
        }

        this.saveData();
        return this.data[index];
    }

    // Delete entry
    deleteEntry(codigo) {
        const index = this.data.findIndex(entry => entry.CODIGO == codigo);
        if (index === -1) {
            throw new Error('Entrada no encontrada');
        }

        const deletedEntry = this.data.splice(index, 1)[0];
        this.saveData();
        return deletedEntry;
    }
}

// Initialize API instance
const nomenklatorAPI = new NomenklatorAPI();

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
        const { method } = req;
        const { path } = req.query;
        
        // Parse the path
        const pathSegments = Array.isArray(path) ? path : [path];
        const endpoint = pathSegments[0];
        const codigo = pathSegments[1];

        // Route handling
        if (endpoint === 'stats') {
            if (method === 'GET') {
                const stats = nomenklatorAPI.getStats();
                res.status(200).json(stats);
                return;
            }
        }

        if (endpoint === 'search') {
            if (method === 'GET') {
                const query = req.query.q || '';
                const entries = nomenklatorAPI.searchEntries(query);
                res.status(200).json(entries);
                return;
            }
        }

        if (codigo) {
            // Individual entry operations
            if (method === 'GET') {
                const entry = nomenklatorAPI.getEntryByCode(codigo);
                if (entry) {
                    res.status(200).json(entry);
                } else {
                    res.status(404).json({ error: 'Entrada no encontrada' });
                }
                return;
            }

            if (method === 'PUT') {
                const updatedEntry = nomenklatorAPI.updateEntry(codigo, req.body);
                res.status(200).json(updatedEntry);
                return;
            }

            if (method === 'DELETE') {
                const deletedEntry = nomenklatorAPI.deleteEntry(codigo);
                res.status(200).json(deletedEntry);
                return;
            }
        }

        // Default route - get all entries or add new entry
        if (method === 'GET') {
            const entries = nomenklatorAPI.getAllEntries();
            res.status(200).json(entries);
            return;
        }

        if (method === 'POST') {
            const newEntry = nomenklatorAPI.addEntry(req.body);
            res.status(201).json(newEntry);
            return;
        }

        // If no route matches
        res.status(404).json({ error: 'Endpoint no encontrado' });

    } catch (error) {
        console.error('Nomenklator API Error:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
