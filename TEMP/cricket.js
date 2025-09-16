class CricketGame extends DartGame {
    setupGame() {
        this.cricketNumbers = [20, 19, 18, 17, 16, 15, 25]; // 25 is bullseye
        
        this.players.forEach(player => {
            player.marks = {};
            player.score = 0;
            player.eliminated = false;
            
            this.cricketNumbers.forEach(num => {
                player.marks[num] = 0;
            });
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
            card.className = `player-score-card ${index === this.currentPlayerIndex ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-score" style="font-size: 2.5rem; color: #4ecdc4; margin: 10px 0;">
                    ${player.score}
                </div>
                <div class="stat-label">Points</div>
            `;
            
            scoreboard.appendChild(card);
        });
        
        this.gameContent.appendChild(scoreboard);
        
        const cricketBoard = document.createElement('div');
        cricketBoard.className = 'cricket-board';
        
        this.cricketNumbers.forEach(num => {
            const numberRow = document.createElement('div');
            numberRow.className = 'cricket-number';
            
            const label = document.createElement('div');
            label.className = 'cricket-number-label';
            label.textContent = num === 25 ? 'BULL' : num;
            
            const marks = document.createElement('div');
            marks.className = 'cricket-marks';
            
            this.players.forEach(player => {
                const playerMarks = document.createElement('div');
                playerMarks.className = 'player-marks';
                playerMarks.innerHTML = `<span style="font-size: 0.8rem; margin-right: 10px;">${player.name}:</span>`;
                
                for (let i = 0; i < 3; i++) {
                    const mark = document.createElement('div');
                    mark.className = 'mark';
                    
                    if (i < player.marks[num]) {
                        mark.classList.add(player.marks[num] >= 3 ? 'closed' : 'hit');
                        mark.textContent = player.marks[num] >= 3 ? 'X' : '/';
                    }
                    
                    playerMarks.appendChild(mark);
                }
                
                marks.appendChild(playerMarks);
            });
            
            numberRow.appendChild(label);
            numberRow.appendChild(marks);
            cricketBoard.appendChild(numberRow);
        });
        
        this.gameContent.appendChild(cricketBoard);
        
        if (!this.isGameOver) {
            const dartInput = document.createElement('div');
            dartInput.className = 'dart-input';
            
            dartInput.innerHTML = `<h3>${this.getCurrentPlayer().name}'s Turn</h3>`;
            dartInput.innerHTML += `<p style="margin-bottom: 20px;">Hit cricket numbers (20-15 & Bull) to close them and score!</p>`;
            
            const grid = document.createElement('div');
            grid.className = 'number-grid';
            
            this.cricketNumbers.forEach(num => {
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = num === 25 ? 'BULL' : num;
                btn.onclick = () => {
                    this.selectedNumber = num;
                    document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
                grid.appendChild(btn);
            });
            
            dartInput.appendChild(grid);
            
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
        const hitNumber = this.selectedNumber;
        const multiplier = this.selectedMultiplier;
        
        if (this.cricketNumbers.includes(hitNumber)) {
            const previousMarks = currentPlayer.marks[hitNumber];
            currentPlayer.marks[hitNumber] = Math.min(3, currentPlayer.marks[hitNumber] + multiplier);
            
            if (currentPlayer.marks[hitNumber] >= 3) {
                const extraHits = (previousMarks + multiplier) - 3;
                
                if (extraHits > 0) {
                    const canScore = this.players.some(p => 
                        p.id !== currentPlayer.id && p.marks[hitNumber] < 3
                    );
                    
                    if (canScore) {
                        const points = hitNumber * extraHits;
                        currentPlayer.score += points;
                        this.showMessage(`${currentPlayer.name} scores ${points} points!`, 'success');
                    }
                } else if (previousMarks < 3) {
                    this.showMessage(`${currentPlayer.name} closed ${hitNumber === 25 ? 'Bull' : hitNumber}!`, 'success');
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
        const allNumbersClosed = this.cricketNumbers.every(num => 
            this.players.some(p => p.marks[num] >= 3)
        );
        
        if (allNumbersClosed) {
            const winner = this.players.reduce((prev, current) => 
                prev.score > current.score ? prev : current
            );
            
            this.announceWinner(winner);
            return true;
        }
        
        return false;
    }
}