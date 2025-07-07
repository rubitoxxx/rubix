// --- INICIALIZAÇÃO E VARIÁVEIS GLOBAIS ---
const supabaseUrl = 'https://ldrcfomamlzpxoucpkmb.supabase.co'; // Verifique se esta URL está correta
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtF-tL0'; // Verifique se esta chave está correta
const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseKey);

const mainMenu = document.getElementById('main-menu-view');
const onlineLobby = document.getElementById('online-lobby-view');
const gameView = document.getElementById('game-view');
const onlineGameBoard = document.getElementById('online-game-board'); // Mudado para online-game-board
const statusDisplay = document.getElementById('status');
const resetButton = document.getElementById('reset-button');
const rankingBoard = document.getElementById('ranking-board');
const gameCodeDisplay = document.getElementById('game-code-display');

// Elementos para stats do Jogo da Memória Online
const onlineMovesDisplay = document.getElementById('online-moves');
const onlineTimerDisplay = document.getElementById('online-timer');

let currentUser = null;
let gameMode = null; // 'computer' ou 'online'

// --- Variáveis para Jogo da Memória ---
// Paths para suas imagens (ajuste conforme necessário, devem ser 8 caminhos para 16 cards)
const imagePaths = [
    'https://i.pinimg.com/736x/52/64/b0/5264b06cb12da2ab22134399699e462d.jpg',
    'https://i.pinimg.com/736x/41/80/a6/4180a6b284fdefecaa1e54d6850020b8.jpg',
    'https://i.pinimg.com/736x/46/7b/1b/467b1bae91d79ac51edeb7d8af5336a0.jpg',
    'https://i.pinimg.com/736x/29/3d/38/293d38e5012912c311c365c29124b696.jpg',
    'https://i.pinimg.com/736x/a2/5e/83/a25e83405b3d5613b2eef67c5c3e4bc8.jpg',
    'https://i.pinimg.com/736x/f8/22/54/f822548760b95016414d7f42c93c8555.jpg',
    'https://i.pinimg.com/736x/af/19/1e/af191e86d445a2c19319763dee7b2db0.jpg',
    'https://i.pinimg.com/736x/a9/96/86/a996860ec5c13cc689f01430c5d345a6.jpg',
];

// Variáveis para jogo online da memória
let currentMemoryGame = null; // Armazena o objeto do jogo da memória do Supabase
let memoryGameSubscription = null;
let memoryGameTimerInterval = null;
let isMyTurnToPlay = false; // Controla se o jogador atual pode virar cards

// Variáveis para jogo vs. Máquina (Memory)
let localMemoryGameActive = false;
let localMemoryCards = []; // Estrutura {id, symbol, flipped, matched}
let localFlippedCards = []; // Array de IDs dos cards virados
let localMatchedCards = []; // Array de IDs dos cards combinados
let localMoves = 0;
let localTimer = 0;
let localTimerInterval = null;


// --- FUNÇÕES DE INICIALIZAÇÃO GERAL ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; } // Redireciona para o login se não houver sessão
    currentUser = session.user;
    await carregarRankingMemoria(); // Carrega o ranking do jogo da memória
});

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
    gameView.style.display = 'none'; // Esconde a view do jogo também
    mainMenu.style.display = 'block';

    // Limpa subscriptions e timers ao voltar para o menu
    if (memoryGameSubscription) {
        memoryGameSubscription.unsubscribe();
        memoryGameSubscription = null;
    }
    if (memoryGameTimerInterval) {
        clearInterval(memoryGameTimerInterval);
        memoryGameTimerInterval = null;
    }
    if (localTimerInterval) {
        clearInterval(localTimerInterval);
        localTimerInterval = null;
    }
}

// --- FUNÇÕES DE RANKING DA MEMÓRIA ---
async function carregarRankingMemoria() {
    const { data, error } = await _supabase.from('memory_scores').select(`best_time, best_moves, profiles(username)`).order('best_time', { ascending: true }).limit(5);
    if (error || !data) { rankingBoard.innerHTML = '<p>Não foi possível carregar o ranking da memória.</p>'; return; }
    if (data.length === 0) { rankingBoard.innerHTML = '<p>Ninguém jogou Jogo da Memória ainda. Seja o primeiro!</p>'; return; }
    
    const rankingList = document.createElement('ol');
    data.forEach((score, index) => {
        const playerUsername = score.profiles ? score.profiles.username : 'Anônimo';
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>#${index + 1} ${playerUsername}</span> <span>${score.best_time}s / ${score.best_moves} mov.</span>`;
        rankingList.appendChild(listItem);
    });
    rankingBoard.innerHTML = '';
    rankingBoard.appendChild(rankingList);
}

async function registrarRecordeMemoria(time, moves) {
    if (!currentUser) return;
    statusDisplay.innerHTML = `Novo recorde ou pontuação registrada!`;
    const { error } = await _supabase.rpc('upsert_memory_score', { 
        p_user_id: currentUser.id, 
        p_time: time, 
        p_moves: moves 
    });
    if (error) console.error('Erro ao registrar recorde da memória:', error);
    else await carregarRankingMemoria();
}

// --- LÓGICA DO JOGO DA MEMÓRIA OFFLINE (VS. MÁQUINA) ---
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

function iniciarJogoMemoriaLocal() {
    gameView.style.display = 'block';
    onlineLobby.style.display = 'none'; // Esconde lobby online
    gameCodeDisplay.style.display = 'none'; // Esconde código do jogo online
    resetButton.style.display = 'block';
    resetButton.textContent = 'Reiniciar Jogo';
    resetButton.onclick = iniciarJogoMemoriaLocal;

    localMemoryGameActive = true;
    localMemoryCards = [];
    localFlippedCards = [];
    localMatchedCards = [];
    localMoves = 0;
    localTimer = 0;
    onlineMovesDisplay.textContent = `Movimentos: ${localMoves}`;
    onlineTimerDisplay.textContent = `Tempo: ${localTimer}s`;
    clearInterval(localTimerInterval);
    onlineGameBoard.innerHTML = ''; // Limpa o tabuleiro

    const gameSymbols = [...imagePaths, ...imagePaths]; // Duplica os caminhos para formar pares
    shuffle(gameSymbols);

    gameSymbols.forEach((symbolPath, index) => {
        const cardData = {
            id: index, // Um ID único para cada card
            symbol: symbolPath,
            flipped: false,
            matched: false
        };
        localMemoryCards.push(cardData);
        onlineGameBoard.appendChild(createMemoryCardElement(cardData, 'local'));
    });

    startMemoryTimer('local');
    statusDisplay.textContent = 'Comece a jogar!';
}

function createMemoryCardElement(cardData, mode) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.cardId = cardData.id;

    if (cardData.flipped) {
        cardElement.classList.add('flipped');
    }
    if (cardData.matched) {
        cardElement.classList.add('matched');
    }

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');
    cardFront.textContent = '?';

    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    const imgElement = document.createElement('img');
    imgElement.src = cardData.symbol;
    imgElement.alt = "Memory Card Image";
    cardBack.appendChild(imgElement);

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardElement.appendChild(cardInner);

    if (mode === 'local' && localMemoryGameActive && !cardData.matched && !cardData.flipped) {
        cardElement.addEventListener('click', () => flipMemoryCardLocal(cardData.id));
    } else if (mode === 'online' && isMyTurnToPlay && !cardData.matched && !cardData.flipped) {
        cardElement.addEventListener('click', () => makeMemoryMoveOnline(cardData.id));
    }

    return cardElement;
}

function startMemoryTimer(mode) {
    if (mode === 'local') {
        localTimerInterval = setInterval(() => {
            localTimer++;
            onlineTimerDisplay.textContent = `Tempo: ${localTimer}s`;
        }, 1000);
    } else if (mode === 'online') {
        memoryGameTimerInterval = setInterval(() => {
            // O timer online será atualizado a partir do Supabase pelo payload
            // ou podemos ter um timer local que é resetado/sincronizado
            // Para simplicidade, vamos deixar o Supabase gerenciar o timer.
            // Para dois jogadores, o timer deve ser o do jogo no Supabase.
            // Aqui, apenas incrementamos se o currentMemoryGame for válido e em progresso.
            if (currentMemoryGame && currentMemoryGame.status === 'in_progress') {
                currentMemoryGame.timer++;
                onlineTimerDisplay.textContent = `Tempo: ${currentMemoryGame.timer}s`;
            }
        }, 1000);
    }
}

function flipMemoryCardLocal(cardId) {
    if (localFlippedCards.length === 2 || !localMemoryGameActive) {
        return;
    }

    const card = localMemoryCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) {
        return;
    }

    card.flipped = true;
    localFlippedCards.push(cardId);
    
    // Atualiza o DOM
    const cardElement = onlineGameBoard.querySelector(`.card[data-card-id='${cardId}']`);
    if (cardElement) {
        cardElement.classList.add('flipped');
    }

    if (localFlippedCards.length === 2) {
        localMoves++;
        onlineMovesDisplay.textContent = `Movimentos: ${localMoves}`;
        checkForMemoryMatchLocal();
    }
}

function checkForMemoryMatchLocal() {
    const [id1, id2] = localFlippedCards;
    const card1 = localMemoryCards.find(c => c.id === id1);
    const card2 = localMemoryCards.find(c => c.id === id2);

    if (card1.symbol === card2.symbol) {
        // Match!
        card1.matched = true;
        card2.matched = true;
        localMatchedCards.push(id1, id2);

        // Atualiza o DOM para matched
        onlineGameBoard.querySelector(`.card[data-card-id='${id1}']`).classList.add('matched');
        onlineGameBoard.querySelector(`.card[data-card-id='${id2}']`).classList.add('matched');

        localFlippedCards = []; // Clear flipped cards
        if (localMatchedCards.length === localMemoryCards.length) {
            endMemoryGameLocal();
        }
    } else {
        // No match, flip back after a delay
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            
            // Atualiza o DOM para desvirar
            onlineGameBoard.querySelector(`.card[data-card-id='${id1}']`).classList.remove('flipped');
            onlineGameBoard.querySelector(`.card[data-card-id='${id2}']`).classList.remove('flipped');
            
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
    resetButton.onclick = iniciarJogoMemoriaLocal;
}

// --- LÓGICA DO JOGO DA MEMÓRIA ONLINE ---
async function criarNovoJogoMemoria() {
    // Inicializa o estado do tabuleiro com 16 cards (8 pares)
    const initialBoardState = [];
    const gameSymbols = [...imagePaths, ...imagePaths];
    shuffle(gameSymbols);

    gameSymbols.forEach((symbolPath, index) => {
        initialBoardState.push({
            id: index,
            symbol: symbolPath,
            flipped: false,
            matched: false
        });
    });

    const { data, error } = await _supabase.from('memory_games').insert({
        player1_id: currentUser.id,
        board_state: initialBoardState,
        current_turn_player_id: currentUser.id, // O criador começa
        moves: 0,
        timer: 0,
        status: 'waiting',
        flipped_card_ids: [] // Array vazio para cards virados
    }).select().single();

    if (error) { console.error("Erro ao criar jogo da memória:", error); return; }
    currentMemoryGame = data;
    iniciarVisualizacaoDeJogoMemoria();
    escutarMudancasNoJogoMemoria(currentMemoryGame.id);
}

async function entrarEmJogoMemoria() {
    const gameId = document.getElementById('game-code-input').value.trim();
    if (!gameId) { alert("Por favor, insira um código de jogo."); return; }

    // Tenta entrar como player2
    const { data, error } = await _supabase.from('memory_games')
        .update({ player2_id: currentUser.id, status: 'in_progress' })
        .eq('id', gameId)
        .eq('status', 'waiting')
        .is('player2_id', null)
        .select()
        .single();

    if (error || !data) {
        console.error("Erro ao tentar entrar no jogo da memória:", error);
        alert("Código de jogo inválido, o jogo já tem 2 jogadores, ou não está aguardando.");
        return;
    }

    currentMemoryGame = data;
    iniciarVisualizacaoDeJogoMemoria();
    escutarMudancasNoJogoMemoria(currentMemoryGame.id);
    startMemoryTimer('online'); // Inicia o timer quando o segundo jogador entra
}

function iniciarVisualizacaoDeJogoMemoria() {
    onlineLobby.style.display = 'none';
    gameView.style.display = 'block';
    gameCodeDisplay.style.display = 'block'; // Mostra o código
    gameCodeDisplay.innerHTML = `Código do Jogo: <span onclick="copiarCodigo()">${currentMemoryGame.id}</span> (clique para copiar)`;
    resetButton.style.display = 'none'; // O reset é controlado pelo Supabase no online
    
    // Assegura que os displays de stats estejam visíveis e zerados
    onlineMovesDisplay.textContent = `Movimentos: ${currentMemoryGame.moves}`;
    onlineTimerDisplay.textContent = `Tempo: ${currentMemoryGame.timer}s`;
    
    desenharTabuleiroMemoriaOnline();
    atualizarStatusMemoriaOnline();
}

function copiarCodigo() {
    navigator.clipboard.writeText(currentMemoryGame.id).then(() => alert("Código copiado!"));
}

function escutarMudancasNoJogoMemoria(gameId) {
    if (memoryGameSubscription) {
        memoryGameSubscription.unsubscribe();
    }
    memoryGameSubscription = _supabase.channel(`memory_game-${gameId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'memory_games', filter: `id=eq.${gameId}` }, payload => {
        currentMemoryGame = payload.new;
        desenharTabuleiroMemoriaOnline();
        atualizarStatusMemoriaOnline();
        onlineMovesDisplay.textContent = `Movimentos: ${currentMemoryGame.moves}`;
        onlineTimerDisplay.textContent = `Tempo: ${currentMemoryGame.timer}s`; // Sincroniza o timer
    }).subscribe();
}

function desenharTabuleiroMemoriaOnline() {
    onlineGameBoard.innerHTML = '';
    currentMemoryGame.board_state.forEach(cardData => {
        onlineGameBoard.appendChild(createMemoryCardElement(cardData, 'online'));
    });
}

async function makeMemoryMoveOnline(cardId) {
    // 1. Verificar se é a vez do jogador atual
    if (!isMyTurnToPlay || currentMemoryGame.status !== 'in_progress') {
        return;
    }

    // Encontrar o card no estado atual
    const cardIndex = currentMemoryGame.board_state.findIndex(c => c.id === cardId);
    const card = currentMemoryGame.board_state[cardIndex];

    // 2. Não virar cards já virados ou combinados
    if (!card || card.flipped || card.matched) {
        return;
    }

    // 3. Checar quantos cards já estão virados
    const currentFlipped = [...currentMemoryGame.flipped_card_ids];

    if (currentFlipped.length === 2) {
        // Dois cards já estão virados, significa que a jogada anterior precisa ser resolvida
        // Isso deve ser resolvido pelo jogador do turno anterior ou por um mecanismo de sincronização.
        // Para simplificar, não permite nova jogada até que o estado seja limpo.
        statusDisplay.textContent = "Aguardando oponente resolver a jogada anterior...";
        return;
    }

    // Prepara o novo estado do tabuleiro e cards virados
    const newBoardState = [...currentMemoryGame.board_state];
    newBoardState[cardIndex] = { ...card, flipped: true }; // Vira o card

    let newFlippedCardIds = [...currentFlipped, cardId];
    let newMoves = currentMemoryGame.moves;
    let newStatus = 'in_progress';
    let nextTurnPlayerId = currentMemoryGame.current_turn_player_id; // Mantém o turno até o match

    // Atualiza o contador de movimentos APENAS se 2 cards foram virados
    if (newFlippedCardIds.length === 2) {
        newMoves++;
    }

    // Tenta atualizar o Supabase
    const { error } = await _supabase.from('memory_games').update({
        board_state: newBoardState,
        flipped_card_ids: newFlippedCardIds,
        moves: newMoves
    }).eq('id', currentMemoryGame.id);

    if (error) {
        console.error("Erro ao virar card online:", error);
        statusDisplay.textContent = "Erro na jogada. Tente novamente.";
        return;
    }

    // Se 2 cards foram virados, checa se há um match após um pequeno atraso
    if (newFlippedCardIds.length === 2) {
        setTimeout(async () => {
            const [id1, id2] = newFlippedCardIds;
            const c1 = currentMemoryGame.board_state.find(c => c.id === id1);
            const c2 = currentMemoryGame.board_state.find(c => c.id === id2);

            let boardAfterMatchCheck = [...currentMemoryGame.board_state]; // Reutiliza o estado mais recente
            let newMatchedCards = currentMemoryGame.board_state.filter(c => c.matched).map(c => c.id);

            if (c1.symbol === c2.symbol) {
                // É um par! Marca como matched
                boardAfterMatchCheck[newBoardState.findIndex(c => c.id === id1)].matched = true;
                boardAfterMatchCheck[newBoardState.findIndex(c => c.id === id2)].matched = true;
                newMatchedCards.push(id1, id2); // Adiciona aos cards combinados
                // O turno permanece para o mesmo jogador
            } else {
                // Não é um par, desvira os cards
                boardAfterMatchCheck[newBoardState.findIndex(c => c.id === id1)].flipped = false;
                boardAfterMatchCheck[newBoardState.findIndex(c => c.id === id2)].flipped = false;
                // Troca o turno
                nextTurnPlayerId = currentMemoryGame.player1_id === currentUser.id ? currentMemoryGame.player2_id : currentMemoryGame.player1_id;
            }

            // Verifica se o jogo terminou
            if (newMatchedCards.length === imagePaths.length * 2) { // Todos os cards foram combinados
                newStatus = 'finished';
                // Decide o vencedor. No jogo da memória, o vencedor é quem tem mais pares ou quem faz em menos tempo/movimentos.
                // Isso é complexo de rastrear automaticamente no Supabase para 2 jogadores.
                // Para simplificar, vamos apenas dizer que o jogo terminou e cada um vê seu score localmente.
                // Ou podemos comparar os `moves` e `timer` de cada jogador ao final, mas isso exige um estado mais complexo no DB.
                // Por enquanto, apenas finalizamos. O ranking é individual.
            }
            
            // Atualiza o Supabase com o resultado do match/no-match e a troca de turno
            const { error: updateError } = await _supabase.from('memory_games').update({
                board_state: boardAfterMatchCheck,
                flipped_card_ids: [], // Limpa os cards virados
                current_turn_player_id: nextTurnPlayerId,
                status: newStatus
            }).eq('id', currentMemoryGame.id);

            if (updateError) {
                console.error("Erro ao resolver match/no-match:", updateError);
            }
        }, 1200); // Dá um tempo para o segundo card ser virado antes de checar
    }
}


async function atualizarStatusMemoriaOnline() {
    isMyTurnToPlay = (currentUser.id === currentMemoryGame.current_turn_player_id);

    if (currentMemoryGame.status === 'finished') {
        clearInterval(memoryGameTimerInterval); // Para o timer
        statusDisplay.textContent = 'Jogo Finalizado!';
        resetButton.style.display = 'block';
        resetButton.textContent = 'Jogar Novamente';
        resetButton.onclick = () => location.reload(); // Recarrega para novo jogo ou voltar ao menu
        
        // Registro de recorde pessoal ao final do jogo online
        if (currentUser.id === currentMemoryGame.current_turn_player_id || currentUser.id === currentMemoryGame.player1_id || currentUser.id === currentMemoryGame.player2_id) {
             await registrarRecordeMemoria(currentMemoryGame.timer, currentMemoryGame.moves);
        }

    } else if (currentMemoryGame.status === 'in_progress') {
        if (currentMemoryGame.flipped_card_ids && currentMemoryGame.flipped_card_ids.length === 2) {
            statusDisplay.textContent = "Pares sendo verificados...";
        } else {
            statusDisplay.textContent = isMyTurnToPlay ? 'É a sua vez!' : 'Aguardando jogada do oponente...';
        }
    } else { // status === 'waiting'
        statusDisplay.textContent = 'Aguardando segundo jogador... Compartilhe o código!';
    }
}

// Vincula funções do Jogo da Velha para compatibilidade (remova se não precisar delas aqui)
// Substituí as chamadas de criarNovoJogo e entrarEmJogo pelos da memória.
async function criarNovoJogo() {
    return criarNovoJogoMemoria();
}

async function entrarEmJogo() {
    return entrarEmJogoMemoria();
}

// Funções do Jogo da Velha (Manter para evitar ReferenceError se ainda usa)
// Se você não usa Jogo da Velha neste HTML/JS, pode remover essas funções.
// Deixei algumas para exemplo de compatibilidade e para você ver a diferença.
let localGameActive = true; // do jogo da velha
let localCurrentPlayer = 'X'; // do jogo da velha
let localGameState = ['', '', '', '', '', '', '', '', '']; // do jogo da velha
const winningConditions = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ]; // do jogo da velha

function iniciarJogoLocal() {
    // Esta função era do jogo da velha. Agora ela chama o iniciarJogoMemoriaLocal
    iniciarJogoMemoriaLocal();
}

// As funções do Jogo da Velha (handleCellClickLocal, handleCellPlayedLocal, etc.)
// devem ser removidas ou adaptadas para um ambiente separado, pois este script agora é para Memória.
// Para evitar erros, vou deixar as assinaturas de algumas, mas elas não farão nada relacionado ao Jogo da Velha aqui.

function handleCellClickLocal(event) { /* Não faz nada para memória */ }
function handleCellPlayedLocal(cell, index) { /* Não faz nada para memória */ }
async function validarResultadoLocal() { /* Não faz nada para memória */ }
function trocarJogadorLocal() { /* Não faz nada para memória */ }
function makeComputerMove() { /* Não faz nada para memória */ }

function verificarVencedor(board) {
    // Esta função foi do jogo da velha. A lógica da memória é diferente.
    // Ela não será usada para o jogo da memória.
    return [false, null];
}