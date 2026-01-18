const axios = require('axios');

export default async function handler(req, res) {
    const CLIENT_ID = '1458428006472220672';
    const CLIENT_SECRET = '68c_YaOt8CzhKXCUZROxlzy9R8vDbckj';
    const REDIRECT_URI = 'https://molly-lemon.vercel.app/api/auth';

    const { code } = req.query;

    if (!code) {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify+guilds`;
        return res.redirect(url);
    }

    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        });

        const response = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Manda o token para o seu index.html via URL
        return res.redirect(`/?token=${response.data.access_token}`);
    } catch (error) {
        return res.status(500).json({ error: 'Erro no OAuth2', details: error.message });
    }
}
