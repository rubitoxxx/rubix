// --- FUNÇÕES DE INICIALIZAÇÃO GERAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Certifique-se que o _supabase está acessível via window._supabase do utils.js
    const { data: { session } } = await window._supabase.auth.getSession(); // Use window._supabase
    if (!session) { window.location.href = 'index.html'; return; }
    currentUser = session.user;
    window.currentUser = currentUser; // Opcional: torne-o global também para outros fins se precisar
    await carregarRankingMemoria();
});

const mainMenu = document.getElementById('main-menu-view');
const onlineLobby = document.getElementById('online-lobby-view');
const gameView = document.getElementById('game-view');
// ANOTAÇÃO: ID renomeado para ser genérico.
const gameBoard = document.getElementById('game-board');
const statusDisplay = document.getElementById('status');
const resetButton = document.getElementById('reset-button');
const rankingBoard = document.getElementById('ranking-board');
const gameCodeDisplay = document.getElementById('game-code-display');

// ANOTAÇÃO: IDs dos stats renomeados para serem genéricos.
const movesDisplay = document.getElementById('game-moves');
const timerDisplay = document.getElementById('game-timer');

let currentUser = null; // Apenas uma declaração. A atribuição é feita no DOMContentLoaded
let gameMode = null; // 'computer' ou 'online'

// --- Variáveis para Jogo da Memória ---
const imagePaths = [
    'https://i.pinimg.com/736x/52/64/b0/5264b06cb12da2ab22134399699e462d.jpg',
    'https://i.pinimg.com/736x/a4/5c/06/a45c06ea180c9ef4c45e67a8a3f9875e.jpg',
    'https://i.pinimg.com/736x/1a/95/0c/1a950cfaffe952580d51b84f6e6f012a.jpg',
    'https://i.pinimg.com/736x/1c/c4/be/1cc4be2f1090773519b5e4c37a782671.jpg',
    'https://i.pinimg.com/736x/e7/5c/f2/e75cf2698b2ca28b09a2a152573b9433.jpg',
    'https://i.pinimg.com/736x/d9/29/10/d92910845fd3227bd751803dc2b352d5.jpg',
    'https://i.pinimg.com/736x/fd/fb/82/fdfb82455430348145535ec779093a0a.jpg',
    'https://i.pinimg.com/736x/53/70/c7/5370c72e72201bc17a91719d01e80484.jpg'
];

// --- Variáveis de Estado de Jogo ---
let currentMemoryGame = null; 
let memoryGameSubscription = null;
let memoryGameTimerInterval = null;
let isMyTurnToPlay = false; 

let localMemoryGameActive = false;
let localMemoryCards = []; 
let localFlippedCards = []; 
let localMatchedCards = []; 
let localMoves = 0;
let localTimer = 0;
let localTimerInterval = null;

// REMOVIDO: Segundo document.addEventListener('DOMContentLoaded').
// Assegure-se que o usuário esteja logado e carregue o ranking
// document.addEventListener('DOMContentLoaded', async () => {
//     const { data: { session } } = await _supabase.auth.getSession(); // ERRO AQUI: _supabase não definido
//     if (!session) { window.location.href = 'index.html'; return; } 
//     currentUser = session.user;
//     await carregarRankingMemoria();
// });

function selecionarModo(mode) {
    gameMode = mode;
    mainMenu.style.display = 'none';
    if (mode === 'online') {
        onlineLobby.style.display = 'block';
    } else if (mode === 'computer') {
        iniciarJogoMemoriaLocal();
    }
}

function voltarParaMenuPrincipal() {
    onlineLobby.style.display = 'none';
    gameView.style.display = 'none'; 
    mainMenu.style.display = 'block';

    if (memoryGameSubscription) {
        memoryGameSubscription.unsubscribe();
        memoryGameSubscription = null;
    }
    if (memoryGameTimerInterval) clearInterval(memoryGameTimerInterval);
    if (localTimerInterval) clearInterval(localTimerInterval);
}

// ranking
async function carregarRankingMemoria() {
    // Usar window._supabase
    const { data, error } = await window._supabase
        .from('memory_scores')
        .select('time_in_seconds, moves, profiles(username)')
        .order('time_in_seconds', { ascending: true })
        .limit(5);

    if (error) {
        console.error("Erro ao carregar ranking:", error);
        rankingBoard.innerHTML = '<p>Não foi possível carregar o ranking da memória.</p>';
        return;
    }

    if (data.length === 0) {
        rankingBoard.innerHTML = '<p>Ninguém jogou Jogo da Memória ainda. Seja o primeiro!</p>';
        return;
    }
    
    const rankingList = document.createElement('ol');
    data.forEach((score, index) => {
        const playerUsername = score.profiles ? score.profiles.username : 'Anônimo';
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>#${index + 1} ${playerUsername}</span> <span>${score.time_in_seconds}s / ${score.moves} mov.</span>`; 
        rankingList.appendChild(listItem);
    });
    rankingBoard.innerHTML = '';
    rankingBoard.appendChild(rankingList);
}

// --- LÓGICA DO JOGO DA MEMÓRIA OFFLINE (VS. MÁQUINA) ---
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function iniciarJogoMemoriaLocal() {
    gameView.style.display = 'block';
    onlineLobby.style.display = 'none';
    gameCodeDisplay.style.display = 'none';
    resetButton.style.display = 'block';
    resetButton.textContent = 'Reiniciar Jogo';
    resetButton.onclick = iniciarJogoMemoriaLocal;

    localMemoryGameActive = true;
    localFlippedCards = [];
    localMatchedCards = [];
    localMoves = 0;
    localTimer = 0;
    movesDisplay.textContent = `Movimentos: ${localMoves}`;
    timerDisplay.textContent = `Tempo: ${localTimer}s`;
    clearInterval(localTimerInterval);
    gameBoard.innerHTML = '';

    const gameSymbols = [...imagePaths, ...imagePaths];
    shuffle(gameSymbols);

    localMemoryCards = gameSymbols.map((symbolPath, index) => ({
        id: index,
        symbol: symbolPath,
        flipped: false,
        matched: false
    }));
    
    localMemoryCards.forEach(cardData => {
        gameBoard.appendChild(createMemoryCardElement(cardData, 'local'));
    });

    localTimerInterval = setInterval(() => {
        localTimer++;
        timerDisplay.textContent = `Tempo: ${localTimer}s`;
    }, 1000);
    statusDisplay.textContent = 'Comece a jogar!';
}

function createMemoryCardElement(cardData, mode) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.cardId = cardData.id;

    if (cardData.flipped) cardElement.classList.add('flipped');
    if (cardData.matched) cardElement.classList.add('matched');

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');
    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');
    cardFront.textContent = '?';
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    const imgElement = document.createElement('img');
    imgElement.src = cardData.symbol;
    imgElement.alt = "Memory Card";
    cardBack.appendChild(imgElement);
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardElement.appendChild(cardInner);

    const canPlay = (mode === 'local' && localMemoryGameActive) || (mode === 'online' && isMyTurnToPlay);
    if (canPlay && !cardData.matched && !cardData.flipped) {
        cardElement.addEventListener('click', () => {
            if (mode === 'local') flipMemoryCardLocal(cardData.id);
            else makeMemoryMoveOnline(cardData.id);
        });
    }

    return cardElement;
}

function flipMemoryCardLocal(cardId) {
    if (localFlippedCards.length === 2) return;
    const card = localMemoryCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    card.flipped = true;
    localFlippedCards.push(cardId);
    
    const cardElement = gameBoard.querySelector(`.card[data-card-id='${cardId}']`);
    if (cardElement) cardElement.classList.add('flipped');

    if (localFlippedCards.length === 2) {
        localMoves++;
        movesDisplay.textContent = `Movimentos: ${localMoves}`;
        checkForMemoryMatchLocal();
    }
}

function checkForMemoryMatchLocal() {
    const [id1, id2] = localFlippedCards;
    const card1 = localMemoryCards.find(c => c.id === id1);
    const card2 = localMemoryCards.find(c => c.id === id2);

    if (card1.symbol === card2.symbol) {
        card1.matched = true;
        card2.matched = true;
        localMatchedCards.push(id1, id2);
        gameBoard.querySelector(`.card[data-card-id='${id1}']`).classList.add('matched');
        gameBoard.querySelector(`.card[data-card-id='${id2}']`).classList.add('matched');
        localFlippedCards = [];
        if (localMatchedCards.length === localMemoryCards.length) {
            endMemoryGameLocal();
        }
    } else {
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            gameBoard.querySelector(`.card[data-card-id='${id1}']`).classList.remove('flipped');
            gameBoard.querySelector(`.card[data-card-id='${id2}']`).classList.remove('flipped');
            localFlippedCards = [];
        }, 1000);
    }
}

async function endMemoryGameLocal() {
    localMemoryGameActive = false;
    clearInterval(localTimerInterval);
    statusDisplay.textContent = `Parabéns! Você completou em ${localMoves} movimentos e ${localTimer} segundos!`;
    await registrarRecordeMemoria(localTimer, localMoves);
    resetButton.textContent = 'Jogar Novamente';
    await carregarRankingMemoria();

    // --- NOVO: RECOMPENSA DE RUBIXCOINS POR JOGO OFFLINE CONCLUÍDO ---
    if (currentUser) {
        const coinsEarned = 20; // Exemplo: 20 RubixCoins por completar o jogo offline
        // Usar window.adicionarRubixCoins
        if (typeof window.adicionarRubixCoins === 'function') {
            await window.adicionarRubixCoins(currentUser.id, coinsEarned);
            console.log(`Você ganhou ${coinsEarned} RubixCoins por completar o Jogo da Memória (offline)!`);
        } else {
            console.warn("Função adicionarRubixCoins não disponível no objeto window.");
        }
    }
    // --- FIM DA RECOMPENSA ---
}

// --- LÓGICA DO JOGO DA MEMÓRIA ONLINE ---
async function criarNovoJogoMemoria() {
    const gameSymbols = [...imagePaths, ...imagePaths];
    shuffle(gameSymbols);
    const initialBoardState = gameSymbols.map((symbolPath, index) => ({
        id: index, symbol: symbolPath, flipped: false, matched: false
    }));

    // Usar window._supabase
    const { data, error } = await window._supabase.from('memory_games').insert({
        player1_id: currentUser.id,
        board_state: initialBoardState,
        current_turn_player_id: currentUser.id,
        status: 'waiting',
        flipped_card_ids: []
    }).select().single();

    if (error) { console.error("Erro ao criar jogo:", error); return; }
    currentMemoryGame = data;
    iniciarVisualizacaoDeJogoMemoria();
    escutarMudancasNoJogoMemoria(currentMemoryGame.id);
}

async function entrarEmJogoMemoria() {
    const gameId = document.getElementById('game-code-input').value.trim();
    if (!gameId) { alert("Por favor, insira um código de jogo."); return; }

    // Usar window._supabase
    const { data, error } = await window._supabase.from('memory_games')
        .update({ player2_id: currentUser.id, status: 'in_progress' })
        .eq('id', gameId).eq('status', 'waiting').is('player2_id', null)
        .select().single();

    if (error || !data) {
        alert("Código inválido, jogo cheio ou não encontrado.");
        return;
    }

    currentMemoryGame = data;
    iniciarVisualizacaoDeJogoMemoria();
    escutarMudancasNoJogoMemoria(currentMemoryGame.id);
}

function iniciarVisualizacaoDeJogoMemoria() {
    onlineLobby.style.display = 'none';
    gameView.style.display = 'block';
    gameCodeDisplay.style.display = 'block';
    gameCodeDisplay.innerHTML = `Código do Jogo: <span onclick="copiarCodigo()">${currentMemoryGame.id}</span>`;
    resetButton.style.display = 'none';
    
    desenharTabuleiroMemoriaOnline();
    atualizarStatusMemoriaOnline();
    iniciarTimerOnline();
}

function copiarCodigo() {
    navigator.clipboard.writeText(currentMemoryGame.id).then(() => alert("Código copiado!"));
}

function escutarMudancasNoJogoMemoria(gameId) {
    if (memoryGameSubscription) memoryGameSubscription.unsubscribe();
    
    // Usar window._supabase
    memoryGameSubscription = window._supabase.channel(`memory_game-${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'memory_games', filter: `id=eq.${gameId}` }, payload => {
        currentMemoryGame = payload.new;
        desenharTabuleiroMemoriaOnline();
        atualizarStatusMemoriaOnline();
    }).subscribe();
}

function desenharTabuleiroMemoriaOnline() {
    gameBoard.innerHTML = '';
    movesDisplay.textContent = `Movimentos: ${currentMemoryGame.moves}`;
    timerDisplay.textContent = `Tempo: ${currentMemoryGame.timer}s`;
    currentMemoryGame.board_state.forEach(cardData => {
        gameBoard.appendChild(createMemoryCardElement(cardData, 'online'));
    });
}

// Lógica de jogada online foi completamente refatorada para ser mais segura.
async function makeMemoryMoveOnline(cardId) {
    if (!isMyTurnToPlay || currentMemoryGame.status !== 'in_progress') return;

    const flippedCount = currentMemoryGame.flipped_card_ids.length;
    if (flippedCount >= 2) return; // Impede cliques enquanto um par está sendo resolvido

    // 1. Vira o card localmente e atualiza o Supabase (apenas o card virado)
    let newBoardState = [...currentMemoryGame.board_state];
    const cardIndex = newBoardState.findIndex(c => c.id === cardId);
    if (newBoardState[cardIndex].flipped || newBoardState[cardIndex].matched) return;

    newBoardState[cardIndex].flipped = true;
    let newFlippedCardIds = [...currentMemoryGame.flipped_card_ids, cardId];
    
    // Atualiza o estado visual imediatamente
    currentMemoryGame.board_state = newBoardState;
    currentMemoryGame.flipped_card_ids = newFlippedCardIds;
    desenharTabuleiroMemoriaOnline();

    // 2. Se for o segundo card, o jogador do turno resolve a jogada
    if (newFlippedCardIds.length === 2) {
        // Desabilita novos cliques
        isMyTurnToPlay = false; 

        const [id1, id2] = newFlippedCardIds;
        const card1 = newBoardState.find(c => c.id === id1);
        const card2 = newBoardState.find(c => c.id === id2);

        let finalBoardState = [...newBoardState];
        let nextTurnPlayerId = currentMemoryGame.current_turn_player_id;
        let gameStatus = 'in_progress';

        if (card1.symbol === card2.symbol) {
            // É um par! Marca como matched
            finalBoardState.find(c => c.id === id1).matched = true;
            finalBoardState.find(c => c.id === id2).matched = true;
            // O turno continua com o mesmo jogador
        } else {
            // Não é um par, troca o turno
            nextTurnPlayerId = currentMemoryGame.player1_id === currentUser.id 
                ? currentMemoryGame.player2_id 
                : currentMemoryGame.player1_id;
            
            // A lógica de desvirar agora está no setTimeout visual
            // O banco de dados é atualizado primeiro com a troca de turno
        }
        
        // Verifica se o jogo terminou
        const totalMatched = finalBoardState.filter(c => c.matched).length;
        if (totalMatched === finalBoardState.length) {
            gameStatus = 'finished';
        }

        // Prepara o payload para uma única atualização no Supabase
        const updatePayload = {
            board_state: finalBoardState,
            flipped_card_ids: [], // Limpa os cards virados
            current_turn_player_id: nextTurnPlayerId,
            moves: currentMemoryGame.moves + 1,
            status: gameStatus
        };
        
        // O setTimeout é usado apenas para o efeito visual de desvirar.
        // A atualização do estado do jogo no DB acontece antes.
        setTimeout(async () => {
            if (card1.symbol !== card2.symbol) {
                updatePayload.board_state.find(c => c.id === id1).flipped = false;
                updatePayload.board_state.find(c => c.id === id2).flipped = false;
            }
            
            // Usar window._supabase
            const { error } = await window._supabase.from('memory_games')
                .update(updatePayload)
                .eq('id', currentMemoryGame.id);

            if (error) {
                console.error("Erro ao finalizar jogada:", error);
                // Tenta reverter o estado local em caso de erro
                isMyTurnToPlay = true; 
            }
        }, 1200);

    } else {
        // Usar window._supabase
        const { error } = await window._supabase.from('memory_games').update({
            board_state: newBoardState,
            flipped_card_ids: newFlippedCardIds
        }).eq('id', currentMemoryGame.id);

        if (error) console.error("Erro ao virar o primeiro card:", error);
    }
}


async function atualizarStatusMemoriaOnline() {
    if (!currentMemoryGame) return;
    
    isMyTurnToPlay = (currentUser.id === currentMemoryGame.current_turn_player_id);

    if (currentMemoryGame.status === 'finished') {
        clearInterval(memoryGameTimerInterval);
        statusDisplay.textContent = 'Jogo Finalizado!';
        resetButton.style.display = 'block';
        resetButton.textContent = 'Voltar ao Menu';
        resetButton.onclick = () => location.reload();
        await registrarRecordeMemoria(currentMemoryGame.timer, currentMemoryGame.moves);

        await carregarRankingMemoria();

        // --- NOVO: RECOMPENSA DE RUBIXCOINS POR JOGO ONLINE CONCLUÍDO ---
        if (currentUser) {
            const coinsEarned = 30; // Exemplo: 30 RubixCoins por completar o jogo online
            // Usar window.adicionarRubixCoins
            if (typeof window.adicionarRubixCoins === 'function') {
                await window.adicionarRubixCoins(currentUser.id, coinsEarned);
                console.log(`Você ganhou ${coinsEarned} RubixCoins por completar o Jogo da Memória (online)!`);
            } else {
                console.warn("Função adicionarRubixCoins não disponível no objeto window.");
            }
        }
        // --- FIM DA RECOMPENSA ---

    } else if (currentMemoryGame.status === 'in_progress') {
        if (currentMemoryGame.player2_id === null) {
            statusDisplay.textContent = 'Aguardando segundo jogador...';
            return;
        }
        if (currentMemoryGame.flipped_card_ids.length > 0 && isMyTurnToPlay) {
             statusDisplay.textContent = 'Escolha o segundo card...';
        } else {
             statusDisplay.textContent = isMyTurnToPlay ? 'É a sua vez!' : 'Aguardando jogada do oponente...';
        }
    } else { // status === 'waiting'
        statusDisplay.textContent = 'Aguardando segundo jogador... Compartilhe o código!';
    }
}
// registrar recorde
async function registrarRecordeMemoria(time, moves) {
    if (!currentUser) return;

    // Pega o nome de usuário dos metadados do usuário atual.
    // Se não houver, usa 'Anônimo'.
    const playerName = currentUser.user_metadata?.username || 'Anônimo';

    console.log(`TENTATIVA FINAL: Inserindo score completo para ${playerName} (${currentUser.id})`);
    statusDisplay.innerHTML = `Registrando sua pontuação...`;

    // MUDANÇA FINAL: Inserimos TODAS as colunas que podem ser obrigatórias.
    // Usar window._supabase
    const { error } = await window._supabase
        .from('memory_scores')
        .insert({
            user_id: currentUser.id,
            time_in_seconds: time,
            moves: moves,
            player_name: playerName, // Adicionando o nome do jogador
            score: 0                 // Adicionando um valor padrão para a coluna 'score'
        });

    if (error) {
        console.error('Erro no INSERT final:', error);
        statusDisplay.innerHTML = `Erro ao registrar pontuação.`;
        // PEDIDO FINAL: Se este erro aparecer, por favor, expanda o objeto de erro no console.
    } else {
        console.log('FINALMENTE! Recorde registrado com sucesso!');
        statusDisplay.innerHTML = `Pontuação registrada!`;
        // Agora que funcionou, chamamos o carregamento do ranking para atualizar a tela.
        await carregarRankingMemoria();
    }
}

function iniciarTimerOnline() {
    // O timer é atualizado no DB apenas pelo player 1 para evitar conflitos
    if (currentUser.id === currentMemoryGame.player1_id) {
        memoryGameTimerInterval = setInterval(async () => {
            if (currentMemoryGame && currentMemoryGame.status === 'in_progress') {
                // Usar window._supabase
                await window._supabase.from('memory_games')
                    .update({ timer: currentMemoryGame.timer + 1 })
                    .eq('id', currentMemoryGame.id);
            } else {
                clearInterval(memoryGameTimerInterval);
            }
        }, 1000);
    }
}