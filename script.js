// ============================================
// CONFIGURAÇÕES
// ============================================
const CONFIG = {
    CLIENT_ID: '1458428006472220672',
    API_URL: 'https://molly-lemon.vercel.app/api',
    BOT_URL: 'http://fi4.bot-hosting.net:20956',
    REDIRECT_URI: 'https://molly-lemon.vercel.app/auth'
};

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
const state = {
    user: null,
    token: null,
    guilds: [],
    channels: [],
    selectedGuild: null,
    selectedChannel: null,
    botConnected: false
};

// ============================================
// ELEMENTOS DOM
// ============================================
const elements = {
    // Status
    statusIndicator: document.getElementById('status-indicator'),
    statusText: document.getElementById('status-text'),
    
    // Login
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    loginSection: document.getElementById('login-section'),
    userSection: document.getElementById('user-section'),
    
    // User info
    userAvatar: document.getElementById('user-avatar'),
    username: document.getElementById('username'),
    userTag: document.getElementById('user-tag'),
    
    // Guilds & Channels
    guildsSection: document.getElementById('guilds-section'),
    channelsSection: document.getElementById('channels-section'),
    guildSelect: document.getElementById('guild-select'),
    channelSelect: document.getElementById('channel-select'),
    
    // Message
    messageSection: document.getElementById('message-section'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    testBtn: document.getElementById('test-btn'),
    simpleBtn: document.getElementById('simple-btn'),
    
    // Modal
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalClose: document.getElementById('modal-close')
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Discord Bot Controller...');
    
    // Verificar autenticação na URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
        // Limpar parâmetros da URL
        window.history.replaceState({}, '', '/');
    }
    
    // Verificar token salvo
    const savedToken = localStorage.getItem('discord_token');
    if (savedToken) {
        state.token = savedToken;
        await fetchUserData();
    }
    
    // Testar conexão com o bot
    await testBotConnection();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar se tem código na URL (callback do Discord)
    if (code) {
        await handleDiscordCallback(code);
    }
});

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Login
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Seleção
    elements.guildSelect.addEventListener('change', handleGuildSelect);
    elements.channelSelect.addEventListener('change', handleChannelSelect);
    
    // Mensagens
    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.testBtn.addEventListener('click', handleTestMessage);
    elements.simpleBtn.addEventListener('click', handleSimpleButton);
    
    // Modal
    elements.modalClose.addEventListener('click', () => {
        elements.modal.classList.add('hidden');
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.modal.classList.add('hidden');
        }
    });
    
    // Ouvir mensagens do popup de autenticação
    window.addEventListener('message', handleAuthMessage);
}

// ============================================
// HANDLERS PRINCIPAIS
// ============================================
async function handleLogin() {
    console.log('🔑 Iniciando login com Discord...');
    
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${CONFIG.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&scope=identify%20guilds&prompt=none`;
    
    // Abrir em popup para melhor UX
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
        authUrl,
        'Discord Login',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
}

function handleLogout() {
    console.log('👋 Realizando logout...');
    
    // Limpar estado
    state.user = null;
    state.token = null;
    state.guilds = [];
    state.channels = [];
    state.selectedGuild = null;
    state.selectedChannel = null;
    
    // Limpar localStorage
    localStorage.removeItem('discord_token');
    
    // Atualizar UI
    elements.userSection.classList.add('hidden');
    elements.guildsSection.classList.add('hidden');
    elements.channelsSection.classList.add('hidden');
    elements.messageSection.classList.add('hidden');
    elements.loginSection.classList.remove('hidden');
    
    // Resetar selects
    elements.guildSelect.innerHTML = '<option value="">Selecione um servidor</option>';
    elements.channelSelect.innerHTML = '<option value="">Selecione um canal</option>';
    
    // Atualizar status
    updateStatus(false);
    
    // Mostrar confirmação
    showModal('✅ Logout realizado com sucesso!', 'success');
}

async function handleGuildSelect(event) {
    const guildId = event.target.value;
    
    if (!guildId) {
        elements.channelsSection.classList.add('hidden');
        elements.messageSection.classList.add('hidden');
        state.selectedGuild = null;
        return;
    }
    
    state.selectedGuild = guildId;
    console.log(`🏠 Servidor selecionado: ${guildId}`);
    
    // Buscar canais do servidor
    await fetchChannels(guildId);
}

function handleChannelSelect(event) {
    const channelId = event.target.value;
    
    if (!channelId) {
        elements.messageSection.classList.add('hidden');
        state.selectedChannel = null;
        return;
    }
    
    state.selectedChannel = channelId;
    console.log(`📝 Canal selecionado: ${channelId}`);
    
    // Mostrar seção de mensagens
    elements.messageSection.classList.remove('hidden');
}

async function handleSendMessage() {
    if (!validateSendConditions()) return;
    
    const message = elements.messageInput.value.trim();
    
    if (!message) {
        showModal('❌ Digite uma mensagem primeiro!', 'error');
        return;
    }
    
    console.log(`✉️ Enviando mensagem: "${message.substring(0, 50)}..."`);
    
    try {
        // Enviar para o backend do Vercel
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
            const data = await response.json();
            showModal('✅ Mensagem enviada com sucesso!', 'success');
            elements.messageInput.value = ''; // Limpar campo
        } else {
            throw new Error('Falha ao enviar');
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showModal('❌ Erro ao enviar mensagem. Tente novamente.', 'error');
    }
}

function handleTestMessage() {
    if (!validateSendConditions()) return;
    
    const testMessage = `🚀 **Mensagem de teste do site!**\n\n✅ Bot funcionando corretamente\n🕐 ${new Date().toLocaleTimeString()}\n🔗 Enviado de: https://molly-lemon.vercel.app`;
    
    elements.messageInput.value = testMessage;
    
    // Enviar automaticamente após 1 segundo
    setTimeout(() => {
        handleSendMessage();
    }, 1000);
}

function handleSimpleButton() {
    if (!validateSendConditions()) return;
    
    const simpleMessage = `🖱️ **Botão "Clique Aqui" ativado!**\n\n✅ Mensagem enviada pelo botão simples\n🎯 Canal: <#${state.selectedChannel}>\n👤 Usuário: ${state.user?.global_name || state.user?.username}`;
    
    // Enviar diretamente (sem usar o textarea)
    sendMessageDirectly(simpleMessage);
}

function handleAuthMessage(event) {
    // Segurança: verificar origem
    if (event.origin !== 'https://molly-lemon.vercel.app') return;
    
    if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        console.log('✅ Autenticação bem-sucedida via popup');
        state.token = event.data.token;
        localStorage.setItem('discord_token', event.data.token);
        
        // Fechar o popup (se estiver aberto)
        if (window.opener) {
            window.close();
        }
        
        // Atualizar interface
        fetchUserData();
        showModal('🎉 Login realizado com sucesso!', 'success');
    }
    
    if (event.data.type === 'DISCORD_AUTH_ERROR') {
        console.error('❌ Erro na autenticação:', event.data.error);
        showModal(`❌ Erro: ${event.data.error}`, 'error');
    }
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================
async function handleDiscordCallback(code) {
    console.log('🔐 Processando callback do Discord...');
    
    try {
        // Trocar código por token
        const response = await fetch(`${CONFIG.API_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.access_token) {
            state.token = data.access_token;
            localStorage.setItem('discord_token', data.access_token);
            
            // Limpar código da URL
            window.history.replaceState({}, '', '/');
            
            // Buscar dados do usuário
            await fetchUserData();
            
            showModal('🎉 Login realizado com sucesso!', 'success');
        } else {
            throw new Error('Token não recebido');
        }
    } catch (error) {
        console.error('❌ Erro no callback:', error);
        showModal('❌ Erro na autenticação. Tente novamente.', 'error');
    }
}

// ============================================
// FUNÇÕES DE API
// ============================================
async function fetchUserData() {
    if (!state.token) return;
    
    console.log('👤 Buscando dados do usuário...');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/user`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            state.user = await response.json();
            updateUserInterface();
            await fetchUserGuilds();
            updateStatus(true);
        } else if (response.status === 401) {
            // Token inválido ou expirado
            console.log('🔐 Token expirado, fazendo logout...');
            handleLogout();
        }
    } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
    }
}

async function fetchUserGuilds() {
    if (!state.token) return;
    
    console.log('🏠 Buscando servidores do usuário...');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/guilds`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            state.guilds = await response.json();
            updateGuildsSelect();
        }
    } catch (error) {
        console.error('❌ Erro ao buscar servidores:', error);
    }
}

async function fetchChannels(guildId) {
    if (!state.token) return;
    
    console.log(`📝 Buscando canais do servidor ${guildId}...`);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            const channels = await response.json();
            updateChannelsSelect(channels);
        } else {
            // Tentar via API direta do bot
            await fetchChannelsFromBot(guildId);
        }
    } catch (error) {
        console.error('❌ Erro ao buscar canais:', error);
        // Tentar via bot como fallback
        await fetchChannelsFromBot(guildId);
    }
}

async function fetchChannelsFromBot(guildId) {
    console.log(`🤖 Tentando buscar canais via bot...`);
    
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/guilds/${guildId}/channels`);
        
        if (response.ok) {
            const channels = await response.json();
            updateChannelsSelect(channels);
        } else {
            throw new Error('Bot não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao buscar canais do bot:', error);
        showModal('⚠️ Não foi possível carregar os canais. Verifique se o bot está no servidor.', 'warning');
    }
}

async function sendMessageDirectly(content) {
    console.log(`🤖 Enviando mensagem diretamente...`);
    
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channel_id: state.selectedChannel,
                message: content,
                guild_id: state.selectedGuild
            })
        });
        
        if (response.ok) {
            showModal('✅ Mensagem enviada via bot!', 'success');
        } else {
            throw new Error('Bot não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao enviar via bot:', error);
        showModal('❌ Erro ao enviar mensagem. O bot pode estar offline.', 'error');
    }
}

async function testBotConnection() {
    console.log('🔗 Testando conexão com o bot...');
    
    try {
        const response = await fetch(`${CONFIG.BOT_URL}/health`, {
            method: 'GET',
            // Timeout de 5 segundos
            signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        
        if (response && response.ok) {
            state.botConnected = true;
            console.log('✅ Bot conectado!');
        } else {
            state.botConnected = false;
            console.log('⚠️ Bot offline (modo simulação)');
        }
    } catch (error) {
        state.botConnected = false;
        console.log('⚠️ Bot offline (modo simulação)');
    }
}

// ============================================
// FUNÇÕES DE UI
// ============================================
function updateUserInterface() {
    if (!state.user) return;
    
    // Avatar
    const avatarUrl = state.user.avatar 
        ? `https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}.png?size=256`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    elements.userAvatar.src = avatarUrl;
    elements.username.textContent = state.user.global_name || state.user.username;
    elements.userTag.textContent = `@${state.user.username}`;
    
    // Mostrar/ocultar seções
    elements.loginSection.classList.add('hidden');
    elements.userSection.classList.remove('hidden');
    elements.guildsSection.classList.remove('hidden');
}

function updateGuildsSelect() {
    if (!state.guilds || state.guilds.length === 0) {
        elements.guildSelect.innerHTML = '<option value="">Nenhum servidor encontrado</option>';
        return;
    }
    
    // Ordenar servidores por nome
    const sortedGuilds = [...state.guilds].sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    
    // Limpar e popular select
    elements.guildSelect.innerHTML = '<option value="">Selecione um servidor</option>';
    
    sortedGuilds.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        elements.guildSelect.appendChild(option);
    });
}

function updateChannelsSelect(channels) {
    if (!channels || channels.length === 0) {
        elements.channelSelect.innerHTML = '<option value="">Nenhum canal encontrado</option>';
        return;
    }
    
    // Filtrar apenas canais de texto (type 0)
    const textChannels = channels.filter(channel => channel.type === 0);
    
    if (textChannels.length === 0) {
        elements.channelSelect.innerHTML = '<option value="">Nenhum canal de texto</option>';
        return;
    }
    
    // Ordenar canais por posição/nome
    const sortedChannels = [...textChannels].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Limpar e popular select
    elements.channelSelect.innerHTML = '<option value="">Selecione um canal</option>';
    
    sortedChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        elements.channelSelect.appendChild(option);
    });
    
    // Mostrar seção de canais
    elements.channelsSection.classList.remove('hidden');
}

function updateStatus(authenticated) {
    if (authenticated && state.user) {
        elements.statusIndicator.className = 'status-online';
        elements.statusText.textContent = `Conectado como ${state.user.global_name || state.user.username}`;
    } else {
        elements.statusIndicator.className = 'status-offline';
        elements.statusText.textContent = 'Desconectado';
    }
}

function showModal(message, type = 'info') {
    // Configurar tipo
    let title, color, icon;
    
    switch (type) {
        case 'success':
            title = '✅ Sucesso!';
            color = '#3ba55d';
            icon = '✓';
            break;
        case 'error':
            title = '❌ Erro!';
            color = '#ed4245';
            icon = '✗';
            break;
        case 'warning':
            title = '⚠️ Atenção!';
            color = '#faa81a';
            icon = '⚠';
            break;
        default:
            title = 'ℹ️ Informação';
            color = '#7289da';
            icon = 'ℹ';
    }
    
    // Atualizar elementos
    elements.modalTitle.textContent = title;
    elements.modalTitle.style.color = color;
    elements.modalMessage.textContent = message;
    
    // Mostrar modal
    elements.modal.classList.remove('hidden');
    
    // Fechar automaticamente após 5 segundos (apenas para sucesso/info)
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            elements.modal.classList.add('hidden');
        }, 5000);
    }
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
function validateSendConditions() {
    if (!state.token) {
        showModal('❌ Faça login primeiro!', 'error');
        return false;
    }
    
    if (!state.s
