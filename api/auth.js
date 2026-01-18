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
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            scope: 'identify guilds'
        }));

        const token = response.data.access_token;
        // Redireciona de volta para o index com o token na URL
        res.redirect(`/?token=${token}`);
    } catch (error) {
        res.status(500).json({ error: 'Falha na autenticação' });
    }
}
