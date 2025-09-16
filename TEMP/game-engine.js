class DartGame {
    constructor(players) {
        this.players = players.map(p => ({ ...p }));
        this.currentPlayerIndex = 0;
        this.gameContent = document.getElementById('game-content');
        this.isGameOver = false;
    }
    
    init() {
        this.setupGame();
        this.render();
    }
    
    setupGame() {
        throw new Error('setupGame must be implemented by subclass');
    }
    
    render() {
        throw new Error('render must be implemented by subclass');
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    nextTurn() {
        if (!this.isGameOver) {
            do {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            } while (this.players[this.currentPlayerIndex].eliminated && !this.checkGameOver());
            
            this.render();
        }
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background: ${type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#4ecdc4'};
            color: white;
            border-radius: 25px;
            font-weight: 600;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    createNumberGrid(callback, includeSpecial = false) {
        const grid = document.createElement('div');
        grid.className = 'number-grid';
        
        for (let i = 1; i <= 20; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.onclick = () => callback(i);
            grid.appendChild(btn);
        }
        
        if (includeSpecial) {
            const bullBtn = document.createElement('button');
            bullBtn.className = 'number-btn';
            bullBtn.textContent = 'BULL';
            bullBtn.onclick = () => callback(25);
            grid.appendChild(bullBtn);
        }
        
        return grid;
    }
    
    createMultiplierButtons(callback) {
        const container = document.createElement('div');
        container.className = 'multiplier-buttons';
        
        const multipliers = [
            { value: 1, label: 'Single' },
            { value: 2, label: 'Double' },
            { value: 3, label: 'Triple' }
        ];
        
        multipliers.forEach(m => {
            const btn = document.createElement('button');
            btn.className = 'multiplier-btn';
            btn.textContent = m.label;
            btn.onclick = () => {
                document.querySelectorAll('.multiplier-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                callback(m.value);
            };
            
            if (m.value === 1) {
                btn.classList.add('selected');
            }
            
            container.appendChild(btn);
        });
        
        return container;
    }
    
    checkGameOver() {
        throw new Error('checkGameOver must be implemented by subclass');
    }
    
    announceWinner(winner) {
        this.isGameOver = true;
        
        const winnerDiv = document.createElement('div');
        winnerDiv.style.cssText = `
            text-align: center;
            margin-top: 50px;
            animation: fadeIn 0.5s ease-in-out;
        `;
        
        winnerDiv.innerHTML = `
            <h2 style="font-size: 3rem; color: #51cf66; margin-bottom: 20px;">🎉 Game Over! 🎉</h2>
            <h3 style="font-size: 2rem; color: #2d3436; margin-bottom: 30px;">${winner.name} Wins!</h3>
            <button class="btn-primary" onclick="quitGame()">Back to Menu</button>
        `;
        
        this.gameContent.innerHTML = '';
        this.gameContent.appendChild(winnerDiv);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);