// Configurações
const CLIENT_ID = '1458428006472220672';
const REDIRECT_URI = encodeURIComponent('https://molly-lemon.vercel.app/');
const API_URL = 'https://molly-lemon.vercel.app/api'; // Backend no Vercel

// Elementos DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login-section');
const userSection = document.getElementById('user-section');
const guildsSection = document.getElementById('guilds-section');
const messageSection = document.getElementById('message-section');
const guildSelect = document.getElementById('guild-select');
const channelSelect = document.getElementById('channel-select');
const channelsSection = document.getElementById('channels-section');
const sendBtn = document.getElementById('send-btn');
const testBtn = document.getElementById('test-btn');
const simpleBtn = document.getElementById('simple-btn');
const messageInput = document.getElementById('message-input');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

// Estado
let user = null;
let token = null;
let guilds = [];
let selectedGuild = null;
let selectedChannel = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se veio código da URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Trocar código por token
        exchangeCodeForToken(code);
    }
    
    // Verificar token salvo
    const savedToken = localStorage.getItem('discord_token');
    if (savedToken) {
        token = savedToken;
        fetchUserData();
    }
    
    // Configurar eventos
    setupEventListeners();
});

// Configurar listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', () => {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=1458428006472220672&response_type=code&redirect_uri=https%3A%2F%2Fmolly-lemon.vercel.app%2Fauth&scope=identify+guilds`;
        window.location.href = authUrl;
    });
    
    logoutBtn.addEventListener('click', logout);
    
    guildSelect.addEventListener('change', (e) => {
        selectedGuild = e.target.value;
        if (selectedGuild) {
            fetchChannels(selectedGuild);
        }
    });
    
    channelSelect.addEventListener('change', (e) => {
        selectedChannel = e.target.value;
        if (selectedChannel) {
            messageSection.classList.remove('hidden');
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);
    testBtn.addEventListener('click', () => {
        messageInput.value = "🚀 Teste rápido do bot!";
        sendMessage();
    });
    
    simpleBtn.addEventListener('click', () => {
        if (!selectedChannel) {
            showModal('Selecione um canal primeiro!', 'error');
            return;
        }
        sendSimpleMessage();
    });
    
    modalClose.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Trocar código por token
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            localStorage.setItem('discord_token', token);
            
            // Limpar código da URL
            window.history.replaceState({}, '', '/');
            
            fetchUserData();
            showModal('Login realizado com sucesso!', 'success');
        } else {
            throw new Error('Falha na autenticação');
        }
    } catch (error) {
        console.error('Erro:', error);
        showModal('Erro no login', 'error');
    }
}

// Buscar dados do usuário
async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            user = await response.json();
            displayUserInfo();
            fetchUserGuilds();
            updateStatus(true);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Exibir info do usuário
function displayUserInfo() {
    if (user) {
        document.getElementById('user-avatar').src = 
            user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
                       : 'https://cdn.discordapp.com/embed/avatars/0.png';
        document.getElementById('username').textContent = user.global_name || user.username;
        document.getElementById('user-tag').textContent = `@${user.username}`;
        
        loginSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        guildsSection.classList.remove('hidden');
    }
}

// Buscar servidores
async function fetchUserGuilds() {
    try {
        const response = await fetch(`${API_URL}/guilds`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            guilds = await response.json();
            populateGuildsSelect();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Popular select de servidores
function populateGuildsSelect() {
    guildSelect.innerHTML = '<option value="">Selecione um servidor</option>';
    
    guilds.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        guildSelect.appendChild(option);
    });
}

// Buscar canais
async function fetchChannels(guildId) {
    try {
        const response = await fetch(`${API_URL}/guilds/${guildId}/channels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const channels = await response.json();
            populateChannelsSelect(channels);
            channelsSection.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Popular select de canais
function populateChannelsSelect(channels) {
    channelSelect.innerHTML = '<option value="">Selecione um canal</option>';
    
    // Filtrar apenas canais de texto
    const textChannels = channels.filter(c => c.type === 0);
    
    textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        channelSelect.appendChild(option);
    });
}

// Enviar mensagem
async function sendMessage() {
    if (!selectedChannel || !messageInput.value) {
        showModal('Selecione um canal e digite uma mensagem', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                channelId: selectedChannel,
                content: messageInput.value,
                guildId: selectedGuild
            })
        });
        
        if (response.ok) {
            showModal('Mensagem enviada com sucesso!', 'success');
        } else {
            throw new Error('Falha ao enviar');
        }
    } catch (error) {
        console.error('Erro:', error);
        showModal('Erro ao enviar mensagem', 'error');
    }
}

// Enviar mensagem simples
async function sendSimpleMessage() {
    const message = `✅ Mensagem enviada pelo bot!\n🕐 ${new Date().toLocaleTimeString()}\n🔗 Via: https://molly-lemon.vercel.app`;
    
    try {
        const response = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                channelId: selectedChannel,
                content: message,
                guildId: selectedGuild
            })
        });
        
        if (response.ok) {
            showModal('Mensagem simples enviada!', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Logout
function logout() {
    localStorage.removeItem('discord_token');
    token = null;
    user = null;
    
    userSection.classList.add('hidden');
    guildsSection.classList.add('hidden');
    messageSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    updateStatus(false);
    showModal('Logout realizado', 'info');
}

// Mostrar modal
function showModal(message, type = 'info') {
    const title = document.getElementById('modal-title');
    const msg = document.getElementById('modal-message');
    
    msg.textContent = message;
    
    if (type === 'error') {
        title.textContent = '❌ Erro';
        title.style.color = '#ed4245';
    } else if (type === 'success') {
        title.textContent = '✅ Sucesso';
        title.style.color = '#3ba55d';
    } else {
        title.textContent = 'ℹ️ Informação';
        title.style.color = '#7289da';
    }
    
    modal.classList.remove('hidden');
}

// Atualizar status
function updateStatus(online) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (online) {
        indicator.className = 'status-online';
        text.textContent = `Conectado como ${user?.global_name || user?.username}`;
    } else {
        indicator.className = 'status-offline';
        text.textContent = 'Desconectado';
    }
}
