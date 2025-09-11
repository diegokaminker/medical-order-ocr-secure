// Simple GitHub-based storage for nomenklator data
// This uses GitHub API to read/write the JSON file

const GITHUB_OWNER = 'diegokaminker';
const GITHUB_REPO = 'medical-order-ocr-secure';
const GITHUB_FILE_PATH = 'nomenklator.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get data from GitHub
async function fetchFromGitHub() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Error fetching from GitHub:', error);
        return [];
    }
}

// Save data to GitHub
async function saveToGitHub(jsonData) {
    try {
        const content = JSON.stringify(jsonData, null, 2);
        const encodedContent = Buffer.from(content).toString('base64');

        // First get the current file to get the SHA
        const currentResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha = null;
        if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            sha = currentData.sha;
        }

        // Update the file
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update nomenklator data - ${new Date().toISOString()}`,
                    content: encodedContent,
                    sha: sha
                })
            }
        );

        if (!updateResponse.ok) {
            throw new Error(`Failed to update GitHub file: ${updateResponse.status}`);
        }

        console.log('✅ Data saved to GitHub successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving to GitHub:', error);
        return false;
    }
}

// Get all entries with caching
export async function getAllEntries() {
    const now = Date.now();
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
        return cachedData;
    }

    cachedData = await fetchFromGitHub();
    lastFetch = now;
    return cachedData;
}

// Get entry by codigo
export async function getEntryByCodigo(codigo) {
    const entries = await getAllEntries();
    return entries.find(entry => entry.CODIGO == codigo) || null;
}

// Search entries
export async function searchEntries(searchTerm) {
    const entries = await getAllEntries();
    const search = searchTerm.toLowerCase();
    
    return entries.filter(entry => 
        entry.DESCRIPCION.toLowerCase().includes(search) ||
        (entry.SINONIMO && entry.SINONIMO.toLowerCase().includes(search)) ||
        entry.CODIGO.toString().includes(search)
    );
}

// Create new entry
export async function createEntry(newEntry) {
    const entries = await getAllEntries();
    
    // Check if codigo already exists
    if (entries.find(entry => entry.CODIGO == newEntry.CODIGO)) {
        throw new Error('El código ya existe');
    }
    
    // Add new entry
    entries.push(newEntry);
    
    // Save to GitHub
    const success = await saveToGitHub(entries);
    if (!success) {
        throw new Error('Failed to save new entry');
    }
    
    // Clear cache
    cachedData = null;
    
    return newEntry;
}

// Update entry
export async function updateEntry(codigo, updates) {
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
    
    // Save to GitHub
    const success = await saveToGitHub(entries);
    if (!success) {
        throw new Error('Failed to save updated entry');
    }
    
    // Clear cache
    cachedData = null;
    
    return entries[entryIndex];
}

// Delete entry
export async function deleteEntry(codigo) {
    const entries = await getAllEntries();
    const entryIndex = entries.findIndex(entry => entry.CODIGO == codigo);
    
    if (entryIndex === -1) {
        throw new Error('Entrada no encontrada');
    }
    
    // Remove the entry
    const deletedEntry = entries.splice(entryIndex, 1)[0];
    
    // Save to GitHub
    const success = await saveToGitHub(entries);
    if (!success) {
        throw new Error('Failed to save after deletion');
    }
    
    // Clear cache
    cachedData = null;
    
    return deletedEntry;
}

// Get statistics
export async function getStats() {
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
}
