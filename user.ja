// api/auth.js - Backend no Vercel
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { code } = req.body;
        const CLIENT_ID = '1458428006472220672';
        const CLIENT_SECRET = '68c_YaOt8CzhKXCUZROxlzy9R8vDbckj';
        const REDIRECT_URI = 'https://molly-lemon.vercel.app/';
        
        try {
            // Trocar código por token
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    scope: 'identify guilds'
                })
            });
            
            const tokens = await tokenResponse.json();
            
            if (tokens.access_token) {
                res.status(200).json({
                    access_token: tokens.access_token,
                    expires_in: tokens.expires_in
                });
            } else {
                res.status(400).json({ error: 'Invalid code' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Authentication failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
