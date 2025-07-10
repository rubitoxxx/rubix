// andar.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- Elementos do DOM ---
    const mainMenu = document.getElementById('main-menu');
    const newGameButton = document.getElementById('new-game-button');
    const backToMuralButton = document.getElementById('back-to-mural-button');
    const rankingBoardMenu = document.getElementById('ranking-board-menu');

    const gameContainer = document.getElementById('game-container');
    const character = document.getElementById('character');
    const scoreDisplay = document.getElementById('score');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');
    const ground = document.getElementById('ground');
    gameContainer.addEventListener('touchstart', jump);

    // --- IMPORTANTE: REMOVIDO O BLOCO DE INICIALIZAÇÃO DO SUPABASE DAQUI! ---
    // As configurações do Supabase e sua inicialização devem estar APENAS em 'supabaseClient.js'.
    // O cliente Supabase deve ser acessado via 'window._supabase'.

    // --- Variáveis de Estado do Jogo ---
    let currentUser = null;
    let gameState = 'menu';
    let score = 0;
    let gameSpeed = 4;
    let scoreInterval;
    let gameLoopInterval;
    let obstacleTimeoutId;

    // --- Variáveis do Personagem ---
    let isJumping = false;
    let velocityY = 0;
    const gravity = 0.6;
    const jumpPower = -15;
    let characterY = 0;
    let groundHeight = 0;

    // Função para ajustar a altura do chão e a posição inicial do personagem
    const setGroundAndCharacterPosition = () => {
        // Usa offsetHeight para pegar a altura computada do chão
        groundHeight = ground.offsetHeight;
        // Ajusta a posição inicial do personagem acima do chão
        character.style.bottom = `${groundHeight - 2}px`;
        characterY = 0;
        character.style.transform = `translateY(${characterY}px)`;
    };

    // --- Verificação de sessão de usuário no início ---
    // É crucial que window._supabase esteja definido por supabaseClient.js ANTES disso.
    if (typeof window._supabase === 'undefined') {
        console.error('Supabase client não inicializado. Não é possível verificar a sessão do usuário. Redirecionando...');
        // O ideal é que isso não aconteça com a correção do HTML, mas é um bom fallback.
        // window.location.href = 'index.html'; // Descomente se quiser forçar o redirecionamento
        return; // Retorna para evitar erros caso Supabase não esteja pronto.
    }

    // Tenta obter a sessão do usuário
    try {
        const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
        if (sessionError || !session) {
            console.error('Nenhuma sessão de usuário encontrada ou erro ao carregar sessão:', sessionError?.message);
            window.location.href = 'index.html'; // Redireciona se não houver sessão ou erro
            return;
        }
        currentUser = session.user;
    } catch (e) {
        console.error("Erro ao tentar obter sessão Supabase:", e);
        window.location.href = 'index.html'; // Redireciona em caso de erro inesperado
        return;
    }

    // --- LÓGICA DE CONTROLE DE TELAS ---
    function showMainMenu() {
        gameState = 'menu';
        gameContainer.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameOverScreen.style.visibility = 'hidden';
        loadMenuRanking();

    }

    function showGame() {
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        startGame();
    }

    // ==========================================================
    // --- LÓGICA DO RANKING ---
    // ==========================================================

    async function loadMenuRanking() {
        rankingBoardMenu.innerHTML = '<p>Carregando ranking...</p>';

        if (typeof window._supabase === 'undefined') {
            console.error('Supabase client não inicializado ao carregar ranking.');
            rankingBoardMenu.innerHTML = '<p>Não foi possível carregar o ranking (erro de Supabase).</p>';
            return;
        }

        const { data, error } = await window._supabase
            .from('runner_scores')
            .select('score, profiles(username)')
            .order('score', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Erro ao carregar ranking:", error);
            rankingBoardMenu.innerHTML = '<p>Não foi possível carregar o ranking. Tente novamente.</p>';
            return;
        }

        if (data.length === 0) {
            rankingBoardMenu.innerHTML = '<p>Seja o primeiro a deixar sua marca!</p>';
            return;
        }

        const rankingList = document.createElement('ol');
        data.forEach((entry, index) => {
            // Garante que 'profiles' e 'username' existam antes de acessar
            const playerName = entry.profiles && entry.profiles.username ? entry.profiles.username : 'Anônimo';
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>#${index + 1} ${playerName}</span> <span>${String(entry.score).padStart(5, '0')}</span>`;
            rankingList.appendChild(listItem);
        });

        rankingBoardMenu.innerHTML = '';
        rankingBoardMenu.appendChild(rankingList);
    }

    async function saveScore(finalScore) {
        if (!currentUser) {
            console.warn('Tentativa de salvar pontuação sem usuário logado.');
            return;
        }
        if (typeof window._supabase === 'undefined') {
            console.error('Supabase client não inicializado ao salvar pontuação.');
            return;
        }

        const { error } = await window._supabase
            .from('runner_scores')
            .insert([{ user_id: currentUser.id, score: finalScore }]);

        if (error) {
            console.error("Erro ao salvar pontuação:", error);
        } else {
            console.log("Pontuação salva com sucesso!");
        }
    }

    // ==========================================================
    // --- LÓGICA PRINCIPAL DO JOGO ---
    // ==========================================================
    function startGame() {
        gameState = 'playing';
        score = 0;
        gameSpeed = 4;
        scoreDisplay.textContent = String(score).padStart(5, '0');
        gameOverScreen.style.visibility = 'hidden';

        // Limpa obstáculos antigos (se houver)
        document.querySelectorAll('.obstacle').forEach(obs => obs.remove());

        setGroundAndCharacterPosition();
        character.src = 'boneco_parado.png'; // Garante a imagem inicial

        // Redefine as animações para começar do zero
        // É importante que 'bgMove' esteja definido no seu CSS para #game-container
        // e 'moveGround' no seu CSS para #ground (se aplicável, não vi 'moveGround' no CSS fornecido)
        if (gameContainer) {
            gameContainer.style.animation = 'none';
            void gameContainer.offsetWidth; // Força um reflow
            gameContainer.style.animation = `bgMove ${20 / gameSpeed}s linear infinite`; // Use bgMove ou a animação do chão
        }
        if (ground) { // Verifica se o elemento ground existe
            ground.style.animation = 'none';
            void ground.offsetWidth; // Força um reflow
            // Se você tiver uma animação para o chão, adicione-a aqui
            // Ex: ground.style.animation = `moveGround ${20 / gameSpeed}s linear infinite`;
            ground.style.animationPlayState = 'running';
        }


        // Limpa timeouts/intervals anteriores para evitar múltiplos loops
        clearTimeout(obstacleTimeoutId);
        clearInterval(scoreInterval);
        clearInterval(gameLoopInterval);

        scoreInterval = setInterval(updateScore, 100); // Atualiza score a cada 100ms
        gameLoopInterval = setInterval(gameLoop, 20); // Loop principal do jogo a cada 20ms (50 FPS)
        obstacleTimeoutId = setTimeout(spawnObstacle, 1500); // Primeiro obstáculo após 1.5s
    }

    function gameLoop() {
        if (gameState !== 'playing') return;
        handleJump();
        moveObstacles();
        checkCollision();
    }

    function handleJump() {
        if (!isJumping) return;
        velocityY += gravity;
        characterY += velocityY;

        // Garante que o personagem não caia abaixo do chão
        if (characterY > 0) {
            characterY = 0;
            isJumping = false;
            velocityY = 0;
            character.src = 'boneco_parado.png'; // Volta para imagem de parado
        }
        character.style.transform = `translateY(${characterY}px)`;
    }

    function jump() {
        if (gameState !== 'playing') return; // Só pula se o jogo estiver rodando
        if (!isJumping) {
            isJumping = true;
            velocityY = jumpPower;
            character.src = 'boneco_pulando.png'; // Muda para imagem de pulando
        }
    }

    function spawnObstacle() {
        if (gameState !== 'playing') return;
        const obstacle = document.createElement('img');
        obstacle.src = 'capivara.png'; // Certifique-se que esta imagem existe
        obstacle.classList.add('obstacle');
        obstacle.style.right = '-50px'; // Começa fora da tela à direita
        obstacle.style.bottom = `${groundHeight - 2}px`; // Alinha com o chão
        gameContainer.appendChild(obstacle);

        // Calcula o tempo do próximo obstáculo com base na velocidade do jogo
        const baseInterval = 1800; // Tempo base em ms
        const randomVariation = 1200; // Variação aleatória em ms
        const nextSpawnTime = (Math.random() * randomVariation + baseInterval) / (gameSpeed / 4);
        obstacleTimeoutId = setTimeout(spawnObstacle, nextSpawnTime);
    }

    function moveObstacles() {
        const gameContainerWidth = gameContainer.offsetWidth;

        document.querySelectorAll('.obstacle').forEach(obstacle => {
            let obsRight = parseFloat(obstacle.style.right);
            obstacle.style.right = `${obsRight + gameSpeed}px`; // Move o obstáculo para a esquerda
            if (obsRight > gameContainerWidth + obstacle.offsetWidth) {
                obstacle.remove(); // Remove o obstáculo quando ele sai da tela
            }
        });
    }

    function updateScore() {
        if (gameState !== 'playing') return;
        score++;
        scoreDisplay.textContent = String(score).padStart(5, '0');
        // Aumenta a velocidade do jogo a cada 100 pontos
        if (score > 0 && score % 100 === 0) {
            gameSpeed += 0.5;
            // Atualiza a velocidade da animação do chão para corresponder à velocidade do jogo
            // A animação 'bgMove' no #game-container também deve ser ajustada para refletir a velocidade
            if (gameContainer) {
                 gameContainer.style.animationDuration = `${20 / gameSpeed}s`;
            }
            // Se houver uma animação específica para o 'ground', ajuste-a aqui também.
            // Ex: ground.style.animationDuration = `${20 / gameSpeed}s`;
        }
    }

    function checkCollision() {
        const charRect = character.getBoundingClientRect();
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            const obsRect = obstacle.getBoundingClientRect();
            // Lógica de colisão: verifica se os retângulos de colisão se sobrepõem
            if (charRect.right > obsRect.left &&
                charRect.left < obsRect.right &&
                charRect.bottom > obsRect.top &&
                charRect.top < obsRect.bottom) {
                handleGameOver(); // Colisão detectada, Game Over!
            }
        });
    }
    
    async function handleGameOver() {
        if (gameState === 'gameOver') return; // Evita múltiplas chamadas de Game Over
        gameState = 'gameOver';

        // Limpa todos os intervalos e timeouts para parar o jogo
        clearTimeout(obstacleTimeoutId);
        clearInterval(scoreInterval);
        clearInterval(gameLoopInterval);

        gameOverScreen.style.visibility = 'visible';
        
        if (gameContainer) {
            gameContainer.style.animationPlayState = 'paused'; // Pausa a animação do fundo do jogo
        }
        if (ground) {
            // Se houver uma animação no 'ground', pause-a também
            // Ex: ground.style.animationPlayState = 'paused';
        }

        // Salva a pontuação no Supabase
        await saveScore(score);

        // Adiciona RubixCoins ao usuário
        // Certifique-se de que 'adicionarRubixCoins' está definida em 'utils.js' e acessível globalmente
        if (currentUser && typeof window.adicionarRubixCoins === 'function') {
            const coinsEarned = Math.floor(score / 50) + 1; // Exemplo: 1 moeda a cada 50 pontos + 1 moeda base
            await window.adicionarRubixCoins(currentUser.id, coinsEarned);
            console.log(`Você ganhou ${coinsEarned} RubixCoins por jogar Corrida da Lisa!`);
        } else {
            console.error('Função adicionarRubixCoins não encontrada ou usuário não logado para dar moedas.');
        }
    }

    // --- Eventos de Input ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault(); // Impede a rolagem da página ao pular
            if (gameState === 'playing') jump();
        }
    });

    newGameButton.addEventListener('click', showGame);
    restartButton.addEventListener('click', showMainMenu);
    backToMuralButton.addEventListener('click', () => {
        window.location.href = "mural.html"; // Volta para a página do mural
    });

    // --- Início do Script (Após o DOM ser completamente carregado) ---
    window.addEventListener('resize', setGroundAndCharacterPosition); // Ajusta a posição ao redimensionar
    setGroundAndCharacterPosition(); // Define a posição inicial do chão e personagem

    showMainMenu(); // Mostra o menu principal ao iniciar a página
});
