document.addEventListener('DOMContentLoaded', () => {
    const character = document.getElementById('character');
    const forestBackground = document.getElementById('forest-background');
    const leftButton = document.getElementById('left-button'); // Novo
    const rightButton = document.getElementById('right-button'); // Novo

    let characterSpeed = 5;
    let backgroundPosition = 0;
    let facingRight = true;

    const characterImages = {
        idle: 'boneco_parado.png',
        walk1: 'boneco_andando1.png',
        walk2: 'boneco_andando2.png'
    };

    let animationFrame = 0;
    let animationInterval;
    let movementInterval; // Novo: Para manter o movimento contínuo ao segurar o botão

    function startWalkAnimation() {
        if (animationInterval) return;
        animationInterval = setInterval(() => {
            animationFrame = (animationFrame + 1) % 2;
            character.src = animationFrame === 0 ? characterImages.walk1 : characterImages.walk2;
        }, 150);
    }

    function stopWalkAnimation() {
        clearInterval(animationInterval);
        animationInterval = null;
        character.src = characterImages.idle;
    }

    let keys = {}; // Para teclado
    let isMovingLeft = false; // Para botões de toque
    let isMovingRight = false; // Para botões de toque

    // Função principal de atualização do movimento (chamada por teclado e toque)
    function updateCharacterMovement() {
        let moving = false;
        if (keys['ArrowLeft'] || keys['a'] || isMovingLeft) { // Inclui isMovingLeft
            backgroundPosition += characterSpeed;
            // Limita para não ir muito para a direita (início do cenário)
            if (backgroundPosition > 0) backgroundPosition = 0;
            facingRight = false;
            moving = true;
        }
        if (keys['ArrowRight'] || keys['d'] || isMovingRight) { // Inclui isMovingRight
            backgroundPosition -= characterSpeed;
            // Você pode adicionar um limite para o cenário aqui se quiser ter um "fim" da floresta
            // Exemplo: if (backgroundPosition < - (forestBackground.scrollWidth - window.innerWidth)) { ... }
            facingRight = true;
            moving = true;
        }

        forestBackground.style.left = backgroundPosition + 'px';

        if (facingRight) {
            character.style.transform = 'translateX(-50%) scaleX(1)';
        } else {
            character.style.transform = 'translateX(-50%) scaleX(-1)';
        }

        // Inicia/Para animação de caminhada com base no movimento
        if (moving && !animationInterval) {
            startWalkAnimation();
        } else if (!moving && animationInterval) {
            stopWalkAnimation();
        }
    }

    // Loop de movimento contínuo
    function gameLoop() {
        updateCharacterMovement();
        requestAnimationFrame(gameLoop); // Otimizado para animação no navegador
    }
    requestAnimationFrame(gameLoop);


    // --- Eventos de Teclado (Mantidos para Desktop) ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys[e.key] = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            keys[e.key] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys[e.key] = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            keys[e.key] = false;
        }
    });

    // --- Eventos de Toque (Novos para Mobile) ---

    // Botão Esquerdo
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Previne o comportamento padrão de toque (ex: scroll)
        isMovingLeft = true;
    }, { passive: false }); // Use { passive: false } para preventDefault

    leftButton.addEventListener('touchend', () => {
        isMovingLeft = false;
    });

    // Para compatibilidade com mouse clicks em telas touch ou desktop
    leftButton.addEventListener('mousedown', () => {
        isMovingLeft = true;
    });
    leftButton.addEventListener('mouseup', () => {
        isMovingLeft = false;
    });
    leftButton.addEventListener('mouseleave', () => { // Se o mouse sair do botão enquanto pressionado
        isMovingLeft = false;
    });


    // Botão Direito
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isMovingRight = true;
    }, { passive: false });

    rightButton.addEventListener('touchend', () => {
        isMovingRight = false;
    });

    // Para compatibilidade com mouse clicks
    rightButton.addEventListener('mousedown', () => {
        isMovingRight = true;
    });
    rightButton.addEventListener('mouseup', () => {
        isMovingRight = false;
    });
    rightButton.addEventListener('mouseleave', () => {
        isMovingRight = false;
    });
});
