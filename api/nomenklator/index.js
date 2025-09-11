// Simple nomenklator endpoint - returns mock data for now
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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // For now, return mock data until we fix the file access issue
        const mockData = [
            {
                "CODIGO": "660878",
                "DESCRIPCION": "TRIIODOTIRONINA TOTAL T3",
                "SINONIMO": "T3 TOTAL (T3),triiodotironina,T3"
            },
            {
                "CODIGO": "660902", 
                "DESCRIPCION": "UREMIA",
                "SINONIMO": "UREA"
            },
            {
                "CODIGO": "660001",
                "DESCRIPCION": "HEMOGLOBINA GLICOSILADA",
                "SINONIMO": "HbA1c,hemoglobina glicosilada"
            }
        ];

        res.status(200).json({
            success: true,
            data: mockData
        });
    } catch (error) {
        console.error('Nomenklator API Error:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
