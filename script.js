// O script inteiro para o arquivo mural.html (VERSÃO CORRIGIDA E UNIFICADA)

let currentUser = null;
const CUSTO_EMOJI = 5;

/**
 * CORREÇÃO PRINCIPAL: Unificamos tudo em um único 'DOMContentLoaded'.
 * Isso garante que o código rode na ordem correta:
 * 1. Pega a sessão do usuário.
 * 2. Carrega os dados da página.
 * 3. Configura os "ouvintes de evento" (como o clique no botão de emoji).
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICA A SESSÃO DO USUÁRIO
    const { data: { session } } = await window._supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    currentUser = session.user; // Define o usuário logado

    // 2. CARREGA OS DADOS INICIAIS DA PÁGINA
    await carregarPerfilDoUsuario();
    await carregarMensagens();

    // 3. CONFIGURA OS EVENTOS DA PÁGINA
    configurarEventListeners();
});

function configurarEventListeners() {
    const emojiPicker = document.querySelector('emoji-picker');
    let activeTextarea = null;

    // Evento de clique para o botão de emoji (com SweetAlert2)
    document.body.addEventListener('click', async (event) => {
        if (event.target.matches('.emoji-button')) {
            event.stopPropagation();
            const button = event.target;

            try {
                const { data: profile, error: profileError } = await window._supabase.from('profiles').select('rubix_coins').eq('id', currentUser.id).single();

                if (profileError || !profile) {
                    console.error('Erro ao verificar saldo:', profileError);
                    Swal.fire({ icon: 'error', title: 'Ops!', text: 'Não foi possível verificar seu saldo de RubixCoins.' });
                    return;
                }

                if (profile.rubix_coins < CUSTO_EMOJI) {
                    Swal.fire({ icon: 'warning', title: 'Saldo Insuficiente', text: `Você precisa de ${CUSTO_EMOJI} RubixCoins para usar emojis.` });
                    return;
                }

                // Substituímos o 'confirm' pelo SweetAlert2
                Swal.fire({
                    title: 'Confirmar Ação',
                    text: `Usar a função de emoji custará ${CUSTO_EMOJI} RubixCoins. Deseja continuar?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sim, gastar!',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const { error: deductError } = await window.adicionarRubixCoins(currentUser.id, -CUSTO_EMOJI);

                        if (deductError) {
                            Swal.fire({ icon: 'error', title: 'Erro na Transação', text: 'Não foi possível debitar suas RubixCoins.' });
                            return;
                        }

                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `-${CUSTO_EMOJI} RubixCoins!`, showConfirmButton: false, timer: 2000, timerProgressBar: true });
                        await carregarPerfilDoUsuario();

                        // Lógica para definir o textarea ativo foi simplificada
                        activeTextarea = (button.id === 'emoji-btn-main') ? document.getElementById('mensagem') : document.getElementById(button.dataset.targetTextarea);
                        
                        const rect = button.getBoundingClientRect();
                        emojiPicker.style.top = `${window.scrollY + rect.bottom}px`;
                        emojiPicker.style.left = `${window.scrollX + rect.left - 150}px`;
                        emojiPicker.style.display = 'block';
                    }
                });

            } catch (err) {
                console.error("Erro no processo de pagamento de emoji:", err);
                Swal.fire({ icon: 'error', title: 'Erro Inesperado', text: 'Algo deu muito errado.' });
            }
        }
    });

    // Lógica para inserir o emoji
    emojiPicker.addEventListener('emoji-click', event => {
        if (activeTextarea) {
            activeTextarea.value += event.detail.unicode;
        }
        emojiPicker.style.display = 'none';
    });

    // Lógica para fechar o seletor
    document.body.addEventListener('click', (event) => {
        if (!emojiPicker.contains(event.target) && !event.target.matches('.emoji-button')) {
            emojiPicker.style.display = 'none';
        }
    });
}

// --- FUNÇÕES GLOBAIS DA PÁGINA ---
// Estas funções são definidas fora para serem acessadas pelos botões `onclick`

async function carregarPerfilDoUsuario() {
    if (!currentUser) return;
    const { data: profile } = await window._supabase.from('profiles').select('username, avatar_url, rubix_coins').eq('id', currentUser.id).single();
    if (profile) {
        document.getElementById("nomeUsuario").textContent = profile.username || 'Visitante';
        document.getElementById("fotoPerfilHeader").src = profile.avatar_url || "https://img.freepik.com/vetores-premium/icone-de-perfil-de-avatar-padrao-imagem-de-usuario-de-midia-social-icone-de-avatar-cinza-silhueta-de-perfil-em-branco-ilustracao-vetorial_561158-3383.jpg";
        document.getElementById("saldoRubixCoins").textContent = profile.rubix_coins || 0;
    }
}

async function carregarMensagens() {
    const mural = document.getElementById("mural");
    mural.innerHTML = "<p>Carregando mural...</p>";
    
    const { data: messages, error } = await window._supabase.from('messages').select(`*, profiles (username, avatar_url), comments ( *, profiles (username, avatar_url) )`).order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar mensagens:", error);
        mural.innerHTML = "<p>Não foi possível carregar as mensagens.</p>";
        return;
    }
    mural.innerHTML = "";
    
    messages.forEach(msg => {
        const postElement = document.createElement("div");
        postElement.className = "tweet-post";
        postElement.id = `post-${msg.id}`;

        const autorNome = msg.profiles ? msg.profiles.username : 'Anônimo';
        const autorAvatar = msg.profiles?.avatar_url || "https://img.freepik.com/vetores-premium/icone-de-perfil-de-avatar-padrao-imagem-de-usuario-de-midia-social-icone-de-avatar-cinza-silhueta-de-perfil-em-branco-ilustracao-vetorial_561158-3383.jpg";
        
        let commentsHTML = '';
        if (msg.comments && msg.comments.length > 0) {
            msg.comments.forEach(comment => {
                const commenterName = comment.profiles ? comment.profiles.username : 'Anônimo';
                const commenterAvatar = comment.profiles?.avatar_url || "https://img.freepik.com/vetores-premium/icone-de-perfil-de-avatar-padrao-imagem-de-usuario-de-midia-social-icone-de-avatar-cinza-silhueta-de-perfil-em-branco-ilustracao-vetorial_561158-3383.jpg";
                commentsHTML += `<div class="comment"><img src="${commenterAvatar}" class="comment-avatar" alt="Foto de ${commenterName}"><div class="comment-content"><strong>${commenterName}</strong><p>${comment.content}</p></div></div>`;
            });
        }

        const commentCount = msg.comments ? msg.comments.length : 0;

        postElement.innerHTML = `
            <div class="post-header">
                <img src="${autorAvatar}" class="post-avatar" alt="Foto de ${autorNome}">
                <div class="post-info">
                    <strong class="post-author">${autorNome}</strong>
                    <span class="post-date">${new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                </div>
            </div>
            <div class="post-content"><p>${msg.content}</p></div>
            <div class="post-actions">
                <button class="action-button" onclick="toggleComentarios('${msg.id}')"><i class="fas fa-comment"></i> Comentar <span class="comment-count">${commentCount}</span></button>
                ${msg.user_id === currentUser?.id ? `<button class="delete-button" onclick="apagarMensagem('${msg.id}')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
            <div class="comments-section" id="comments-section-${msg.id}" style="display:none;">
                <div class="comments-list">${commentsHTML}</div>
                <div class="new-comment-form">
                    <textarea id="comment-input-${msg.id}" placeholder="Escreva seu comentário..."></textarea>
                    <button class="emoji-button" data-target-textarea="comment-input-${msg.id}">😀</button>
                    <button onclick="postarComentario('${msg.id}')">Publicar</button>
                </div>
            </div>`;
        mural.appendChild(postElement);
    });
}

async function postarMensagem() {
    const texto = document.getElementById("mensagem").value.trim();
    if (texto === "" || !currentUser) return;
    const { error } = await window._supabase.from('messages').insert({ content: texto, user_id: currentUser.id });
    if (error) {
        console.error("Erro ao postar mensagem:", error);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível postar sua mensagem.'});
    } else {
        document.getElementById("mensagem").value = "";
        await window.adicionarRubixCoins(currentUser.id, 10);
        await carregarMensagens();
        await carregarPerfilDoUsuario();
    }
}

async function apagarMensagem(messageId) {
    // Usando SweetAlert2 para confirmação de exclusão
    Swal.fire({
        title: 'Tem certeza?',
        text: "Você não poderá reverter esta ação!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, apagar!',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await window._supabase.from('messages').delete().match({ id: messageId });
            if (error) {
                console.error('Erro ao apagar a mensagem:', error);
                Swal.fire('Erro!', 'Não foi possível apagar o post.', 'error');
            } else {
                Swal.fire('Apagado!', 'Seu post foi removido.', 'success');
                await carregarMensagens();
                await carregarPerfilDoUsuario();
            }
        }
    });
}

function toggleComentarios(messageId) {
    const commentsSection = document.getElementById(`comments-section-${messageId}`);
    if (commentsSection) {
        const isVisible = commentsSection.style.display === 'block';
        commentsSection.style.display = isVisible ? 'none' : 'block';
    }
}

async function postarComentario(messageId) {
    const input = document.getElementById(`comment-input-${messageId}`);
    const content = input.value.trim();
    if (content === "" || !currentUser) return;

    const { error } = await window._supabase.from('comments').insert({ content: content, user_id: currentUser.id, message_id: messageId });

    if (error) {
        console.error('Erro ao postar comentário:', error);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível enviar seu comentário.' });
    } else {
        input.value = '';
        await window.adicionarRubixCoins(currentUser.id, 5);
        await carregarMensagens();
        await carregarPerfilDoUsuario();
    }
}

async function sair() {
    await window._supabase.auth.signOut();
    window.location.href = "index.html";
}

function irParaPerfil() { window.location.href = "perfil.html"; }
function game() { window.location.href = "pggame.html"; }