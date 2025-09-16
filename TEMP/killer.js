class KillerGame extends DartGame {
    setupGame() {
        const usedNumbers = new Set();
        
        this.players.forEach(player => {
            let number;
            do {
                number = Math.floor(Math.random() * 20) + 1;
            } while (usedNumbers.has(number));
            
            usedNumbers.add(number);
            player.number = number;
            player.lives = 3;
            player.isKiller = false;
            player.eliminated = false;
            player.kills = 0;
        });
        
        this.selectedNumber = null;
        this.selectedMultiplier = 1;
    }
    
    render() {
        this.gameContent.innerHTML = '';
        
        const scoreboard = document.createElement('div');
        scoreboard.className = 'scoreboard';
        
        this.players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = `player-score-card ${index === this.currentPlayerIndex && !player.eliminated ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}`;
            
            card.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-number" style="font-size: 2rem; color: #4ecdc4; margin: 10px 0;">
                    ${player.isKiller ? '🎯 ' : ''}${player.number}
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <div class="stat-label">Lives</div>
                        <div class="stat-value">${player.eliminated ? '☠️' : '❤️'.repeat(player.lives)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Kills</div>
                        <div class="stat-value">${player.kills}</div>
                    </div>
                </div>
            `;
            
            scoreboard.appendChild(card);
        });
        
        this.gameContent.appendChild(scoreboard);
        
        if (!this.isGameOver && !this.getCurrentPlayer().eliminated) {
            const dartInput = document.createElement('div');
            dartInput.className = 'dart-input';
            
            dartInput.innerHTML = `<h3>${this.getCurrentPlayer().name}'s Turn</h3>`;
            
            if (!this.getCurrentPlayer().isKiller) {
                dartInput.innerHTML += `<p style="margin-bottom: 20px;">Hit your number (${this.getCurrentPlayer().number}) to become a killer!</p>`;
            } else {
                dartInput.innerHTML += `<p style="margin-bottom: 20px;">You're a killer! Hit other players' numbers to eliminate them!</p>`;
            }
            
            dartInput.appendChild(this.createNumberGrid((num) => {
                this.selectedNumber = num;
                document.querySelectorAll('.number-btn').forEach(btn => {
                    btn.classList.remove('selected');
                    if (btn.textContent == num) {
                        btn.classList.add('selected');
                    }
                });
            }));
            
            dartInput.appendChild(this.createMultiplierButtons((mult) => {
                this.selectedMultiplier = mult;
            }));
            
            const actionButtons = document.createElement('div');
            actionButtons.className = 'action-buttons';
            
            const hitBtn = document.createElement('button');
            hitBtn.className = 'btn-primary';
            hitBtn.textContent = 'Hit';
            hitBtn.onclick = () => this.handleHit();
            
            const missBtn = document.createElement('button');
            missBtn.className = 'btn-secondary';
            missBtn.textContent = 'Miss';
            missBtn.onclick = () => this.handleMiss();
            
            actionButtons.appendChild(hitBtn);
            actionButtons.appendChild(missBtn);
            
            dartInput.appendChild(actionButtons);
            this.gameContent.appendChild(dartInput);
        }
    }
    
    handleHit() {
        if (!this.selectedNumber) {
            this.showMessage('Please select a number!', 'error');
            return;
        }
        
        const currentPlayer = this.getCurrentPlayer();
        
        if (this.selectedNumber === currentPlayer.number && !currentPlayer.isKiller) {
            currentPlayer.isKiller = true;
            this.showMessage(`${currentPlayer.name} is now a KILLER! 🎯`, 'success');
        } else if (currentPlayer.isKiller) {
            const targetPlayer = this.players.find(p => p.number === this.selectedNumber && !p.eliminated && p.id !== currentPlayer.id);
            
            if (targetPlayer) {
                const damage = this.selectedMultiplier;
                targetPlayer.lives -= damage;
                currentPlayer.kills += damage;
                
                if (targetPlayer.lives <= 0) {
                    targetPlayer.lives = 0;
                    targetPlayer.eliminated = true;
                    this.showMessage(`${targetPlayer.name} has been eliminated! ☠️`, 'error');
                } else {
                    this.showMessage(`${targetPlayer.name} loses ${damage} ${damage === 1 ? 'life' : 'lives'}!`, 'success');
                }
            }
        }
        
        this.selectedNumber = null;
        this.selectedMultiplier = 1;
        
        if (!this.checkGameOver()) {
            this.nextTurn();
        }
    }
    
    handleMiss() {
        this.showMessage(`${this.getCurrentPlayer().name} missed!`, 'info');
        this.selectedNumber = null;
        this.selectedMultiplier = 1;
        this.nextTurn();
    }
    
    checkGameOver() {
        const alivePlayers = this.players.filter(p => !p.eliminated);
        
        if (alivePlayers.length === 1) {
            this.announceWinner(alivePlayers[0]);
            return true;
        }
        
        return false;
    }
}