let currentGame = null;
let currentScreen = 'game-selection';
let selectedGame = '';
let players = [];

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function selectGame(gameType) {
    selectedGame = gameType;
    showScreen('player-setup');
}

function addPlayer() {
    const playerList = document.getElementById('player-list');
    const playerCount = playerList.children.length + 1;
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.innerHTML = `
        <input type="text" placeholder="Player ${playerCount} Name" class="player-name-input">
        <button class="btn-remove" onclick="removePlayer(this)">×</button>
    `;
    
    playerList.appendChild(playerItem);
}

function removePlayer(button) {
    const playerList = document.getElementById('player-list');
    if (playerList.children.length > 2) {
        button.parentElement.remove();
    } else {
        alert('Minimum 2 players required!');
    }
}

function goBack() {
    if (currentScreen === 'player-setup') {
        showScreen('game-selection');
    } else if (currentScreen === 'game-screen') {
        if (confirm('Are you sure you want to quit the current game?')) {
            quitGame();
        }
    }
}

function startGame() {
    const playerInputs = document.querySelectorAll('.player-name-input');
    players = [];
    
    playerInputs.forEach((input, index) => {
        const name = input.value.trim() || `Player ${index + 1}`;
        players.push({ name, id: index });
    });
    
    if (players.length < 2) {
        alert('Please add at least 2 players!');
        return;
    }
    
    document.getElementById('game-title').textContent = getGameTitle(selectedGame);
    showScreen('game-screen');
    
    switch (selectedGame) {
        case 'killer':
            currentGame = new KillerGame(players);
            break;
        case 'blind-killer':
            currentGame = new BlindKillerGame(players);
            break;
        case 'cricket':
            currentGame = new CricketGame(players);
            break;
    }
    
    currentGame.init();
}

function getGameTitle(gameType) {
    switch (gameType) {
        case 'killer': return 'Killer Darts';
        case 'blind-killer': return 'Blind Killer';
        case 'cricket': return 'Cricket Darts';
        default: return 'Dart Game';
    }
}

function quitGame() {
    currentGame = null;
    selectedGame = '';
    players = [];
    showScreen('game-selection');
    
    document.querySelectorAll('.player-name-input').forEach((input, index) => {
        if (index < 2) {
            input.value = '';
        } else {
            input.parentElement.remove();
        }
    });
}