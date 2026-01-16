// api/auth.js - Rota corrigida
export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Código não fornecido' });
      }
      
      const CLIENT_ID = process.env.CLIENT_ID || '1458428006472220672';
      const CLIENT_SECRET = process.env.CLIENT_SECRET || '68c_YaOt8CzhKXCUZROxlzy9R8vDbckj';
      const REDIRECT_URI = process.env.REDIRECT_URI || 'https://molly-lemon.vercel.app/';
      
      // Trocar código por token
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify guilds'
      });
      
      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        // Redirecionar de volta para a página principal com sucesso
        // Em vez de retornar JSON, podemos redirecionar
        res.status(200).json({
          access_token: data.access_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
          redirect: '/?auth=success'
        });
      } else {
        res.status(400).json({ 
          error: 'Falha na autenticação',
          details: data 
        });
      }
      
    } catch (error) {
      console.error('Erro no auth:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
