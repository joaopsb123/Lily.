// CONFIGURAÇÕES
const CONFIG = {
    CLIENT_ID: '1458428006472220672',
    API_URL: 'https://molly-lemon.vercel.app/api',
    BOT_URL: 'http://fi4.bot-hosting.net:20956',
    REDIRECT_URI: 'https://molly-lemon.vercel.app/auth'
};

// ESTADO
const state = {
    user: null, token: null, guilds: [], channels: [],
    selectedGuild: null, selectedChannel: null, botConnected: false
};

// ELEMENTOS DOM
const el = {
    statusIndicator: document.getElementById('status-indicator'),
    statusText: document.getElementById('status-text'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    loginSection: document.getElementById('login-section'),
    userSection: document.getElementById('user-section'),
    userAvatar: document.getElementById('user-avatar'),
    username: document.getElementById('username'),
    userTag: document.getElementById('user-tag'),
    guildsSection: document.getElementById('guilds-section'),
    channelsSection: document.getElementById('channels-section'),
    guildSelect: document.getElementById('guild-select'),
    channelSelect: document.getElementById('channel-select'),
    messageSection: document.getElementById('message-section'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    testBtn: document.getElementById('test-btn'),
    simpleBtn: document.getElementById('simple-btn'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalClose: document.getElementById('modal-close')
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const savedToken = localStorage.getItem('discord_token');
    
    if (savedToken) {
        state.token = savedToken;
        await fetchUserData();
    }
    
    if (code) await handleDiscordCallback(code);
    
    await testBotConnection();
    setupEventListeners();
});

// EVENT LISTENERS
function setupEventListeners() {
    el.loginBtn.addEventListener('click', handleLogin);
    el.logoutBtn.addEventListener('click', handleLogout);
    el.guildSelect.addEventListener('change', handleGuildSelect);
    el.channelSelect.addEventListener('change', handleChannelSelect);
    el.sendBtn.addEventListener('click', handleSendMessage);
    el.testBtn.addEventListener('click', handleTestMessage);
    el.simpleBtn.addEventListener('click', handleSimpleButton);
    el.modalClose.addEventListener('click', () => el.modal.classList.add('hidden'));
    window.addEventListener('message', handleAuthMessage);
}

// HANDLERS
async function handleLogin() {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=1458428006472220672&response_type=code&redirect_uri=https%3A%2F%2Fmolly-lemon.vercel.app%2Fauth&scope=identify+guilds+email`;
    window.open(authUrl, 'Discord Login', 'width=600,height=700,resizable=yes');
}

function handleLogout() {
    state.user = state.token = state.guilds = state.channels = null;
    state.selectedGuild = state.selectedChannel = null;
    localStorage.removeItem('discord_token');
    el.userSection.classList.add('hidden');
    el.guildsSection.classList.add('hidden');
    el.channelsSection.classList.add('hidden');
    el.messageSection.classList.add('hidden');
    el.loginSection.classList.remove('hidden');
    el.guildSelect.innerHTML = '<option value="">Selecione um servidor</option>';
    el.channelSelect.innerHTML = '<option value="">Selecione um canal</option>';
    updateStatus(false);
    showModal('✅ Logout realizado!', 'success');
}

async function handleGuildSelect(event) {
    state.selectedGuild = event.target.value;
    if (state.selectedGuild) await fetchChannels(state.selectedGuild);
    else {
        el.channelsSection.classList.add('hidden');
        el.messageSection.classList.add('hidden');
    }
}

function handleChannelSelect(event) {
    state.selectedChannel = event.target.value;
    el.messageSection.classList.toggle('hidden', !state.selectedChannel);
}

async function handleSendMessage() {
    if (!validateSendConditions()) return;
    const message = el.messageInput.value.trim();
    if (!message) return showModal('❌ Digite uma mensagem!', 'error');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                channelId: state.selectedChannel,
                content: message,
                guildId: state.selectedGuild
            })
        });
        
        if (response.ok) {
            showModal('✅ Mensagem enviada!', 'success');
            el.messageInput.value = '';
        } else throw new Error('Falha ao enviar');
    } catch (error) {
        showModal('❌ Erro ao enviar mensagem.', 'error');
    }
}

function handleTestMessage() {
    if (!validateSendConditions()) return;
    el.messageInput.value = `🚀 **Mensagem de teste!**\n✅ ${new Date().toLocaleTimeString()}\n🔗 https://molly-lemon.vercel.app`;
    setTimeout(() => handleSendMessage(), 1000);
}

function handleSimpleButton() {
    if (!validateSendConditions()) return;
    const message = `🖱️ **Botão "Clique Aqui"!**\n✅ Canal: <#${state.selectedChannel}>\n👤 ${state.user?.global_name || state.user?.username}`;
    sendMessageDirectly(message);
}

function handleAuthMessage(event) {
    if (event.origin !== 'https://molly-lemon.vercel.app') return;
    if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        state.token = event.data.token;
        localStorage.setItem('discord_token', event.data.token);
        fetchUserData();
        showModal('🎉 Login realizado!', 'success');
    }
    if (event.data.type === 'DISCORD_AUTH_ERROR') {
        showModal(`❌ Erro: ${event.data.error}`, 'error');
    }
}

// AUTENTICAÇÃO
async function handleDiscordCallback(code) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        if (data.access_token) {
            state.token = data.access_token;
            localStorage.setItem('discord_token', data.access_token);
            window.history.replaceState({}, '', '/');
            await fetchUserData();
            showModal('🎉 Login realizado!', 'success');
        }
    } catch (error) {
        showModal('❌ Erro na autenticação.', 'error');
    }
}

// API FUNCTIONS
async function fetchUserData() {
    if (!state.token) return;
    try {
        const response = await fetch(`${CONFIG.API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (response.ok) {
            state.user = await response.json();
            updateUserInterface();
            await fetchUserGuilds();
            updateStatus(true);
        } else if (response.status === 401) handleLogout();
    } catch (error) {}
}

async function fetchUserGuilds() {
    if (!state.token) return;
    try {
        const response = await fetch(`${CONFIG.API_URL}/guilds`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (response.ok) {
            state.guilds = await response.json();
            updateGuildsSelect();
        }
    } catch (error) {}
}

async function fetchChannels(guildId) {
    if (!state.token) return;
    try {
        const response = await fetch(`${CONFIG.API_URL}/guilds/${guildId}/channels`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (response.ok) {
            const channels = await response.json();
            updateChannelsSelect(channels);
        } else await fetchChannelsFromBot(guildId);
    } catch (error) {
        await fetchChannelsFromBot(guildId);
    }
}

async function fetchChannelsFromBot(guildId) {
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/guilds/${guildId}/channels`);
        if (response.ok) updateChannelsSelect(await response.json());
    } catch (error) {
        showModal('⚠️ Não foi possível carregar canais.', 'warning');
    }
}

async function sendMessageDirectly(content) {
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: state.selectedChannel,
                message: content,
                guild_id: state.selectedGuild
            })
        });
        
        if (response.ok) showModal('✅ Mensagem enviada via bot!', 'success');
    } catch (error) {
        showModal('❌ Bot offline.', 'error');
    }
}

async function testBotConnection() {
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/health`).catch(() => null);
        state.botConnected = response && response.ok;
    } catch (error) {
        state.botConnected = false;
    }
}

// UI FUNCTIONS
function updateUserInterface() {
    if (!state.user) return;
    el.userAvatar.src = state.user.avatar 
        ? `https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}.png?size=256`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    el.username.textContent = state.user.global_name || state.user.username;
    el.userTag.textContent = `@${state.user.username}`;
    el.loginSection.classList.add('hidden');
    el.userSection.classList.remove('hidden');
    el.guildsSection.classList.remove('hidden');
}

function updateGuildsSelect() {
    if (!state.guilds || state.guilds.length === 0) return;
    el.guildSelect.innerHTML = '<option value="">Selecione um servidor</option>';
    [...state.guilds].sort((a, b) => a.name.localeCompare(b.name))
        .forEach(guild => {
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = guild.name;
            el.guildSelect.appendChild(option);
        });
}

function updateChannelsSelect(channels) {
    if (!channels || channels.length === 0) return;
    const textChannels = channels.filter(c => c.type === 0);
    if (textChannels.length === 0) return;
    
    el.channelSelect.innerHTML = '<option value="">Selecione um canal</option>';
    textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        el.channelSelect.appendChild(option);
    });
    el.channelsSection.classList.remove('hidden');
}

function updateStatus(authenticated) {
    if (authenticated && state.user) {
        el.statusIndicator.className = 'status-online';
        el.statusText.textContent = `Conectado como ${state.user.global_name || state.user.username}`;
    } else {
        el.statusIndicator.className = 'status-offline';
        el.statusText.textContent = 'Desconectado';
    }
}

function showModal(message, type = 'info') {
    let title, color;
    switch (type) {
        case 'success': title = '✅ Sucesso!'; color = '#3ba55d'; break;
        case 'error': title = '❌ Erro!'; color = '#ed4245'; break;
        case 'warning': title = '⚠️ Atenção!'; color = '#faa81a'; break;
        default: title = 'ℹ️ Informação'; color = '#7289da';
    }
    
    el.modalTitle.textContent = title;
    el.modalTitle.style.color = color;
    el.modalMessage.textContent = message;
    el.modal.classList.remove('hidden');
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => el.modal.classList.add('hidden'), 5000);
    }
}

// UTILITÁRIAS
function validateSendConditions() {
    if (!state.token) { showModal('❌ Faça login!', 'error'); return false; }
    if (!state.selectedGuild) { showModal('❌ Selecione servidor!', 'error'); return false; }
    if (!state.selectedChannel) { showModal('❌ Selecione canal!', 'error'); return false; }
    return true;
}

// DEBUG
window.appState = state;
window.showModal = showModal;
console.log('✨ Script.js carregado!');
