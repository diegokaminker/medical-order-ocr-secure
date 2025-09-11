// Debug endpoint to check blob storage
import { list } from '@vercel/blob';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // List all blobs
        const result = await list({
            limit: 10
        });

        console.log('🔍 Blob list result:', result);

        const data = result?.data || [];
        
        res.status(200).json({
            success: true,
            data: {
                blobCount: data.length,
                blobs: data.map(blob => ({
                    keyname: blob.keyname,
                    url: blob.url,
                    size: blob.size,
                    uploadedAt: blob.uploadedAt
                })),
                rawResult: result
            }
        });
    } catch (error) {
        console.error('Debug API Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error checking blob storage',
            details: error.message 
        });
    }
}
