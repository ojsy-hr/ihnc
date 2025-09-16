class BlindKillerGame extends DartGame {
    setupGame() {
        const numbers = [];
        for (let i = 1; i <= 20; i++) {
            numbers.push(i);
        }
        
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        this.players.forEach((player, index) => {
            player.number = numbers[index];
            player.lives = 3;
            player.isKiller = false;
            player.eliminated = false;
            player.kills = 0;
            player.knowsNumber = false;
        });
        
        this.selectedNumber = null;
        this.selectedMultiplier = 1;
        this.revealedNumbers = new Set();
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
                    ${player.isKiller ? '🎯 ' : ''}
                    ${player.knowsNumber || player.eliminated ? player.number : '???'}
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
        
        if (this.revealedNumbers.size > 0) {
            const revealedDiv = document.createElement('div');
            revealedDiv.style.cssText = 'text-align: center; margin: 20px 0; color: #666;';
            revealedDiv.innerHTML = `<p>Numbers NOT in play: ${Array.from(this.revealedNumbers).sort((a, b) => a - b).join(', ')}</p>`;
            this.gameContent.appendChild(revealedDiv);
        }
        
        if (!this.isGameOver && !this.getCurrentPlayer().eliminated) {
            const dartInput = document.createElement('div');
            dartInput.className = 'dart-input';
            
            dartInput.innerHTML = `<h3>${this.getCurrentPlayer().name}'s Turn</h3>`;
            
            if (!this.getCurrentPlayer().isKiller) {
                dartInput.innerHTML += `<p style="margin-bottom: 20px;">Hit any number. If you hit your secret number, you become a killer!</p>`;
            } else {
                dartInput.innerHTML += `<p style="margin-bottom: 20px;">You're a killer! Try to hit other players' secret numbers!</p>`;
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
        let hitSomeone = false;
        
        if (this.selectedNumber === currentPlayer.number && !currentPlayer.isKiller) {
            currentPlayer.isKiller = true;
            currentPlayer.knowsNumber = true;
            this.showMessage(`${currentPlayer.name} discovered their number (${currentPlayer.number}) and is now a KILLER! 🎯`, 'success');
        } else {
            const targetPlayers = this.players.filter(p => 
                p.number === this.selectedNumber && 
                !p.eliminated && 
                p.id !== currentPlayer.id
            );
            
            if (targetPlayers.length > 0 && currentPlayer.isKiller) {
                targetPlayers.forEach(targetPlayer => {
                    const damage = this.selectedMultiplier;
                    targetPlayer.lives -= damage;
                    currentPlayer.kills += damage;
                    hitSomeone = true;
                    
                    if (targetPlayer.lives <= 0) {
                        targetPlayer.lives = 0;
                        targetPlayer.eliminated = true;
                        targetPlayer.knowsNumber = true;
                        this.showMessage(`${targetPlayer.name} (${targetPlayer.number}) has been eliminated! ☠️`, 'error');
                    } else {
                        this.showMessage(`Someone was hit! ${damage} ${damage === 1 ? 'life' : 'lives'} lost!`, 'success');
                    }
                });
            }
            
            if (!hitSomeone) {
                const isAnyonesNumber = this.players.some(p => p.number === this.selectedNumber);
                if (!isAnyonesNumber) {
                    this.revealedNumbers.add(this.selectedNumber);
                    this.showMessage(`${this.selectedNumber} is not anyone's number!`, 'info');
                } else {
                    this.showMessage('No effect!', 'info');
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