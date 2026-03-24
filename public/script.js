let currentUser = null;
let socket = null;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');
const logoutBtn = document.getElementById('logout-btn');
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
const scrollBadge = document.getElementById('scroll-badge');
const attachTrigger = document.getElementById('attach-trigger');
const attachMenu = document.getElementById('attach-menu');

let isAtBottom = true;
let missedMessagesCount = 0;

// --- THEME LOGIC ---
window.setTheme = function (themeName) {
    // Remove temas antigos
    document.body.classList.remove('theme-miku', 'theme-zerotwo');

    // Aplica o novo
    if (themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`);
    }

    // Salva a escolha
    localStorage.setItem('@RamiresChat:Theme', themeName);
}

// Restaura o tema ao abrir a página
const savedTheme = localStorage.getItem('@RamiresChat:Theme');
if (savedTheme) {
    setTheme(savedTheme);
}

// --- UI Logic ---

// Switch Auth Tabs
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.add('visible');
    registerForm.classList.remove('visible');
    regError.textContent = '';
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.add('visible');
    loginForm.classList.remove('visible');
    loginError.textContent = '';
});

// Navigate to Chat
function showChatScreen(user) {
    currentUser = user;
    localStorage.setItem('@RamiresChat:User', JSON.stringify(currentUser)); // Salva a sessão

    authScreen.classList.remove('visible');
    authScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    chatScreen.classList.add('visible');

    // Fetch History & Initialize Socket.io after login
    fetchHistory();
    initSocket();
}

async function fetchHistory() {
    // Tela de carregamento personalizada
    messagesContainer.innerHTML = '<div class="system-msg loading-text">Calma macaco, as mensagens estão carregando...</div>';

    try {
        const res = await fetch('/mensagens');
        const msgs = await res.json();

        // Remove a mensagem de carregamento se houver histórico ou limpa pra começar do zero
        messagesContainer.innerHTML = '';

        msgs.forEach(msg => {
            appendMessage(msg);
        });

        // Rola pro fim após carregar o histórico
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    } catch (err) {
        console.error("Erro ao buscar histórico:", err);
    }
}

// Log out
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('@RamiresChat:User'); // Deleta a sessão salva

    if (socket) {
        socket.disconnect();
        socket = null;
    }
    chatScreen.classList.remove('visible');
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    authScreen.classList.add('visible');
    messagesContainer.innerHTML = '<div class="system-msg">Boas-vindas ao Ramires Chat!</div>';
});

// --- API Calls ---

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    regError.textContent = 'Carregando...';

    try {
        const res = await fetch('/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar');

        // Auto-login after register
        regError.textContent = '';
        regError.style.color = '#3fb950';
        regError.textContent = 'Conta criada! Você pode fazer login agora.';
        setTimeout(() => tabLogin.click(), 1500);
    } catch (err) {
        regError.style.color = '#ff7b72';
        regError.textContent = err.message;
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginError.textContent = 'Carregando...';

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Erro ao logar');

        loginError.textContent = '';
        showChatScreen(data.user);
    } catch (err) {
        loginError.style.color = '#ff7b72';
        loginError.textContent = err.message;
    }
});


// --- Real-time Logic ---

function initSocket() {
    socket = io();

    socket.on('connect', () => {
        appendSystemMessage('Conectado ao servidor global!');
        socket.emit('entrar_chat', currentUser);
    });

    socket.on('usuarios_online', (users) => {
        renderOnlineUsers(users);
    });

    socket.on('usuario_digitando', (username) => {
        const indicator = document.getElementById('typing-indicator');
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span>${escapeHtml(username)} está digitando...</span>
        `;
        indicator.classList.remove('hidden');
    });

    socket.on('usuario_parou_digitar', () => {
        document.getElementById('typing-indicator').classList.add('hidden');
    });

    socket.on('nova_mensagem', (msgData) => {
        appendMessage(msgData);
    });

    socket.on('disconnect', () => {
        appendSystemMessage('Desconectado do servidor.');
    });
}

// --- Typing Status ---
let typingTimeout;
function handleTypingStatus() {
    if (!socket || !currentUser) return;

    // Avisa que estou digitando
    socket.emit('digitando', currentUser.name);

    // Se parar por 3 segundos, avisa que parou
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('parou_digitar', currentUser.name);
    }, 3000);
}

messageInput.addEventListener('keydown', (e) => {
    // Não conta se for Enter (enviando mensagem)
    if (e.key !== 'Enter') {
        handleTypingStatus();
    }
});

let currentOnlineUsers = []; // Lista para o autocomplete de menções

function renderOnlineUsers(users) {
    const list = document.getElementById('online-users-list');
    const count = document.getElementById('online-count');

    // Filtro para mostrar usuários únicos, caso alguém logue em 2 abas
    const uniqueUsers = [];
    const seenIds = new Set();
    users.forEach(u => {
        if (!seenIds.has(u.id)) {
            seenIds.add(u.id);
            uniqueUsers.push(u);
        }
    });

    currentOnlineUsers = uniqueUsers; // Salva para o autocomplete
    count.textContent = uniqueUsers.length;
    list.innerHTML = '';

    uniqueUsers.forEach(user => {
        const isMe = user.id === currentUser.id;
        list.innerHTML += `
            <div class="online-user-item">
                <span class="status"></span>
                <div class="online-user-name">${escapeHtml(user.name)} ${isMe ? '(Você)' : ''}</div>
            </div>
        `;
    });
}

// --- Autocomplete de Menções ---
const mentionSuggestions = document.getElementById('mention-suggestions');

messageInput.addEventListener('input', (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
        const query = lastWord.substring(1).toLowerCase();
        // Filtra usuários online (exceto eu mesmo)
        const matches = currentOnlineUsers.filter(u =>
            u.id !== currentUser.id &&
            u.name.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            showMentionSuggestions(matches, lastWord);
        } else {
            mentionSuggestions.classList.add('hidden');
        }
    } else {
        mentionSuggestions.classList.add('hidden');
    }
});

function showMentionSuggestions(users, lastWord) {
    mentionSuggestions.innerHTML = '';
    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'mention-item';
        div.innerHTML = `<span class="status"></span> ${escapeHtml(user.name)}`;
        div.onclick = () => insertMention(user.name, lastWord);
        mentionSuggestions.appendChild(div);
    });
    mentionSuggestions.classList.remove('hidden');
}

function insertMention(name, lastWord) {
    const value = messageInput.value;
    const cursorPosition = messageInput.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Substitui a última palavra (@...) pelo nome completo
    const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf(lastWord)) + '@' + name + ' ';

    messageInput.value = newTextBefore + textAfterCursor;
    mentionSuggestions.classList.add('hidden');
    messageInput.focus();
}

// Send Message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!messageInput.value.trim() || !socket || !currentUser) return;

    const content = messageInput.value.trim();

    socket.emit('enviar_mensagem', {
        userId: currentUser.id,
        content: content,
        replyToId: currentReplyId // Referência da resposta
    });

    messageInput.value = '';
    messageInput.focus();
    mentionSuggestions.classList.add('hidden');
    cancelReply(); // Esconde o preview após enviar

    // Para de digitar imediatamente ao enviar
    clearTimeout(typingTimeout);
    socket.emit('parou_digitar', currentUser.name);
});

// Função auxiliar para comprimir e enviar imagem
function handleImageUpload(file) {
    if (!file || !socket || !currentUser) return;

    // Check if it's really an image
    if (!file.type.startsWith('image/')) {
        alert('👮‍♂️ Calma lá! Envie apenas Imagens.');
        return;
    }

    // Leitor de arquivo para transformar a imagem
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            // Comprime a imagem pelo lado do cliente pra não explodir o servidor
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Tamanho máximo de tela normal

            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Converte para JPEG com qualidade de 70%
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            socket.emit('enviar_mensagem', {
                userId: currentUser.id,
                content: compressedBase64
            });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Image Upload via Input File
const imageInput = document.getElementById('image-input');
imageInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0]);
    // Limpar o input
    imageInput.value = '';
});

// Image Upload via Ctrl+V (Paste)
document.addEventListener('paste', (e) => {
    // Verifica se a tela de chat está visível
    if (chatScreen.classList.contains('hidden')) return;

    // Procura por arquivos na área de transferência (clipboard)
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
            const blob = item.getAsFile();
            handleImageUpload(blob);
            break; // Se achar uma imagem, processa e para
        }
    }
});

// --- GIF Logic (Tenor API) ---
const btnGif = document.getElementById('btn-gif');
const gifPicker = document.getElementById('gif-picker');
const gifSearch = document.getElementById('gif-search');
const gifResults = document.getElementById('gif-results');
const TENOR_API_KEY = 'LIVDSRZULELA'; // Chave pública de testes do Tenor V1

btnGif.addEventListener('click', () => {
    gifPicker.classList.toggle('hidden');
    if (!gifPicker.classList.contains('hidden')) {
        gifSearch.focus();
        if (gifResults.innerHTML === '') fetchGifs('');
    }
});

let searchTimeout;
gifSearch.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        fetchGifs(query);
    }, 500);
});

async function fetchGifs(query) {
    try {
        let url = `https://g.tenor.com/v1/search?q=${query}&key=${TENOR_API_KEY}&limit=20`;
        if (!query) {
            url = `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=20`;
        }

        const res = await fetch(url);
        const data = await res.json();

        gifResults.innerHTML = '';
        data.results.forEach(gif => {
            const imgUrl = gif.media[0].nanogif.url;     // Mostrar em pequeno
            const sendUrl = gif.media[0].gif.url;        // O GIF completo

            const img = document.createElement('img');
            img.src = imgUrl; // Mostra preview pequeno
            img.onclick = () => {
                socket.emit('enviar_mensagem', {
                    userId: currentUser.id,
                    content: sendUrl // Envia o GIF grandão
                });
                gifPicker.classList.add('hidden');
                gifSearch.value = '';
            };
            gifResults.appendChild(img);
        });
    } catch (err) {
        console.error("Erro ao carregar GIFs", err);
    }
}

// --- Attachment Menu Toggle ---
attachTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    attachMenu.classList.toggle('hidden');
});

// Fechar menu de anexos se clicar em qualquer item dentro dele
document.querySelectorAll('.btn-attach-item').forEach(item => {
    item.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
    });
});

// Fechar pickers se clicar fora
document.addEventListener('click', (e) => {
    // Fechar Menu de Anexos
    if (!attachMenu.contains(e.target) && !attachTrigger.contains(e.target)) {
        attachMenu.classList.add('hidden');
    }

    // Fechar GIF Picker
    if (!gifPicker.contains(e.target) && !btnGif.contains(e.target) && !gifPicker.classList.contains('hidden')) {
        gifPicker.classList.add('hidden');
    }
});

// --- Mobile Sidebar Logic ---
const sidebarToggle = document.getElementById('mobile-sidebar-toggle');
const sidebarClose = document.getElementById('mobile-sidebar-close');
const chatSidebar = document.querySelector('.chat-sidebar');

if (sidebarToggle && sidebarClose) {
    sidebarToggle.addEventListener('click', () => {
        chatSidebar.classList.add('active');
    });

    sidebarClose.addEventListener('click', () => {
        chatSidebar.classList.remove('active');
    });
}


// Verifica se já tem sessão salva no navegador
const savedUser = localStorage.getItem('@RamiresChat:User');
if (savedUser) {
    // Restaurar sessão e pular tela de login
    showChatScreen(JSON.parse(savedUser));
}

// --- Lightbox Logic ---
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');

window.openImageFullscreen = function (src) {
    lightboxImg.src = src;
    imageLightbox.classList.remove('hidden');
}

// --- Reply Logic ---
let currentReplyId = null;
const replyPreview = document.getElementById('reply-preview');
const replyUser = document.getElementById('reply-user');
const replyText = document.getElementById('reply-text');

window.setReply = function (msgId, username, content) {
    currentReplyId = msgId;
    replyUser.textContent = username;
    replyText.textContent = content;
    replyPreview.classList.remove('hidden');
    messageInput.focus();
}

window.cancelReply = function () {
    currentReplyId = null;
    replyPreview.classList.add('hidden');
}

window.scrollToMsg = function (msgId) {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 20px var(--primary)';
        setTimeout(() => el.style.boxShadow = '', 2000);
    }
}

// Update Render UI Messages to parse Tenor links correctly
function appendMessage(msgData) {
    const isMine = msgData.userId === currentUser.id;
    const timeString = new Date(msgData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Pega o nome vindo do Join do banco de dados (msgData.User.name)
    const senderName = isMine ? 'Você' : (msgData.User?.name || 'Usuário');

    // MENTIONS: Verifica se o meu nome foi mencionado na mensagem
    const isMentioned = !isMine && currentUser && msgData.content.includes(`@${currentUser.name}`);

    // REPLY / QUOTE: Se esta mensagem estiver respondendo a outra
    let replyHtml = '';
    if (msgData.replyTo) {
        replyHtml = `
            <div class="reply-quote" onclick="scrollToMsg('${msgData.replyToId}')">
                <div class="reply-sender">${escapeHtml(msgData.replyTo.User?.name || 'Usuário')}</div>
                <div class="reply-content">${escapeHtml(msgData.replyTo.content)}</div>
            </div>
        `;
    }

    // Parse Content to see if it's an Image ou GIF
    let displayContent = escapeHtml(msgData.content);
    const contentCheck = msgData.content.toLowerCase();

    // Se for Base64 (imagem enviada), Giphy, Tenor, ou terminar com .gif
    if (msgData.content.startsWith('data:image/') ||
        contentCheck.includes('giphy.com/') ||
        contentCheck.includes('tenor.com/') ||
        contentCheck.endsWith('.gif')) {
        displayContent = `<img src="${msgData.content}" style="max-width: 100%; border-radius: 8px; margin-top: 4px; cursor: pointer;" onclick="openImageFullscreen(this.src)" />`;
    }

    // Parse Reactions JSON if it exists
    let reactionsHtml = '';
    if (msgData.reactions && Object.keys(msgData.reactions).length > 0) {
        const uniqueEmojis = [...new Set(Object.values(msgData.reactions))];
        const count = Object.keys(msgData.reactions).length;
        reactionsHtml = `
            <div class="msg-reactions-list">
                ${uniqueEmojis.join('')} <span style="margin-left: 2px;">${count}</span>
            </div>
        `;
    }

    // We give the message wrapper an ID so we can update it later if needed by reactions
    const msgIdAttr = msgData.id ? `id="msg-${msgData.id}" data-id="${msgData.id}"` : '';

    // Create the message HTML
    const msgHtml = `
        <div class="message ${isMine ? 'msg-mine' : 'msg-other'} ${isMentioned ? 'msg-mentioned' : ''}" ${msgIdAttr}>
            <div class="sender-name">${escapeHtml(senderName)}</div>
            <div class="msg-bubble">
                ${replyHtml}
                ${displayContent}
                <div class="msg-actions">
                    <button class="btn-action" onclick="setReply('${msgData.id}', '${senderName.replace(/'/g, "\\'")}', '${msgData.content.substring(0, 50).replace(/'/g, "\\'")}')" title="Responder">💬</button>
                    <button class="btn-action btn-reaction-trigger" onclick="openReactions(this, '${msgData.id || 0}')" title="Reagir">➕</button>
                </div>
                ${reactionsHtml}
            </div>
            <div class="msg-meta">
                <span>${timeString}</span>
            </div>
        </div>
    `;

    // Se a mensagem já existir (é uma atualização de reação), substitui no lugar original
    const existingMsg = document.getElementById(`msg-${msgData.id}`);
    if (existingMsg) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = msgHtml.trim();
        const newNode = tempDiv.firstChild;
        existingMsg.replaceWith(newNode);
    } else {
        messagesContainer.insertAdjacentHTML('beforeend', msgHtml);
    }

    // Se for minha mensagem OU se eu já estiver lá no fim, rola automático
    if (isMine || isAtBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        resetScrollStatus();
    } else if (!existingMsg) {
        missedMessagesCount++;
        scrollBadge.textContent = missedMessagesCount;
        scrollBadge.classList.remove('hidden');
    }
}

// --- Scroll & Jump Logic ---
messagesContainer.addEventListener('scroll', () => {
    const threshold = 100; // 100px de margem
    const distToBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;

    isAtBottom = distToBottom < threshold;

    if (isAtBottom) {
        scrollToBottomBtn.classList.add('hidden');
        resetScrollStatus();
    } else {
        scrollToBottomBtn.classList.remove('hidden');
    }
});

scrollToBottomBtn.addEventListener('click', () => {
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    resetScrollStatus();
});

function resetScrollStatus() {
    missedMessagesCount = 0;
    scrollBadge.classList.add('hidden');
    scrollBadge.textContent = '0';
}

function appendSystemMessage(text) {
    const msgHtml = `<div class="system-msg">${text}</div>`;
    messagesContainer.insertAdjacentHTML('beforeend', msgHtml);

    if (isAtBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// EMOJI REACTIONS (WHATSAPP STYLE) BUILDER
// ==========================================
const reactionPicker = document.createElement('div');
reactionPicker.className = 'reaction-picker';
const emojis = ['👍', '❤️', '😂', '🐵', '😢'];

emojis.forEach(e => {
    const span = document.createElement('span');
    span.className = 'reaction-emoji';
    span.textContent = e;
    span.onclick = () => {
        // Emite pro Backend a vontade de reagir (Backend precisa salvar isso no JSON)
        socket.emit('reagir_mensagem', {
            msgId: reactionPicker.dataset.msgId,
            userId: currentUser.id,
            emoji: e
        });
        reactionPicker.classList.remove('visible');
    };
    reactionPicker.appendChild(span);
});
document.body.appendChild(reactionPicker);

// Window function to be called from the HTML string inside appendMessage
window.openReactions = function (btn, msgId) {
    const rect = btn.getBoundingClientRect();
    reactionPicker.style.top = (rect.top - 45) + 'px';

    // Adjust layout for 'my' messages so picker doesn't overflow screen right edge
    if (btn.closest('.msg-mine')) {
        reactionPicker.style.left = (rect.left - 160) + 'px';
    } else {
        reactionPicker.style.left = (rect.left + 25) + 'px';
    }

    reactionPicker.dataset.msgId = msgId;
    reactionPicker.classList.add('visible');
}

// Ocultar picker se clicar fora da tela e fora do botão +
document.addEventListener('click', (e) => {
    // Se o clique for fora do picker E não for no botão que abre o picker
    if (reactionPicker.classList.contains('visible')) {
        const isTrigger = e.target.closest('.btn-reaction-trigger');
        const isPicker = e.target.closest('.reaction-picker');

        if (!isTrigger && !isPicker) {
            reactionPicker.classList.remove('visible');
        }
    }
});
