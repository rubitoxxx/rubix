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
    const jumpButton = document.getElementById('jump-button');
    const ground = document.getElementById('ground');
    const mobileControls = document.getElementById('mobile-controls');

    // --- Configurações do Supabase ---
    const supabaseUrl = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';
    const { createClient } = supabase;
    const _supabase = createClient(supabaseUrl, supabaseKey);

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

    // Verificação de sessão de usuário no início
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;

    // --- LÓGICA DE CONTROLE DE TELAS ---
    function showMainMenu() {
        gameState = 'menu';
        gameContainer.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameOverScreen.style.visibility = 'hidden';
        loadMenuRanking();
        mobileControls.classList.add('hidden');
    }

    function showGame() {
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        startGame();
        // A visibilidade dos controles mobile é controlada principalmente pelo CSS
        // mas esta linha garante que eles sejam mostrados se o CSS permitir
        if (window.innerWidth <= 768) {
            mobileControls.classList.remove('hidden');
        } else {
            mobileControls.classList.add('hidden');
        }
    }

    // ==========================================================
    // --- LÓGICA DO RANKING ---
    // ==========================================================

    async function loadMenuRanking() {
        rankingBoardMenu.innerHTML = '<p>Carregando ranking...</p>';

        const { data, error } = await _supabase
            .from('runner_scores')
            .select('score, profiles(username)')
            .order('score', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Erro ao carregar ranking:", error);
            rankingBoardMenu.innerHTML = '<p>Não foi possível carregar.</p>';
            return;
        }

        if (data.length === 0) {
            rankingBoardMenu.innerHTML = '<p>Seja o primeiro a jogar!</p>';
            return;
        }

        const rankingList = document.createElement('ol');
        data.forEach((entry, index) => {
            const playerName = entry.profiles ? entry.profiles.username : 'Anônimo';
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>#${index + 1} ${playerName}</span> <span>${String(entry.score).padStart(5, '0')}</span>`;
            rankingList.appendChild(listItem);
        });

        rankingBoardMenu.innerHTML = '';
        rankingBoardMenu.appendChild(rankingList);
    }

    async function saveScore(finalScore) {
        if (!currentUser) return;

        const { error } = await _supabase
            .from('runner_scores')
            .insert([{ user_id: currentUser.id, score: finalScore }]);

        if (error) {
            console.error("Erro ao salvar pontuação:", error);
        } else {
            console.log("Pontuação salva!");
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

        setGroundAndCharacterPosition();
        character.src = 'boneco_parado.png';

        ground.style.animationPlayState = 'running';
        document.querySelectorAll('.obstacle').forEach(obs => obs.remove());

        clearTimeout(obstacleTimeoutId);
        clearInterval(scoreInterval);
        clearInterval(gameLoopInterval);

        scoreInterval = setInterval(updateScore, 100);
        gameLoopInterval = setInterval(gameLoop, 20);
        obstacleTimeoutId = setTimeout(spawnObstacle, 1500);
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

        if (characterY > 0) {
            characterY = 0;
            isJumping = false;
            velocityY = 0;
            character.src = 'boneco_parado.png';
        }
        character.style.transform = `translateY(${characterY}px)`;
    }

    function jump() {
        if (gameState !== 'playing') return;
        if (!isJumping) {
            isJumping = true;
            velocityY = jumpPower;
            character.src = 'boneco_pulando.png';
        }
    }

    function spawnObstacle() {
        if (gameState !== 'playing') return;
        const obstacle = document.createElement('img');
        obstacle.src = 'capivara.png';
        obstacle.classList.add('obstacle');
        obstacle.style.right = '-50px';
        obstacle.style.bottom = `${groundHeight - 2}px`; // Garante que o obstáculo nasça na altura correta do chão
        gameContainer.appendChild(obstacle);

        const baseInterval = 1800;
        const randomVariation = 1200;
        const nextSpawnTime = (Math.random() * randomVariation + baseInterval) / (gameSpeed / 4);
        obstacleTimeoutId = setTimeout(spawnObstacle, nextSpawnTime);
    }

    function moveObstacles() {
        // Obtém a largura do #game-container para que os obstáculos sumam ao sair da tela do jogo
        const gameContainerWidth = gameContainer.offsetWidth;

        document.querySelectorAll('.obstacle').forEach(obstacle => {
            let obsRight = parseFloat(obstacle.style.right);
            obstacle.style.right = `${obsRight + gameSpeed}px`;
            // Verifica se o obstáculo saiu da tela do jogo (à esquerda)
            if (obsRight > gameContainerWidth + obstacle.offsetWidth) {
                obstacle.remove();
            }
        });
    }

    function updateScore() {
        if (gameState !== 'playing') return;
        score++;
        scoreDisplay.textContent = String(score).padStart(5, '0');
        if (score > 0 && score % 100 === 0) {
            gameSpeed += 0.5;
        }
    }

    function checkCollision() {
        const charRect = character.getBoundingClientRect();
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            const obsRect = obstacle.getBoundingClientRect();
            // Lógica de colisão
            if (charRect.right > obsRect.left &&
                charRect.left < obsRect.right &&
                charRect.bottom > obsRect.top &&
                charRect.top < obsRect.bottom) {
                handleGameOver();
            }
        });
    }

    async function handleGameOver() {
        if (gameState === 'gameOver') return;
        gameState = 'gameOver';

        clearTimeout(obstacleTimeoutId);
        clearInterval(scoreInterval);
        clearInterval(gameLoopInterval);

        gameOverScreen.style.visibility = 'visible';
        ground.style.animationPlayState = 'paused';

        mobileControls.classList.add('hidden');

        await saveScore(score);
    }

    // --- Eventos de Input ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameState === 'playing') jump();
        }
    });

    jumpButton.addEventListener('click', jump);
    jumpButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    }, { passive: false });

    newGameButton.addEventListener('click', showGame);
    restartButton.addEventListener('click', showMainMenu);
    backToMuralButton.addEventListener('click', () => {
        window.location.href = "mural.html";
    });

    // --- Início do Script ---
    // Ajusta a posição inicial dos elementos ao carregar a página e ao redimensionar
    window.addEventListener('resize', setGroundAndCharacterPosition);
    setGroundAndCharacterPosition(); // Chama a função uma vez no carregamento inicial

    showMainMenu();
});
