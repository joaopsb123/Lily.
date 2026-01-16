// Configurações do Discord OAuth2
const CLIENT_ID = '1458428006472220672';
const CLIENT_SECRET = '68c_YaOt8CzhKXCUZROxlzy9R8vDbckj';
const REDIRECT_URI = window.location.origin + window.location.pathname;
const DISCORD_API_URL = 'https://discord.com/api/v10';
const BOT_SERVER_URL = 'http://fi4.bot-hosting.net:20956'; // URL do seu bot

// Estado da aplicação
let user = null;
let token = null;
let guilds = [];
let channels = [];
let selectedGuild = null;
let selectedChannel = null;

// Elementos DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const loginSection = document.getElementById('login-section');
const userAvatar = document.getElementById('user-avatar');
const username = document.getElementById('username');
const userId = document.getElementById('user-id');
const serversSelect = document.getElementById('servers-select');
const channelsSelect = document.getElementById('channels-select');
const serversSection = document.getElementById('servers-section');
const channelsSection = document.getElementById('channels-section');
const noServers = document.getElementById('no-servers');
const messageSection = document.getElementById('message-section');
const loginToSend = document.getElementById('login-to-send');
const sendTestBtn = document.getElementById('send-test-btn');
const sendCustomBtn = document.getElementById('send-custom-btn');
const messageContent = document.getElementById('message-content');
const simpleBtn = document.getElementById('simple-btn');
const resultModal = document.getElementById('result-modal');
const modalMessage = document.getElementById('modal-message');
const closeModal = document.getElementById('close-modal');
const connectionStatus = document.getElementById('connection-status');

// Verificar token na URL (callback do OAuth)
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
        // Remover token da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        token = accessToken;
        fetchUserData();
    }
    
    // Testar conexão com o bot
    testBotConnection();
    
    // Verificar se já está autenticado
    const savedToken = localStorage.getItem('discord_token');
    if (savedToken) {
        token = savedToken;
        fetchUserData();
    }
});

// Login com Discord
loginBtn.addEventListener('click', () => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20guilds`;
    window.location.href = authUrl;
});

// Logout
logoutBtn.addEventListener('click', () => {
    logout();
});

// Selecionar servidor
serversSelect.addEventListener('change', async (e) => {
    selectedGuild = e.target.value;
    if (selectedGuild) {
        await fetchChannels(selectedGuild);
        channelsSection.classList.remove('hidden');
    } else {
        channelsSection.classList.add('hidden');
    }
});

// Selecionar canal
channelsSelect.addEventListener('change', (e) => {
    selectedChannel = e.target.value;
    if (selectedChannel) {
        messageSection.classList.remove('hidden');
        loginToSend.classList.add('hidden');
    }
});

// Enviar mensagem de teste
sendTestBtn.addEventListener('click', () => {
    if (!selectedChannel) {
        showModal('Por favor, selecione um canal primeiro!', 'error');
        return;
    }
    
    sendMessage('Esta é uma mensagem de teste enviada pelo site! 🚀\nClique aqui: https://discord.com/channels/' + selectedGuild + '/' + selectedChannel);
});

// Enviar mensagem personalizada
sendCustomBtn.addEventListener('click', () => {
    if (!selectedChannel) {
        showModal('Por favor, selecione um canal primeiro!', 'error');
        return;
    }
    
    const content = messageContent.value.trim();
    if (!content) {
        showModal('Por favor, digite uma mensagem!', 'error');
        return;
    }
    
    sendMessage(content);
});

// Botão simples (funcionalidade original)
simpleBtn.addEventListener('click', () => {
    if (!selectedChannel) {
        showModal('Por favor, faça login e selecione um canal primeiro!', 'error');
        return;
    }
    
    sendMessage('Olá! Esta mensagem foi enviada através do botão "Clique Aqui" no site! 👋\nCanal: <#' + selectedChannel + '>');
});

// Fechar modal
closeModal.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

// Função para buscar dados do usuário
async function fetchUserData() {
    try {
        const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            user = await response.json();
            displayUserInfo();
            fetchUserGuilds();
            localStorage.setItem('discord_token', token);
        } else {
            throw new Error('Falha na autenticação');
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        showModal('Erro ao carregar dados do usuário', 'error');
    }
}

// Função para exibir informações do usuário
function displayUserInfo() {
    if (user) {
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        userAvatar.src = avatarUrl;
        username.textContent = user.global_name || user.username;
        userId.textContent = `ID: ${user.id}`;
        
        loginSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Status: Conectado como ' + (user.global_name || user.username);
        connectionStatus.className = 'status-online';
    }
}

// Função para buscar servidores do usuário
async function fetchUserGuilds() {
    try {
        const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            guilds = await response.json();
            populateGuildsSelect();
        } else {
            throw new Error('Falha ao buscar servidores');
        }
    } catch (error) {
        console.error('Erro ao buscar servidores:', error);
    }
}

// Função para popular select de servidores
function populateGuildsSelect() {
    serversSelect.innerHTML = '<option value="">Selecione um servidor...</option>';
    
    if (guilds.length === 0) {
        noServers.classList.remove('hidden');
        serversSection.classList.add('hidden');
        return;
    }
    
    noServers.classList.add('hidden');
    serversSection.classList.remove('hidden');
    
    // Ordenar servidores por nome
    guilds.sort((a, b) => a.name.localeCompare(b.name));
    
    guilds.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        serversSelect.appendChild(option);
    });
}

// Função para buscar canais de um servidor
async function fetchChannels(guildId) {
    try {
        // Nota: Esta API requer permissões do bot no servidor
        // Esta é uma implementação simplificada
        // Em produção, você precisaria de um backend para isso
        
        // Para demonstração, vamos criar alguns canais fictícios
        // Em um caso real, você faria uma chamada para seu backend
        // que tem o token do bot para buscar os canais
        
        channels = [
            { id: '1', name: 'geral', type: 0 },
            { id: '2', name: 'testes', type: 0 },
            { id: '3', name: 'comandos', type: 0 },
            { id: '4', name: 'anúncios', type: 0 }
        ];
        
        populateChannelsSelect();
        
        // Se você tiver um backend configurado, descomente:
        /*
        const response = await fetch(`${BOT_SERVER_URL}/channels/${guildId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            channels = await response.json();
            populateChannelsSelect();
        }
        */
        
    } catch (error) {
        console.error('Erro ao buscar canais:', error);
        showModal('Erro ao carregar canais. Verifique se o bot está no servidor.', 'error');
    }
}

// Função para popular select de canais
function populateChannelsSelect() {
    channelsSelect.innerHTML = '<option value="">Selecione um canal...</option>';
    
    // Filtrar apenas canais de texto (type 0)
    const textChannels = channels.filter(channel => channel.type === 0);
    
    textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        channelsSelect.appendChild(option);
    });
}

// Função para enviar mensagem
async function sendMessage(content) {
    try {
        if (!selectedChannel || !content) {
            showModal('Canal ou mensagem inválidos!', 'error');
            return;
        }
        
        // Aqui você enviaria para seu backend que comunica com o bot
        // Esta é uma implementação simulada
        
        showModal(`Mensagem enviada para o canal!<br><br>
                  <strong>Conteúdo:</strong> ${content}<br><br>
                  <em>Nota: Em produção, esta mensagem seria enviada através do seu bot.</em>`, 'success');
        
        // Simulação de envio (remova em produção)
        console.log('Simulando envio de mensagem:');
        console.log('- Canal:', selectedChannel);
        console.log('- Conteúdo:', content);
        console.log('- Servidor:', selectedGuild);
        
        // Em produção, descomente:
        /*
        const response = await fetch(`${BOT_SERVER_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                channelId: selectedChannel,
                content: content,
                guildId: selectedGuild
            })
        });
        
        if (response.ok) {
            showModal('Mensagem enviada com sucesso!', 'success');
        } else {
            throw new Error('Falha ao enviar mensagem');
        }
        */
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showModal('Erro ao enviar mensagem: ' + error.message, 'error');
    }
}

// Função para testar conexão com o bot
async function testBotConnection() {
    try {
        // Tentar conectar ao servidor do bot
        // Em produção, você teria um endpoint de health check
        showModal('Testando conexão com o bot...', 'info');
        
        // Simulação - em produção, você faria uma requisição real
        setTimeout(() => {
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Status: Conectado ao bot (simulado)';
            connectionStatus.className = 'status-online';
        }, 1000);
        
        /*
        // Código real (descomente quando seu bot estiver configurado)
        const response = await fetch(`${BOT_SERVER_URL}/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Status: Conectado ao bot';
            connectionStatus.className = 'status-online';
        } else {
            throw new Error('Bot offline');
        }
        */
        
    } catch (error) {
        console.error('Erro de conexão:', error);
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Status: Bot offline (modo simulação)';
        connectionStatus.className = 'status-offline';
    }
}

// Função para logout
function logout() {
    user = null;
    token = null;
    guilds = [];
    channels = [];
    selectedGuild = null;
    selectedChannel = null;
    
    userInfo.classList.add('hidden');
    loginSection.classList.remove('hidden');
    serversSection.classList.add('hidden');
    channelsSection.classList.add('hidden');
    messageSection.classList.add('hidden');
    loginToSend.classList.remove('hidden');
    
    localStorage.removeItem('discord_token');
    
    connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Status: Desconectado';
    connectionStatus.className = 'status-offline';
    
    showModal('Logout realizado com sucesso!', 'info');
}

// Função para exibir modal
function showModal(message, type = 'info') {
    modalMessage.innerHTML = message;
    
    const icon = resultModal.querySelector('i');
    const title = resultModal.querySelector('h3');
    
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#ed4245';
        title.textContent = 'Erro!';
        title.style.color = '#ed4245';
    } else if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#3ba55d';
        title.textContent = 'Sucesso!';
        title.style.color = '#3ba55d';
    } else {
        icon.className = 'fas fa-info-circle';
        icon.style.color = '#7289da';
        title.textContent = 'Informação';
        title.style.color = '#7289da';
    }
    
    resultModal.classList.remove('hidden');
}
