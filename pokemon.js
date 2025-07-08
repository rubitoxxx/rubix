// Definindo as classes Pokémon
class Pokemon {
    constructor(nome, tipo, poder, imagem, ataques) {
        this.nome = nome;
        this.tipo = tipo;
        this.poder = poder;
        this.vidaMaxima = 100; // Adicionada vida máxima para resets e níveis
        this.vida = this.vidaMaxima;
        this.imagem = imagem;
        this.ataques = ataques; // Array de objetos de ataque
        this.nivel = 1;
        this.experiencia = 0;
    }

    atacar() {
        return `${this.nome} usou seu poder de ${this.poder}!`;
    }

    defender() {
        return `${this.nome} se defendeu!`;
    }

    status() {
        return `${this.nome} (Lv.${this.nivel}): Vida ${this.vida}`;
    }

    ganharExperiencia(xpGanha) {
        this.experiencia += xpGanha;
        displayMessage(`${this.nome} ganhou ${xpGanha} de experiência!`);
        if (this.experiencia >= this.nivel * 50) { // XP necessária para subir de nível
            this.nivel++;
            this.experiencia = 0; // Reseta XP para o próximo nível
            this.vidaMaxima += 10; // Aumenta a vida máxima
            this.vida = this.vidaMaxima; // Cura o Pokémon ao subir de nível
            displayMessage(`${this.nome} subiu para o Nível ${this.nivel}!`);
            updateStatus(); // Atualiza a UI
        }
    }
}

class Fogo extends Pokemon {
    constructor(nome, tipo, poder, imagem, ataques) {
        super(nome, tipo, poder, imagem, ataques);
        this.attackClass = "fire-attack"; // Classe CSS para o ataque de fogo
    }
}

class Raio extends Pokemon {
    constructor(nome, tipo, poder, imagem, ataques) {
        super(nome, tipo, poder, imagem, ataques);
        this.attackClass = "electric-attack"; // Classe CSS para o ataque elétrico
    }
}

// =========================================================================
// DEFINIÇÃO DE ATAQUES E POKÉMONS
// Cada ataque agora tem um nome, dano base, tipo e GIF de animação.
const charmanderAtaques = [
    { nome: "Brasas", dano: 20, tipo: "Fogo", gif: "https://i.pinimg.com/originals/37/08/62/370862bbff7f3d3345a3d0e9b45a38c3.gif" },
    { nome: "Investida", dano: 15, tipo: "Normal", gif: "https://pa1.aminoapps.com/6182/bb14f5e263d91f2c25e839e55138122a27ff8976_hq.gif" }
];

const pikachuAtaques = [
    { nome: "Choque do Trovão", dano: 25, tipo: "Elétrico", gif: "https://media1.tenor.com/m/qF-2UrMmvXkAAAAC/pikachu-pokemon.gif" },
    { nome: "Cauda de Ferro", dano: 18, tipo: "Normal", gif: "https://media1.tenor.com/m/qF-2UrMmvXkAAAAC/pikachu-pokemon.gif" }
];

// Inicializando os Pokémons com suas listas de ataques
const charmander = new Fogo("Charmander", "Fogo", "Chamas", "https://i.pinimg.com/originals/48/1e/af/481eafa3a380198012f80595c0dafeec.gif", charmanderAtaques);
const pikachu = new Raio("Pikachu", "Elétrico", "Raio", "https://i.pinimg.com/originals/16/d3/2e/16d32e6bbc6ddb8bb084fcc767a22acf.gif", pikachuAtaques);

// Adicionando mais Pokémons para a fila de inimigos
const bulbasaur = new Pokemon("Bulbasaur", "Planta", "Chicote de Vinha", "https://i.pinimg.com/originals/05/27/dd/0527dd31707ef599981ef8d52366b539.gif", [
    { nome: "Chicote de Vinha", dano: 22, tipo: "Planta", gif: "https://i.pinimg.com/originals/74/29/7f/74297f6c38a167098e9196b2d2f2d956.gif" },
    { nome: "Investida", dano: 15, tipo: "Normal", gif: "https://pa1.aminoapps.com/6182/bb14f5e263d91f2c25e834863076c11.gif" }
]);

const squirtle = new Pokemon("Squirtle", "Água", "Jato de Água", "https://i.pinimg.com/originals/74/e0/75/74e075e7a9e1e27a9d3a778b8f2d5c1a.gif", [
    { nome: "Jato de Água", dano: 23, tipo: "Água", gif: "https://i.gifer.com/origin/79/791c305e714157aa019e078652d8e404.gif" },
    { nome: "Investida", dano: 16, tipo: "Normal", gif: "https://pa1.aminoapps.com/6182/bb14f5e263d91f2c25e834863076c11.gif" }
]);

// Mapa de eficácia de tipos (Vantagens e Desvantagens)
const typeEffectiveness = {
    "Fogo": {
        "Planta": 2,
        "Água": 0.5,
        "Fogo": 0.5,
        "Elétrico": 1,
        "Normal": 1
    },
    "Elétrico": {
        "Água": 2,
        "Planta": 0.5,
        "Fogo": 1,
        "Elétrico": 0.5,
        "Normal": 1
    },
    "Planta": {
        "Água": 2,
        "Fogo": 0.5,
        "Elétrico": 1,
        "Planta": 0.5,
        "Normal": 1
    },
    "Água": {
        "Fogo": 2,
        "Planta": 0.5,
        "Elétrico": 0.5,
        "Água": 0.5,
        "Normal": 1
    },
    "Normal": { // Tipo neutro
        "Fogo": 1, "Planta": 1, "Água": 1, "Elétrico": 1, "Normal": 1
    }
};

let playerPokemon = null;
let enemyPokemon = null;
const enemyQueue = [bulbasaur, squirtle, charmander, pikachu]; // Ordem dos inimigos
let currentEnemyIndex = 0;

// Referências aos elementos da tela
const pokemonSelectScreen = document.getElementById("pokemonSelect");
const battleAreaScreen = document.getElementById("battleArea");
const actionsScreen = document.getElementById("actions");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverMessage = document.getElementById("gameOverMessage");

const playerImageElement = document.getElementById("playerImage");
const enemyImageElement = document.getElementById("enemyImage");
const playerStatusElement = document.getElementById("playerStatus");
const enemyStatusElement = document.getElementById("enemyStatus");
const attackGifElement = document.getElementById("attackGif");
const attackAnimationElement = document.getElementById("attackAnimation");

// Referências às barras de vida
const playerHealthBar = document.getElementById("playerHealthBar");
const enemyHealthBar = document.getElementById("enemyHealthBar");

// Referências aos contêineres dos Pokémons para aplicar o "flash"
const playerPokemonDisplay = document.getElementById("playerPokemon");
const enemyPokemonDisplay = document.getElementById("enemyPokemon");

// Referência à área de mensagens e contêiner de ações
const gameMessageText = document.getElementById("messageText");
const actionsContainer = document.getElementById("actions");

// =========================================================================
// FUNÇÕES DO JOGO

// Função para exibir mensagens no jogo
function displayMessage(message) {
    gameMessageText.textContent = message;
    gameMessageText.classList.remove('fade-in-out'); // Reseta a animação se já estiver ativa
    void gameMessageText.offsetWidth; // Trigger reflow para reiniciar a animação
    gameMessageText.classList.add('fade-in-out');
}

// Função para escolher o Pokémon do jogador
function choosePokemon(pokemonChoice) {
    if (pokemonChoice === "charmander") {
        playerPokemon = charmander;
    } else if (pokemonChoice === "pikachu") {
        playerPokemon = pikachu;
    }
    
    // Define o primeiro inimigo da fila
    currentEnemyIndex = 0; // Garante que começa do primeiro inimigo ao iniciar um novo jogo
    enemyPokemon = enemyQueue[currentEnemyIndex];

    // Resetar vidas para a batalha (se necessário, caso o jogo seja reiniciado no meio)
    playerPokemon.vida = playerPokemon.vidaMaxima;
    enemyPokemon.vida = enemyPokemon.vidaMaxima;

    updateBattleField();
    pokemonSelectScreen.classList.remove("active");
    battleAreaScreen.classList.add("active");
    actionsScreen.classList.add("active");
    displayMessage(`Você escolheu ${playerPokemon.nome}! Prepare-se para enfrentar ${enemyPokemon.nome}!`);
    renderAttackButtons(); // Renderiza os botões de ataque do Pokémon escolhido
}

function updateBattleField() {
    playerImageElement.src = playerPokemon.imagem;
    enemyImageElement.src = enemyPokemon.imagem;
    updateStatus();
    updateHealthBar(playerPokemon, playerHealthBar);
    updateHealthBar(enemyPokemon, enemyHealthBar);
}

function updateStatus() {
    playerStatusElement.textContent = playerPokemon.status();
    enemyStatusElement.textContent = enemyPokemon.status();
    updateHealthBar(playerPokemon, playerHealthBar);
    updateHealthBar(enemyPokemon, enemyHealthBar);
}

// Função para atualizar a barra de vida
function updateHealthBar(pokemon, healthBarElement) {
    const healthPercentage = pokemon.vida > 0 ? (pokemon.vida / pokemon.vidaMaxima) * 100 : 0;
    healthBarElement.style.width = `${healthPercentage}%`;

    // Atualiza a cor da barra de vida
    if (healthPercentage > 50) {
        healthBarElement.style.background = 'linear-gradient(to right, #4CAF50, #8bc34a)'; // Verde
    } else if (healthPercentage > 20) {
        healthBarElement.style.background = 'linear-gradient(to right, #FFC107, #FFEB3B)'; // Amarelo
    } else {
        healthBarElement.style.background = 'linear-gradient(to right, #F44336, #FF5722)'; // Vermelho
    }
}

// Nova função para renderizar os botões de ataque do Pokémon do jogador
function renderAttackButtons() {
    // Limpa apenas os botões de ataque, mantendo o de defender
    const defendButton = actionsContainer.querySelector('button[onclick="defend()"]');
    actionsContainer.innerHTML = ''; // Limpa todos os botões
    
    playerPokemon.ataques.forEach(attack => {
        const button = document.createElement("button");
        button.textContent = attack.nome;
        // Agora, passamos o objeto de ataque completo para performAttack
        button.onclick = () => playerTurn(attack); 
        actionsContainer.appendChild(button);
    });
    // Adiciona o botão de defesa de volta
    actionsContainer.appendChild(defendButton);
}

// Função que gerencia o turno do jogador
function playerTurn(attack) {
    // Desabilita os botões para evitar cliques duplos durante a animação
    disableActions(); 
    performAttack(playerPokemon, enemyPokemon, attack);
}


// Função principal de ataque
function performAttack(attacker, defender, attackData) {
    let attackMessage = `${attacker.nome} usou ${attackData.nome}!`;
    let attackGifUrl = attackData.gif;
    let baseDamage = attackData.dano;

    // Cálculo de eficácia de tipo
    let effectiveness = typeEffectiveness[attacker.tipo]?.[defender.tipo] || 1; // Pega a eficácia, padrão 1 (neutro)
    let finalDamage = baseDamage * effectiveness;

    displayMessage(attackMessage);
    showAttackAnimation(attackGifUrl);
    
    // Aplica a classe de flash e a classe de ataque de tipo (se houver) ao defensor
    const defenderDisplayElement = (defender === playerPokemon) ? playerPokemonDisplay : enemyPokemonDisplay;
    defenderDisplayElement.classList.add('attack-flash');
    if (attacker.attackClass) { // Adiciona a classe de estilo de ataque (ex: fire-attack)
        defenderDisplayElement.classList.add(attacker.attackClass);
    }

    // Remove as classes após um tempo
    setTimeout(() => {
        defenderDisplayElement.classList.remove('attack-flash');
        if (attacker.attackClass) {
            defenderDisplayElement.classList.remove(attacker.attackClass);
        }
    }, 600); // Duração da animação de flash

    // Aplica o dano
    defender.vida -= finalDamage;
    // Garante que a vida não fique negativa
    if (defender.vida < 0) defender.vida = 0; 
    
    updateStatus(); // Atualiza a UI imediatamente após o dano

    // Mensagens de eficácia
    if (effectiveness === 2) {
        displayMessage("É super eficaz!");
    } else if (effectiveness === 0.5) {
        displayMessage("Não foi muito eficaz...");
    } else if (effectiveness === 0) { // Se você adicionar tipos imunes
        displayMessage("Não teve efeito!");
    }

    checkGameOver(); // Verifica o fim do jogo após o ataque do jogador

    // Se o jogo não terminou, é a vez da máquina
    if (playerPokemon.vida > 0 && enemyPokemon.vida > 0) {
        setTimeout(machineTurn, 2000); // 2 segundos para o turno da máquina
    }
}


function defend() {
    displayMessage(`${playerPokemon.nome} se defendeu!`);
    updateStatus();
    disableActions(); // Desabilita ações durante o turno da máquina
    setTimeout(machineTurn, 1500); // Espera um pouco antes do turno da máquina
}

function showAttackAnimation(gifUrl) {
    attackGifElement.src = gifUrl;
    attackAnimationElement.classList.add("active");
    
    setTimeout(() => {
        attackAnimationElement.classList.remove("active");
    }, 1500); // Duração da animação do GIF
}

function checkGameOver() {
    if (enemyPokemon.vida <= 0) {
        displayMessage(`${enemyPokemon.nome} foi derrotado!`);
        playerPokemon.ganharExperiencia(50); // Ganha XP por derrotar o Pokémon

        currentEnemyIndex++; // Avança para o próximo inimigo
        if (currentEnemyIndex < enemyQueue.length) {
            // Próxima batalha!
            setTimeout(() => {
                enemyPokemon = enemyQueue[currentEnemyIndex];
                enemyPokemon.vida = enemyPokemon.vidaMaxima; // Reseta vida do novo inimigo
                displayMessage(`Um novo oponente, ${enemyPokemon.nome}, apareceu!`);
                
                // Opcional: Curar um pouco o playerPokemon entre batalhas
                playerPokemon.vida = Math.min(playerPokemon.vida + 20, playerPokemon.vidaMaxima); 
                
                updateBattleField();
                enableActions(); // Habilita ações para o próximo turno
            }, 3000); // Pequeno atraso antes da próxima batalha
        } else {
            // Todas as batalhas vencidas!
            showGameOverScreen("victory"); 
            gameOverMessage.textContent = "Você derrotou todos os treinadores! Parabéns!";
        }
    } else if (playerPokemon.vida <= 0) {
        showGameOverScreen("defeat");
    }
}

function disableActions() {
    const actionButtons = document.querySelectorAll("#actions button");
    actionButtons.forEach(button => {
        button.disabled = true;
    });
}

function enableActions() {
    const actionButtons = document.querySelectorAll("#actions button");
    actionButtons.forEach(button => {
        button.disabled = false;
    });
}


function machineTurn() {
    if (enemyPokemon.vida <= 0 || playerPokemon.vida <= 0) {
        return; // Sai se o jogo já terminou
    }

    const action = getRandomAction();
    
    if (action === "attack") {
        // Escolhe um ataque aleatório do Pokémon inimigo
        const randomAttackIndex = Math.floor(Math.random() * enemyPokemon.ataques.length);
        const enemyAttack = enemyPokemon.ataques[randomAttackIndex];
        
        performAttack(enemyPokemon, playerPokemon, enemyAttack);
    } else {
        displayMessage(`${enemyPokemon.nome} se defendeu!`);
        updateStatus();
        enableActions(); // Habilita as ações do jogador após a defesa do inimigo
    }
}

function getRandomAction() {
    // 70% de chance de atacar, 30% de chance de defender
    return Math.random() < 0.7 ? "attack" : "defend";
}

function irParaMural() {
    window.location.href = "mural.html";
}

// Lógica da tela de fim de jogo
function showGameOverScreen(result) {
    disableActions(); // Garante que os botões estão desabilitados

    battleAreaScreen.classList.remove("active");
    actionsScreen.classList.remove("active");
    gameOverScreen.classList.add("active");

    if (result === "victory") {
        gameOverScreen.classList.add("victory");
        gameOverScreen.classList.remove("defeat");
        gameOverTitle.textContent = "🏆 VITÓRIA!";
        displayMessage(`Parabéns! Você venceu a batalha contra ${enemyPokemon.nome}!`);
    } else {
        gameOverScreen.classList.add("defeat");
        gameOverScreen.classList.remove("victory");
        gameOverTitle.textContent = "💔 DERROTA!";
        gameOverMessage.textContent = `${playerPokemon.nome} foi derrotado!`;
        displayMessage(`Que pena! Você perdeu a batalha.`);
    }
}

function resetGame() {
    // Resetar vidas e stats de todos os Pokémons para o estado inicial
    charmander.vida = charmander.vidaMaxima = 100;
    charmander.nivel = 1;
    charmander.experiencia = 0;

    pikachu.vida = pikachu.vidaMaxima = 100;
    pikachu.nivel = 1;
    pikachu.experiencia = 0;

    bulbasaur.vida = bulbasaur.vidaMaxima = 100;
    bulbasaur.nivel = 1; // Para garantir que o inimigo começa no nível certo
    bulbasaur.experiencia = 0;

    squirtle.vida = squirtle.vidaMaxima = 100;
    squirtle.nivel = 1;
    squirtle.experiencia = 0;

    playerPokemon = null; // Reseta o Pokémon do jogador
    enemyPokemon = null; // Reseta o inimigo
    currentEnemyIndex = 0; // Volta para o primeiro inimigo na fila

    enableActions(); // Habilitar botões
    
    // Esconder telas de batalha/game over e mostrar seleção
    gameOverScreen.classList.remove("active", "victory", "defeat");
    battleAreaScreen.classList.remove("active");
    actionsScreen.classList.remove("active");
    pokemonSelectScreen.classList.add("active");

    // Limpar imagens e status (opcional, pois a seleção sobrescreverá)
    playerImageElement.src = "";
    enemyImageElement.src = "https://media1.tenor.com/m/qF-2UrMmvXkAAAAC/pikachu-pokemon.gif";
    playerStatusElement.textContent = "";
    enemyStatusElement.textContent = "";
    
    // As barras de vida serão atualizadas quando o Pokémon for escolhido
    displayMessage("Escolha seu Pokémon para iniciar a batalha!"); // Mensagem inicial ao reiniciar
}

// Evento que ocorre quando o DOM é completamente carregado
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa as barras de vida com 100% no início
    updateHealthBar(charmander, playerHealthBar);
    updateHealthBar(pikachu, enemyHealthBar); // Apenas para inicializar a barra, ela será atualizada ao escolher o inimigo
    displayMessage("Escolha seu Pokémon para iniciar a batalha!"); // Mensagem inicial
});

// Salvamento de progresso (opcional, para usar com o mural)
function saveGameProgress() {
    if (playerPokemon) { // Só salva se um Pokémon foi escolhido
        const gameData = {
            playerPokemon: {
                nome: playerPokemon.nome,
                vida: playerPokemon.vida,
                vidaMaxima: playerPokemon.vidaMaxima,
                nivel: playerPokemon.nivel,
                experiencia: playerPokemon.experiencia
            },
            currentEnemyIndex: currentEnemyIndex
        };
        localStorage.setItem('pokemonBattleGame', JSON.stringify(gameData));
        displayMessage("Progresso salvo!");
    }
}

// Carregamento de progresso (opcional, para usar com o mural)
function loadGameProgress() {
    const savedData = localStorage.getItem('pokemonBattleGame');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        
        // Recria o playerPokemon com base nos dados salvos
        if (gameData.playerPokemon.nome === "Charmander") {
            playerPokemon = charmander;
        } else if (gameData.playerPokemon.nome === "Pikachu") {
            playerPokemon = pikachu;
        }

        if (playerPokemon) {
            playerPokemon.vida = gameData.playerPokemon.vida;
            playerPokemon.vidaMaxima = gameData.playerPokemon.vidaMaxima;
            playerPokemon.nivel = gameData.playerPokemon.nivel;
            playerPokemon.experiencia = gameData.playerPokemon.experiencia;

            currentEnemyIndex = gameData.currentEnemyIndex;
            enemyPokemon = enemyQueue[currentEnemyIndex];
            enemyPokemon.vida = enemyPokemon.vidaMaxima; // Reseta a vida do inimigo carregado

            // Esconde a tela de seleção e mostra a de batalha
            pokemonSelectScreen.classList.remove("active");
            battleAreaScreen.classList.add("active");
            actionsScreen.classList.add("active");

            updateBattleField();
            renderAttackButtons();
            displayMessage("Progresso carregado! Continue sua batalha!");
        }
    } else {
        displayMessage("Nenhum progresso salvo encontrado.");
    }
}

// Exemplo de como você poderia adicionar botões de Salvar/Carregar
// Ou até mesmo salvar automaticamente ao final de uma batalha
// Por exemplo, você pode adicionar um botão "Salvar Jogo" no seu HTML e chamar saveGameProgress()
// E um botão "Carregar Jogo" na tela inicial ou no mural para chamar loadGameProgress()
