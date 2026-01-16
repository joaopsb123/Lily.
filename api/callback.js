// api/callback.js - Processar callback do Discord
export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET') {
    const { code } = req.query;
    
    if (!code) {
      // Se não tem código, redirecionar para login
      return res.redirect('/?error=no_code');
    }
    
    // HTML que processa o código e fecha a janela
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Autenticando...</title>
      <script>
        // Enviar código para o servidor principal
        async function processCode() {
          try {
            const response = await fetch('/api/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: '${code}' })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
              // Salvar token no localStorage da janela principal
              window.opener.postMessage({
                type: 'DISCORD_AUTH_SUCCESS',
                token: data.access_token
              }, '*');
              
              // Fechar janela
              setTimeout(() => window.close(), 500);
            } else {
              window.opener.postMessage({
                type: 'DISCORD_AUTH_ERROR',
                error: data.error
              }, '*');
              setTimeout(() => window.close(), 1000);
            }
          } catch (error) {
            window.opener.postMessage({
              type: 'DISCORD_AUTH_ERROR',
              error: 'Erro na comunicação'
            }, '*');
            setTimeout(() => window.close(), 1000);
          }
        }
        
        // Executar quando a página carregar
        window.onload = processCode;
      </script>
    </head>
    <body style="background: #36393f; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
      <div style="text-align: center;">
        <h2>🔐 Autenticando com Discord...</h2>
        <p>Por favor, aguarde.</p>
        <div style="margin-top: 20px;">
          <div style="width: 50px; height: 50px; border: 5px solid #7289da; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
