import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NomenklatorMatcher {
    constructor() {
        this.nomenklatorData = null;
        this.loadNomenklatorData();
    }

    loadNomenklatorData() {
        try {
            const filePath = path.join(__dirname, '..', 'nomenklator.json');
            
            if (!fs.existsSync(filePath)) {
                console.warn('Nomenklator JSON file not found at:', filePath);
                return;
            }

            const jsonData = fs.readFileSync(filePath, 'utf8');
            this.nomenklatorData = JSON.parse(jsonData);
            
            console.log(`✅ Loaded ${this.nomenklatorData.length} nomenklator entries from JSON`);
            
        } catch (error) {
            console.error('Error loading nomenklator data:', error);
            this.nomenklatorData = [];
        }
    }

    /**
     * Normalize text for comparison
     * @param {string} text - Text to normalize
     * @returns {string} - Normalized text
     */
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .trim()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/ç/g, 'c')
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' '); // Normalize spaces
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Similarity score (0-1, where 1 is perfect match)
     */
    calculateSimilarity(str1, str2) {
        const s1 = this.normalizeText(str1);
        const s2 = this.normalizeText(str2);
        
        if (s1 === s2) return 1.0;
        
        const maxLength = Math.max(s1.length, s2.length);
        if (maxLength === 0) return 1.0;
        
        const distance = this.levenshteinDistance(s1, s2);
        return 1 - (distance / maxLength);
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Find matches for a service description
     * @param {string} serviceDescription - Service description from OCR
     * @param {number} threshold - Minimum similarity threshold (0-1)
     * @returns {Array} - Array of matching entries with scores
     */
    findMatches(serviceDescription, threshold = 0.7) {
        if (!this.nomenklatorData || this.nomenklatorData.length === 0) {
            return [];
        }

        const matches = [];
        const normalizedInput = this.normalizeText(serviceDescription);

        for (const entry of this.nomenklatorData) {
            // Check description match
            const descriptionScore = this.calculateSimilarity(serviceDescription, entry.DESCRIPCION);
            
            // Check synonym match if exists
            let synonymScore = 0;
            if (entry.SINONIMO && entry.SINONIMO !== '-') {
                // Split synonyms by comma and check each one
                const synonyms = entry.SINONIMO.split(',').map(s => s.trim());
                for (const synonym of synonyms) {
                    const currentSynonymScore = this.calculateSimilarity(serviceDescription, synonym);
                    synonymScore = Math.max(synonymScore, currentSynonymScore);
                }
            }

            // If we found a perfect match (100%), return immediately
            if (descriptionScore === 1.0 || synonymScore === 1.0) {
                const perfectMatch = {
                    codigo: entry.CODIGO,
                    descripcion: entry.DESCRIPCION,
                    sinonimo: entry.SINONIMO !== '-' ? entry.SINONIMO : null,
                    atajo: entry.ATAJO,
                    score: 1.0,
                    matchType: descriptionScore === 1.0 ? 'description' : 'synonym'
                };
                return [perfectMatch]; // Return immediately with perfect match
            }

            // Check if any part of the input matches any part of description/synonym
            let partialScore = 0;
            const inputWords = normalizedInput.split(' ');
            const descriptionWords = this.normalizeText(entry.DESCRIPCION).split(' ');
            
            // Get all synonym words from comma-separated synonyms
            let synonymWords = [];
            if (entry.SINONIMO && entry.SINONIMO !== '-') {
                const synonyms = entry.SINONIMO.split(',').map(s => s.trim());
                for (const synonym of synonyms) {
                    const words = this.normalizeText(synonym).split(' ');
                    synonymWords = synonymWords.concat(words);
                }
            }

            // Calculate partial word matches
            let wordMatches = 0;
            for (const inputWord of inputWords) {
                if (inputWord.length < 3) continue; // Skip short words
                
                for (const descWord of descriptionWords) {
                    if (descWord.length < 3) continue;
                    if (this.calculateSimilarity(inputWord, descWord) > 0.8) {
                        wordMatches++;
                        break;
                    }
                }
                
                for (const synWord of synonymWords) {
                    if (synWord.length < 3) continue;
                    if (this.calculateSimilarity(inputWord, synWord) > 0.8) {
                        wordMatches++;
                        break;
                    }
                }
            }
            
            partialScore = inputWords.length > 0 ? wordMatches / inputWords.length : 0;

            // Take the highest score
            const bestScore = Math.max(descriptionScore, synonymScore, partialScore);

            if (bestScore >= threshold) {
                matches.push({
                    codigo: entry.CODIGO,
                    descripcion: entry.DESCRIPCION,
                    sinonimo: entry.SINONIMO !== '-' ? entry.SINONIMO : null,
                    atajo: entry.ATAJO,
                    score: bestScore,
                    matchType: bestScore === descriptionScore ? 'description' : 
                              bestScore === synonymScore ? 'synonym' : 'partial'
                });
            }
        }

        // Sort by score (highest first)
        return matches.sort((a, b) => b.score - a.score);
    }

    /**
     * Get the best match for a service description
     * @param {string} serviceDescription - Service description from OCR
     * @param {number} threshold - Minimum similarity threshold (0-1)
     * @returns {Object|null} - Best match or null if no match found
     */
    getBestMatch(serviceDescription, threshold = 0.7) {
        const matches = this.findMatches(serviceDescription, threshold);
        return matches.length > 0 ? matches[0] : null;
    }

    /**
     * Process multiple services and return matches
     * @param {Array} services - Array of service descriptions
     * @param {number} threshold - Minimum similarity threshold (0-1)
     * @returns {Array} - Array of processed services with matches
     */
    processServices(services, threshold = 0.7) {
        if (!Array.isArray(services)) {
            return [];
        }

        return services.map(service => {
            const matches = this.findMatches(service, threshold);
            return {
                originalService: service,
                bestMatch: matches.length > 0 ? matches[0] : null,
                allMatches: matches,
                hasMatch: matches.length > 0
            };
        });
    }

    /**
     * Get statistics about the nomenklator data
     * @returns {Object} - Statistics
     */
    getStats() {
        if (!this.nomenklatorData) {
            return { totalEntries: 0, entriesWithSynonyms: 0 };
        }

        const entriesWithSynonyms = this.nomenklatorData.filter(entry => 
            entry.SINONIMO && entry.SINONIMO !== '-'
        ).length;

        return {
            totalEntries: this.nomenklatorData.length,
            entriesWithSynonyms: entriesWithSynonyms,
            entriesWithoutSynonyms: this.nomenklatorData.length - entriesWithSynonyms
        };
    }
}

export default NomenklatorMatcher;