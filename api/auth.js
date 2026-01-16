export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      
      console.log('🔐 Recebendo código:', code?.substring(0, 10) + '...');
      
      if (!code) {
        return res.status(400).json({ error: 'Código não fornecido' });
      }
      
      const CLIENT_ID = process.env.CLIENT_ID || '1458428006472220672';
      const CLIENT_SECRET = process.env.CLIENT_SECRET || '68c_YaOt8CzhKXCUZROxlzy9R8vDbckj';
      const REDIRECT_URI = process.env.REDIRECT_URI || 'https://molly-lemon.vercel.app/';
      
      console.log('🔄 Tentando trocar código por token...');
      
      // Trocar código por token
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify guilds'
      });
      
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });
      
      const tokenData = await tokenResponse.json();
      
      console.log('📊 Resposta do Discord:', {
        hasToken: !!tokenData.access_token,
        error: tokenData.error,
        errorDesc: tokenData.error_description
      });
      
      if (tokenData.access_token) {
        console.log('✅ Token obtido com sucesso!');
        return res.status(200).json({
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type
        });
      } else {
        console.error('❌ Erro do Discord:', tokenData);
        return res.status(400).json({
          error: 'Falha na autenticação',
          details: tokenData.error_description || tokenData.error
        });
      }
      
    } catch (error) {
      console.error('💥 Erro no servidor:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
        }
