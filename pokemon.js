// Definindo as classes Pokémon
class Pokemon {
    constructor(nome, tipo, poder, imagem) {
        this.nome = nome;
        this.tipo = tipo;
        this.poder = poder;
        this.vida = 100;
        this.imagem = imagem;
    }

    atacar() {
        return `${this.nome} usou seu poder de ${this.poder}!`;
    }

    defender() {
        return `${this.nome} se defendeu!`;
    }

    status() {
        return `${this.nome}: Vida ${this.vida}`;
    }
}

class Fogo extends Pokemon {
    constructor(nome, tipo, poder, imagem) {
        super(nome, tipo, poder, imagem);
        this.ataqueTipoNome = "Bola de Fogo";
        this.ataqueTipoGif = "https://i.pinimg.com/originals/37/08/62/370862bbff7f3d3345a3d0e9b45a38c3.gif";
        this.attackClass = "fire-attack"; // Classe CSS para o ataque de fogo
    }

    ataqueFogo() {
        return `${this.nome} usou ${this.ataqueTipoNome}!`;
    }
}

class Raio extends Pokemon {
    constructor(nome, tipo, poder, imagem) {
        super(nome, tipo, poder, imagem);
        this.ataqueTipoNome = "Choque do Trovão";
        this.ataqueTipoGif = "https://i.pinimg.com/originals/f1/b6/c7/f1b6c7591a909b12eda1d980fe83a16a.gif";
        this.attackClass = "electric-attack"; // Classe CSS para o ataque elétrico
    }

    ataqueRaio() {
        return `${this.nome} usou ${this.ataqueTipoNome}!`;
    }
}

// Inicializando os Pokémons
const charmander = new Fogo("Charmander", "Fogo", "Chamas", "https://i.pinimg.com/originals/48/1e/af/481eafa3a380198012f80595c0dafeec.gif");
const pikachu = new Raio("Pikachu", "Elétrico", "Raio", "https://i.pinimg.com/originals/16/d3/2e/16d32e6bbc6ddb8bb084fcc767a22acf.gif");

let playerPokemon = null;
let enemyPokemon = null;

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

// Referência à área de mensagens
const gameMessageText = document.getElementById("messageText");


// Função para exibir mensagens no jogo
function displayMessage(message) {
    gameMessageText.textContent = message;
    // Opcional: Adicionar uma animação ou estilo temporário para a mensagem
    gameMessageText.classList.add('fade-in-out');
    setTimeout(() => {
        gameMessageText.classList.remove('fade-in-out');
    }, 1500); // Tempo da animação
}


function choosePokemon(pokemonChoice) {
    if (pokemonChoice === "charmander") {
        playerPokemon = charmander;
        enemyPokemon = pikachu;
    } else if (pokemonChoice === "pikachu") {
        playerPokemon = pikachu;
        enemyPokemon = charmander;
    }

    updateBattleField();
    pokemonSelectScreen.classList.remove("active");
    battleAreaScreen.classList.add("active");
    actionsScreen.classList.add("active");
    displayMessage(`Você escolheu ${playerPokemon.nome}!`);
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

// Nova função para atualizar a barra de vida
function updateHealthBar(pokemon, healthBarElement) {
    const healthPercentage = pokemon.vida > 0 ? pokemon.vida : 0;
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


function performAttack(attacker, defender, attackType) {
    let attackMessage = "";
    let attackGifUrl = "";
    let damage = 20; // Dano padrão
    let attackClass = ""; // Classe para o efeito visual do ataque

    if (attacker instanceof Fogo && attackType === "fogo") {
        attackMessage = attacker.ataqueFogo();
        attackGifUrl = attacker.ataqueTipoGif;
        attackClass = attacker.attackClass;
    } else if (attacker instanceof Raio && attackType === "raio") {
        attackMessage = attacker.ataqueRaio();
        attackGifUrl = attacker.ataqueTipoGif;
        attackClass = attacker.attackClass;
    } else {
        displayMessage("Ataque inválido para este Pokémon.");
        return;
    }

    displayMessage(attackMessage); // Substituindo alert()
    showAttackAnimation(attackGifUrl);
    
    // Aplica a classe de flash e ataque ao defensor
    const defenderDisplayElement = (defender === playerPokemon) ? playerPokemonDisplay : enemyPokemonDisplay;
    defenderDisplayElement.classList.add('attack-flash');
    defenderDisplayElement.classList.add(attackClass);

    // Remove as classes após um tempo
    setTimeout(() => {
        defenderDisplayElement.classList.remove('attack-flash');
        defenderDisplayElement.classList.remove(attackClass);
    }, 600);

    defender.vida -= damage;
    checkGameOver();
    setTimeout(updateStatus, 1000);
    
    if (playerPokemon.vida > 0 && enemyPokemon.vida > 0) {
        setTimeout(machineTurn, 2000);
    }
}

function attackFogo() {
    if (playerPokemon instanceof Fogo) {
        performAttack(playerPokemon, enemyPokemon, "fogo");
    } else {
        displayMessage("Ataque de Fogo é para Charmander!"); // Substituindo alert()
    }
}

function attackRaio() {
    if (playerPokemon instanceof Raio) {
        performAttack(playerPokemon, enemyPokemon, "raio");
    } else {
        displayMessage("Ataque de Raio é para Pikachu!"); // Substituindo alert()
    }
}

function defend() {
    displayMessage(playerPokemon.defender()); // Substituindo alert()
    updateStatus();
    machineTurn();
}

function showAttackAnimation(gifUrl) {
    attackGifElement.src = gifUrl;
    attackAnimationElement.classList.add("active");
    
    setTimeout(() => {
        attackAnimationElement.classList.remove("active");
    }, 1500);
}

function checkGameOver() {
    if (enemyPokemon.vida <= 0) {
        showGameOverScreen("victory");
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

function machineTurn() {
    if (enemyPokemon.vida <= 0 || playerPokemon.vida <= 0) {
        return;
    }

    const action = getRandomAction();
    
    if (action === "attack") {
        let enemyAttackType = "";
        if (enemyPokemon instanceof Fogo) {
            enemyAttackType = "fogo";
        } else if (enemyPokemon instanceof Raio) {
            enemyAttackType = "raio";
        }
        performAttack(enemyPokemon, playerPokemon, enemyAttackType);
    } else {
        displayMessage(`${enemyPokemon.nome} se defendeu!`); // Substituindo alert()
        updateStatus();
    }
}

function getRandomAction() {
    return Math.random() < 0.7 ? "attack" : "defend";
}

function irParaMural() {
    window.location.href = "mural.html";
}

// Lógica da tela de fim de jogo
function showGameOverScreen(result) {
    disableActions();

    battleAreaScreen.classList.remove("active");
    actionsScreen.classList.remove("active");
    gameOverScreen.classList.add("active");

    if (result === "victory") {
        gameOverScreen.classList.add("victory");
        gameOverScreen.classList.remove("defeat");
        gameOverTitle.textContent = "🏆 VITÓRIA!";
        gameOverMessage.textContent = `Você derrotou ${enemyPokemon.nome}!`;
        displayMessage(`Parabéns! Você venceu a batalha!`); // Mensagem final
    } else {
        gameOverScreen.classList.add("defeat");
        gameOverScreen.classList.remove("victory");
        gameOverTitle.textContent = "💔 DERROTA!";
        gameOverMessage.textContent = `${playerPokemon.nome} foi derrotado!`;
        displayMessage(`Que pena! Você perdeu a batalha.`); // Mensagem final
    }
}

function resetGame() {
    // Resetar vidas
    charmander.vida = 100;
    pikachu.vida = 100;

    // Resetar Pokémons escolhidos
    playerPokemon = null;
    enemyPokemon = null;

    // Habilitar botões
    const actionButtons = document.querySelectorAll("#actions button");
    actionButtons.forEach(button => {
        button.disabled = false;
    });

    // Esconder telas de batalha/game over e mostrar seleção
    gameOverScreen.classList.remove("active", "victory", "defeat");
    battleAreaScreen.classList.remove("active");
    actionsScreen.classList.remove("active");
    pokemonSelectScreen.classList.add("active");

    // Limpar imagens e status (opcional, pois a seleção sobrescreverá)
    playerImageElement.src = "";
    enemyImageElement.src = "";
    playerStatusElement.textContent = "";
    enemyStatusElement.textContent = "";
    updateHealthBar(charmander, playerHealthBar);
    updateHealthBar(pikachu, enemyHealthBar);
    displayMessage("Bem-vindo à Batalha Pokémon!"); // Mensagem inicial ao reiniciar
}

document.addEventListener("DOMContentLoaded", () => {
    updateHealthBar(charmander, playerHealthBar);
    updateHealthBar(pikachu, enemyHealthBar);
    displayMessage("Escolha seu Pokémon para iniciar a batalha!"); // Mensagem inicial
});
