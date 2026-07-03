(function(){
  'use strict';
  
  const gameEngine = window.gameEngine = {
    startGame(id) {
      if(id === 'tictactoe') this.startTicTacToe();
      else if(id === 'minesweeper') this.startMinesweeper();
      else if(id === 'chess') this.startChess();
      else if(id === 'checkers') this.startCheckers();
      else if(id === 'sudoku') this.startSudoku();
      else if(id === 'battleship') this.startBattleship();
    },

    qs(sel) { return document.querySelector(sel) },
    qsa(sel) { return Array.from(document.querySelectorAll(sel)) },

    award(coins, rating) {
      try {
        const s = JSON.parse(localStorage.getItem('ef_state_v1')||'{}');
        s.shopCoins = (s.shopCoins||0) + coins;
        s.ratingCoins = (s.ratingCoins||0) + rating;
        localStorage.setItem('ef_state_v1', JSON.stringify(s));
        app.save();
        this.showModal('🎉 Награда!', `+${coins} монет ��агазина\n+${rating} рейтинг очков`);
      } catch(e) { console.warn('award failed', e) }
    },

    showModal(title, text) {
      const modal = document.getElementById('modal');
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalText').textContent = text;
      modal.style.display = 'flex';
    },

    // ============ ТИК-ТАК-ТОЕ ============
    startTicTacToe() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';
      
      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = 'Крестики-нолики';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '10px';
      controls.style.marginBottom = '15px';
      controls.style.flexWrap = 'wrap';

      const btnNew = document.createElement('button');
      btnNew.className = 'buy-btn';
      btnNew.textContent = 'Новая игра';
      controls.appendChild(btnNew);

      const difficultyBtn = document.createElement('button');
      difficultyBtn.className = 'shop-tab';
      difficultyBtn.textContent = 'Легко';
      controls.appendChild(difficultyBtn);

      const statsDiv = document.createElement('div');
      statsDiv.style.fontSize = '12px';
      statsDiv.style.color = '#666';
      statsDiv.innerHTML = 'Уровень: <strong>1 звезда</strong>';
      controls.appendChild(statsDiv);

      const resultDiv = document.createElement('div');
      resultDiv.style.textAlign = 'center';
      resultDiv.style.marginBottom = '15px';
      resultDiv.id = 'tictactoeResult';

      body.appendChild(controls);
      body.appendChild(resultDiv);

      const board = document.createElement('div');
      board.className = 't3-board';
      board.style.margin = '0 auto';
      body.appendChild(board);

      let difficulty = 'easy';
      let state;

      const newGame = () => {
        state = {
          board: Array(9).fill(null),
          human: 'X',
          ai: 'O',
          gameOver: false,
          result: null
        };
        renderBoard();
        resultDiv.innerHTML = '';
      };

      const renderBoard = () => {
        board.innerHTML = '';
        state.board.forEach((cell, i) => {
          const div = document.createElement('div');
          div.className = 't3-cell';
          div.textContent = cell || '';
          if (!state.gameOver && !cell) {
            div.style.cursor = 'pointer';
            div.onclick = () => makeMove(i);
          }
          board.appendChild(div);
        });
      };

      const makeMove = (index) => {
        if (state.board[index] || state.gameOver) return;
        state.board[index] = state.human;
        const winner = checkWinner();
        if (winner) {
          state.gameOver = true;
          state.result = winner === state.human ? 'win' : (winner === state.ai ? 'loss' : 'draw');
          endGame();
          renderBoard();
          return;
        }
        setTimeout(() => {
          const aiIndex = getAiMove();
          if (aiIndex !== null) {
            state.board[aiIndex] = state.ai;
            const w = checkWinner();
            if (w) {
              state.gameOver = true;
              state.result = w === state.human ? 'win' : (w === state.ai ? 'loss' : 'draw');
              endGame();
            }
          }
          renderBoard();
        }, 300);
      };

      const getAiMove = () => {
        if (difficulty === 'easy') return getEasyMove();
        if (difficulty === 'medium') return getMediumAiMove();
        return getHardAiMove();
      };

      const getEasyMove = () => {
        if (Math.random() < 0.7) {
          const empty = state.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
          return empty[Math.floor(Math.random() * empty.length)];
        }
        for (let i = 0; i < 9; i++) {
          if (!state.board[i]) {
            state.board[i] = state.ai;
            if (checkWinner() === state.ai) {
              state.board[i] = null;
              return i;
            }
            state.board[i] = null;
          }
        }
        const empty = state.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        return empty[Math.floor(Math.random() * empty.length)];
      };

      const getMediumAiMove = () => {
        for (let i = 0; i < 9; i++) {
          if (!state.board[i]) {
            state.board[i] = state.ai;
            if (checkWinner() === state.ai) {
              state.board[i] = null;
              return i;
            }
            state.board[i] = null;
          }
        }
        for (let i = 0; i < 9; i++) {
          if (!state.board[i]) {
            state.board[i] = state.human;
            if (checkWinner() === state.human) {
              state.board[i] = null;
              return i;
            }
            state.board[i] = null;
          }
        }
        if (!state.board[4]) return 4;
        const corners = [0, 2, 6, 8].filter(i => !state.board[i]);
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
        const empty = state.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        return empty[Math.floor(Math.random() * empty.length)];
      };

      const getHardAiMove = () => {
        let bestScore = -Infinity;
        let bestMoves = [];
        
        for (let i = 0; i < 9; i++) {
          if (!state.board[i]) {
            state.board[i] = state.ai;
            const score = minimax(0, false, -Infinity, Infinity);
            state.board[i] = null;
            
            if (score > bestScore) {
              bestScore = score;
              bestMoves = [i];
            } else if (score === bestScore) {
              bestMoves.push(i);
            }
          }
        }
        
        if (bestMoves.includes(4)) return 4;
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      };

      const minimax = (depth, isMax, alpha, beta) => {
        const winner = checkWinner();
        
        if (winner === state.ai) return 10 - depth;
        if (winner === state.human) return depth - 10;
        
        const empty = state.board.some(v => v === null);
        if (!empty) return 0;

        if (isMax) {
          let score = -Infinity;
          for (let i = 0; i < 9; i++) {
            if (!state.board[i]) {
              state.board[i] = state.ai;
              score = Math.max(score, minimax(depth + 1, false, alpha, beta));
              state.board[i] = null;
              alpha = Math.max(alpha, score);
              if (beta <= alpha) break;
            }
          }
          return score;
        } else {
          let score = Infinity;
          for (let i = 0; i < 9; i++) {
            if (!state.board[i]) {
              state.board[i] = state.human;
              score = Math.min(score, minimax(depth + 1, true, alpha, beta));
              state.board[i] = null;
              beta = Math.min(beta, score);
              if (beta <= alpha) break;
            }
          }
          return score;
        }
      };

      const checkWinner = () => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let line of lines) {
          const [a,b,c] = line;
          if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            return state.board[a];
          }
        }
        if (state.board.some(v => v === null)) return null;
        return 'draw';
      };

      const endGame = () => {
        let msg = '🤝 Ничья!';
        let coins = 0, rating = 0;
        if (state.result === 'win') {
          msg = '🎉 Вы победили!';
          coins = 6;
          rating = 5;
          gameEngine.award(coins, rating);
        } else if (state.result === 'loss') {
          msg = '💔 Вы проиграли';
        } else if (state.result === 'draw') {
          coins = 3;
          rating = 2;
          gameEngine.award(coins, rating);
        }
        resultDiv.innerHTML = `<strong>${msg}</strong>`;
      };

      const updateStats = () => {
        const levels = { easy: '⭐ Легко (1 звезда)', medium: '⭐⭐ Средне (2 звезды)', hard: '⭐⭐⭐ Сложно (3 звезды)' };
        statsDiv.innerHTML = `Уровень: <strong>${levels[difficulty]}</strong>`;
      };

      btnNew.onclick = () => newGame();
      difficultyBtn.onclick = () => {
        if (difficulty === 'easy') {
          difficulty = 'medium';
          difficultyBtn.textContent = 'Средне';
        } else if (difficulty === 'medium') {
          difficulty = 'hard';
          difficultyBtn.textContent = 'Сложно';
        } else {
          difficulty = 'easy';
          difficultyBtn.textContent = 'Легко';
        }
        updateStats();
        newGame();
      };

      updateStats();
      newGame();
    },

    // ============ САПЕР ============
    startMinesweeper() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = 'Сапёр';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'grid';
      controls.style.gridTemplateColumns = '1fr 1fr 1fr';
      controls.style.gap = '10px';
      controls.style.marginBottom = '15px';

      const btnEasy = document.createElement('button');
      btnEasy.className = 'buy-btn';
      btnEasy.textContent = '⭐ Легко';
      controls.appendChild(btnEasy);

      const btnMed = document.createElement('button');
      btnMed.className = 'buy-btn';
      btnMed.textContent = '⭐⭐ Средне';
      controls.appendChild(btnMed);

      const btnHard = document.createElement('button');
      btnHard.className = 'buy-btn';
      btnHard.textContent = '⭐⭐⭐ Сложно';
      controls.appendChild(btnHard);

      const resultDiv = document.createElement('div');
      resultDiv.style.textAlign = 'center';
      resultDiv.style.marginBottom = '15px';
      resultDiv.id = 'minesweeperResult';

      const statsDiv = document.createElement('div');
      statsDiv.style.textAlign = 'center';
      statsDiv.style.marginBottom = '10px';
      statsDiv.style.fontSize = '12px';
      statsDiv.style.color = '#666';

      body.appendChild(controls);
      body.appendChild(resultDiv);
      body.appendChild(statsDiv);

      const board = document.createElement('div');
      board.className = 'ms-board';
      board.style.margin = '0 auto';
      board.style.width = 'fit-content';
      body.appendChild(board);

      let rows, cols, mines, gameState, difficulty = 'easy';

      const setup = (r, c, m, diff) => {
        rows = r;
        cols = c;
        mines = m;
        difficulty = diff;
        gameState = {
          board: Array(rows * cols).fill(0),
          revealed: Array(rows * cols).fill(false),
          flagged: Array(rows * cols).fill(false),
          gameOver: false,
          won: false
        };

        let mineCount = 0;
        while (mineCount < mines) {
          const idx = Math.floor(Math.random() * rows * cols);
          if (gameState.board[idx] !== 'X') {
            gameState.board[idx] = 'X';
            mineCount++;
          }
        }

        for (let i = 0; i < rows * cols; i++) {
          if (gameState.board[i] !== 'X') {
            let count = 0;
            const r = Math.floor(i / cols);
            const c = i % cols;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  const ni = nr * cols + nc;
                  if (gameState.board[ni] === 'X') count++;
                }
              }
            }
            gameState.board[i] = count;
          }
        }

        resultDiv.innerHTML = '';
        updateStats();
        renderBoard();
      };

      const updateStats = () => {
        const diffText = { easy: '⭐ Легко', medium: '⭐⭐ Средне', hard: '⭐⭐⭐ Сложно' };
        const minesLeft = gameState.flagged.filter(f => f).length;
        statsDiv.innerHTML = `${diffText[difficulty]} | Мины: ${mines} | Отмечено: ${minesLeft}`;
      };

      const renderBoard = () => {
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${cols}, 36px)`;
        
        for (let i = 0; i < rows * cols; i++) {
          const cell = document.createElement('div');
          cell.className = 'ms-cell';
          
          if (gameState.revealed[i]) {
            cell.classList.add('revealed');
            if (gameState.board[i] === 'X') {
              cell.textContent = '💣';
            } else if (gameState.board[i] > 0) {
              cell.textContent = gameState.board[i];
              cell.style.color = ['#0074ff','#2ecc71','#ff0000','#000080','#8b0000','#008080','#000000','#808080'][gameState.board[i]-1];
            }
          } else if (gameState.flagged[i]) {
            cell.classList.add('flag');
            cell.textContent = '🚩';
          }

          if (!gameState.gameOver && !gameState.won && !gameState.revealed[i]) {
            cell.style.cursor = 'pointer';
            cell.oncontextmenu = (e) => {
              e.preventDefault();
              gameState.flagged[i] = !gameState.flagged[i];
              updateStats();
              renderBoard();
            };
            cell.onclick = () => reveal(i);
          }

          board.appendChild(cell);
        }
      };

      const reveal = (idx) => {
        if (gameState.revealed[idx] || gameState.flagged[idx]) return;
        
        if (gameState.board[idx] === 'X') {
          gameState.gameOver = true;
          gameState.revealed.fill(true);
          resultDiv.innerHTML = '<strong>💣 Игра окончена! Вы наехали на мину!</strong>';
          renderBoard();
          return;
        }

        const queue = [idx];
        while (queue.length > 0) {
          const i = queue.shift();
          if (gameState.revealed[i]) continue;
          gameState.revealed[i] = true;

          if (gameState.board[i] === 0) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  queue.push(nr * cols + nc);
                }
              }
            }
          }
        }

        if (gameState.revealed.filter((v, i) => !v && gameState.board[i] !== 'X').length === 0) {
          gameState.won = true;
          let coins = 10, rating = 8;
          if (difficulty === 'medium') { coins = 15; rating = 12; }
          else if (difficulty === 'hard') { coins = 25; rating = 20; }
          resultDiv.innerHTML = '<strong>🎉 Вы победили!</strong>';
          gameEngine.award(coins, rating);
        }

        renderBoard();
      };

      btnEasy.onclick = () => setup(6, 6, 6, 'easy');
      btnMed.onclick = () => setup(9, 9, 10, 'medium');
      btnHard.onclick = () => setup(12, 12, 30, 'hard');

      setup(6, 6, 6, 'easy');
    },

    // ============ ШАХМАТЫ ============
    startChess() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = '♟️ Шахматы';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '10px';
      controls.style.marginBottom = '15px';
      controls.style.flexWrap = 'wrap';

      const btnNew = document.createElement('button');
      btnNew.className = 'buy-btn';
      btnNew.textContent = 'Новая игра';
      controls.appendChild(btnNew);

      const difficultyBtn = document.createElement('button');
      difficultyBtn.className = 'shop-tab';
      difficultyBtn.textContent = 'Легко';
      controls.appendChild(difficultyBtn);

      const statsDiv = document.createElement('div');
      statsDiv.style.fontSize = '12px';
      statsDiv.style.color = '#666';
      statsDiv.textContent = 'Уровень: Легко';
      controls.appendChild(statsDiv);

      const infoDiv = document.createElement('div');
      infoDiv.style.fontSize = '12px';
      infoDiv.style.color = '#666';
      infoDiv.textContent = 'Кликните на фигуру, потом на целевую клетку для хода';
      controls.appendChild(infoDiv);

      const resultDiv = document.createElement('div');
      resultDiv.style.textAlign = 'center';
      resultDiv.style.marginBottom = '15px';
      resultDiv.style.fontWeight = 'bold';

      body.appendChild(controls);
      body.appendChild(resultDiv);

      const board = document.createElement('div');
      board.style.display = 'grid';
      board.style.gridTemplateColumns = 'repeat(8, 40px)';
      board.style.gap = '1px';
      board.style.background = '#999';
      board.style.padding = '5px';
      board.style.margin = '10px auto';
      board.style.borderRadius = '5px';
      body.appendChild(board);

      let gameState = initializeChess();
      let difficulty = 'easy';
      let waitingForAI = false;

      function initializeChess() {
        return {
          board: [
            ['♜','♞','♝','♛','♚','♝','♞','♜'],
            ['♟','♟','♟','♟','♟','♟','♟','♟'],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ['♙','♙','♙','♙','♙','♙','♙','♙'],
            ['♖','♘','♗','♕','♔','♗','♘','♖']
          ],
          selectedRow: null,
          selectedCol: null,
          moves: 0,
          isPlayerTurn: true,
          gameOver: false
        };
      }

      const pieceValues = {
        '♙': 1, '♘': 3, '♗': 3, '♖': 5, '♕': 9, '♔': 1000,
        '♟': 1, '♞': 3, '♝': 3, '♜': 5, '♛': 9, '♚': 1000
      };

      const isPlayerPiece = (piece) => piece && '♔♕♖♗♘♙'.includes(piece);
      const isAIPiece = (piece) => piece && '♚♛♜♝♞♟'.includes(piece);

      function getValidMoves(row, col) {
        const moves = [];
        const piece = gameState.board[row][col];
        if (!piece) return moves;

        const isPlayer = isPlayerPiece(piece);
        const p = piece.toLowerCase();

        if (p === '♚' || p === '♔') {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr, nc = col + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = gameState.board[nr][nc];
                if (!target || (isPlayer ? isAIPiece(target) : isPlayerPiece(target))) {
                  moves.push([nr, nc]);
                }
              }
            }
          }
        } else if (p === '♟' || p === '♙') {
          const direction = isPlayer ? -1 : 1;
          const startRow = isPlayer ? 6 : 1;
          const nr = row + direction;
          if (nr >= 0 && nr < 8 && !gameState.board[nr][col]) {
            moves.push([nr, col]);
            if (row === startRow && !gameState.board[row + 2*direction][col]) {
              moves.push([row + 2*direction, col]);
            }
          }
          for (let dc of [-1, 1]) {
            const nc = col + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const target = gameState.board[nr][nc];
              if (target && (isPlayer ? isAIPiece(target) : isPlayerPiece(target))) {
                moves.push([nr, nc]);
              }
            }
          }
        } else {
          const dirs = p === '♘' || p === '♞' ? 
            [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]] :
            [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
          
          for (let [dr, dc] of dirs) {
            let nr = row + dr, nc = col + dc;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const target = gameState.board[nr][nc];
              if (!target) {
                moves.push([nr, nc]);
              } else if (isPlayer ? isAIPiece(target) : isPlayerPiece(target)) {
                moves.push([nr, nc]);
                break;
              } else {
                break;
              }
              if (p === '♘' || p === '♞') break;
              nr += dr;
              nc += dc;
            }
          }
        }

        return moves;
      }

      function evaluatePosition() {
        let score = 0;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = gameState.board[r][c];
            if (piece) {
              const value = pieceValues[piece] || 0;
              score += isPlayerPiece(piece) ? value : -value;
            }
          }
        }
        return score;
      }

      function minimax(depth, isMaximizing, alpha, beta) {
        if (depth === 0) {
          return evaluatePosition();
        }

        let moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (isMaximizing ? isAIPiece(gameState.board[r][c]) : isPlayerPiece(gameState.board[r][c])) {
              const pieceMoves = getValidMoves(r, c);
              for (let [nr, nc] of pieceMoves) {
                moves.push([r, c, nr, nc]);
              }
            }
          }
        }

        if (moves.length === 0) return isMaximizing ? -Infinity : Infinity;

        if (isMaximizing) {
          let maxEval = -Infinity;
          for (let [r, c, nr, nc] of moves) {
            const captured = gameState.board[nr][nc];
            gameState.board[nr][nc] = gameState.board[r][c];
            gameState.board[r][c] = null;
            const eval_ = minimax(depth - 1, false, alpha, beta);
            gameState.board[r][c] = gameState.board[nr][nc];
            gameState.board[nr][nc] = captured;
            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha) break;
          }
          return maxEval;
        } else {
          let minEval = Infinity;
          for (let [r, c, nr, nc] of moves) {
            const captured = gameState.board[nr][nc];
            gameState.board[nr][nc] = gameState.board[r][c];
            gameState.board[r][c] = null;
            const eval_ = minimax(depth - 1, true, alpha, beta);
            gameState.board[r][c] = gameState.board[nr][nc];
            gameState.board[nr][nc] = captured;
            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha) break;
          }
          return minEval;
        }
      }

      function getAIMove() {
        let moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (isAIPiece(gameState.board[r][c])) {
              const pieceMoves = getValidMoves(r, c);
              for (let [nr, nc] of pieceMoves) {
                moves.push([r, c, nr, nc]);
              }
            }
          }
        }

        if (moves.length === 0) {
          gameState.gameOver = true;
          resultDiv.innerHTML = '<strong style="color: green;">🎉 Вы выиграли! Королю мат!</strong>';
          gameEngine.award(15, 12);
          return null;
        }

        if (difficulty === 'easy') {
          return moves[Math.floor(Math.random() * moves.length)];
        }

        let bestScore = -Infinity;
        let bestMoves = [];

        for (let [r, c, nr, nc] of moves) {
          const captured = gameState.board[nr][nc];
          gameState.board[nr][nc] = gameState.board[r][c];
          gameState.board[r][c] = null;
          const score = minimax(difficulty === 'medium' ? 2 : 3, false, -Infinity, Infinity);
          gameState.board[r][c] = gameState.board[nr][nc];
          gameState.board[nr][nc] = captured;

          if (score > bestScore) {
            bestScore = score;
            bestMoves = [[r, c, nr, nc]];
          } else if (score === bestScore) {
            bestMoves.push([r, c, nr, nc]);
          }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }

      function renderBoard() {
        board.innerHTML = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.style.width = '40px';
            cell.style.height = '40px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.background = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
            cell.style.cursor = 'pointer';
            cell.style.fontSize = '24px';
            cell.style.transition = 'all 0.2s';
            cell.textContent = gameState.board[row][col] || '';

            if (gameState.selectedRow === row && gameState.selectedCol === col) {
              cell.style.background = '#baca44';
              cell.style.boxShadow = 'inset 0 0 10px rgba(186, 202, 68, 0.5)';
            }

            cell.onmouseover = () => { if (!waitingForAI) cell.style.opacity = '0.8'; };
            cell.onmouseout = () => { cell.style.opacity = '1'; };
            cell.onclick = () => !waitingForAI && moveChess(row, col);
            board.appendChild(cell);
          }
        }
      }

      function moveChess(row, col) {
        if (waitingForAI || !gameState.isPlayerTurn || gameState.gameOver) return;

        if (gameState.selectedRow === null) {
          if (isPlayerPiece(gameState.board[row][col])) {
            gameState.selectedRow = row;
            gameState.selectedCol = col;
          }
        } else {
          if (gameState.selectedRow === row && gameState.selectedCol === col) {
            gameState.selectedRow = null;
            gameState.selectedCol = null;
          } else {
            const moves = getValidMoves(gameState.selectedRow, gameState.selectedCol);
            const isValidMove = moves.some(m => m[0] === row && m[1] === col);

            if (isValidMove) {
              gameState.board[row][col] = gameState.board[gameState.selectedRow][gameState.selectedCol];
              gameState.board[gameState.selectedRow][gameState.selectedCol] = null;
              gameState.selectedRow = null;
              gameState.selectedCol = null;
              gameState.moves++;
              gameState.isPlayerTurn = false;

              waitingForAI = true;
              setTimeout(() => {
                const move = getAIMove();
                if (move) {
                  const [r, c, nr, nc] = move;
                  gameState.board[nr][nc] = gameState.board[r][c];
                  gameState.board[r][c] = null;

                  const playerAlive = false;
                  for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                      if (gameState.board[i][j] === '♔') return;
                    }
                  }
                  
                  gameState.gameOver = true;
                  resultDiv.innerHTML = '<strong style="color: red;">💔 Вы проиграли! Ваш король в мате!</strong>';
                }
                gameState.isPlayerTurn = true;
                waitingForAI = false;
                renderBoard();
              }, 500);
            } else {
              gameState.selectedRow = null;
              gameState.selectedCol = null;
            }
          }
        }
        renderBoard();
      }

      btnNew.onclick = () => {
        gameState = initializeChess();
        resultDiv.innerHTML = '';
        waitingForAI = false;
        renderBoard();
      };

      difficultyBtn.onclick = () => {
        if (difficulty === 'easy') {
          difficulty = 'medium';
          difficultyBtn.textContent = 'Средне';
          statsDiv.textContent = 'Уровень: Средне';
        } else if (difficulty === 'medium') {
          difficulty = 'hard';
          difficultyBtn.textContent = 'Сложно';
          statsDiv.textContent = 'Уровень: Сложно';
        } else {
          difficulty = 'easy';
          difficultyBtn.textContent = 'Легко';
          statsDiv.textContent = 'Уровень: Легко';
        }
        gameState = initializeChess();
        resultDiv.innerHTML = '';
        waitingForAI = false;
        renderBoard();
      };

      renderBoard();
    },

    // ============ ШАШКИ ============
    startCheckers() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = '⚫ Шашки';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '10px';
      controls.style.marginBottom = '15px';
      controls.style.flexWrap = 'wrap';

      const btnNew = document.createElement('button');
      btnNew.className = 'buy-btn';
      btnNew.textContent = 'Новая игра';
      controls.appendChild(btnNew);

      const difficultyBtn = document.createElement('button');
      difficultyBtn.className = 'shop-tab';
      difficultyBtn.textContent = 'Легко';
      controls.appendChild(difficultyBtn);

      const statsDiv = document.createElement('div');
      statsDiv.style.fontSize = '12px';
      statsDiv.style.color = '#666';
      statsDiv.textContent = 'Уровень: Легко';
      controls.appendChild(statsDiv);

      const infoDiv = document.createElement('div');
      infoDiv.style.fontSize = '12px';
      infoDiv.style.color = '#666';
      infoDiv.textContent = 'Кликните на шашку, потом на клетку (по диагонали или на 2 клетки для взятия)';
      controls.appendChild(infoDiv);

      const resultDiv = document.createElement('div');
      resultDiv.style.textAlign = 'center';
      resultDiv.style.marginBottom = '15px';
      resultDiv.style.fontWeight = 'bold';

      body.appendChild(controls);
      body.appendChild(resultDiv);

      const board = document.createElement('div');
      board.style.display = 'grid';
      board.style.gridTemplateColumns = 'repeat(8, 40px)';
      board.style.gap = '1px';
      board.style.background = '#999';
      board.style.padding = '5px';
      board.style.margin = '10px auto';
      board.style.borderRadius = '5px';
      body.appendChild(board);

      let gameState = initializeCheckers();
      let difficulty = 'easy';
      let waitingForAI = false;

      function initializeCheckers() {
        const b = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) b[r][c] = '⚫';
          }
        }
        for (let r = 5; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) b[r][c] = '⚪';
          }
        }
        return { 
          board: b, 
          selectedRow: null, 
          selectedCol: null, 
          moves: 0,
          isPlayerTurn: true,
          gameOver: false,
          playerDames: {},
          aiDames: {}
        };
      }

      function isPlayerPiece(piece) {
        return piece === '⚪' || (gameState.playerDames && gameState.playerDames[piece]);
      }

      function isAIPiece(piece) {
        return piece === '⚫' || (gameState.aiDames && gameState.aiDames[piece]);
      }

      function getValidMoves(row, col) {
        const moves = [];
        const piece = gameState.board[row][col];
        if (!piece) return moves;

        const isDame = piece.includes('♕');
        const isPlayer = isPlayerPiece(piece);

        const directions = isDame ? 
          [[1,1],[1,-1],[-1,1],[-1,-1]] : 
          isPlayer ? [[1,1],[1,-1]] : [[-1,1],[-1,-1]];

        for (let [dr, dc] of directions) {
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!gameState.board[nr][nc]) {
              moves.push([nr, nc, false]);
            }
            const nr2 = nr + dr, nc2 = nc + dc;
            if (nr2 >= 0 && nr2 < 8 && nc2 >= 0 && nc2 < 8 && 
                gameState.board[nr][nc] && 
                (isPlayer ? isAIPiece(gameState.board[nr][nc]) : isPlayerPiece(gameState.board[nr][nc])) &&
                !gameState.board[nr2][nc2]) {
              moves.push([nr2, nc2, true]);
            }
          }

          if (isDame) {
            let nr = row + dr * 2, nc = col + dc * 2;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              if (!gameState.board[nr][nc]) {
                moves.push([nr, nc, false]);
              } else if ((isPlayer ? isAIPiece(gameState.board[nr][nc]) : isPlayerPiece(gameState.board[nr][nc]))) {
                if (nr + dr >= 0 && nr + dr < 8 && nc + dc >= 0 && nc + dc < 8 && !gameState.board[nr + dr][nc + dc]) {
                  moves.push([nr + dr, nc + dc, true]);
                }
                break;
              } else {
                break;
              }
              nr += dr;
              nc += dc;
            }
          }
        }

        return moves;
      }

      function evaluatePosition() {
        let score = 0;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = gameState.board[r][c];
            if (piece) {
              const isPlayer = isPlayerPiece(piece);
              const isDame = piece.includes('♕');
              const value = isDame ? 5 : 1;
              const advancement = isPlayer ? r : (7 - r);
              score += isPlayer ? (value + advancement * 0.1) : -(value + advancement * 0.1);
            }
          }
        }
        return score;
      }

      function minimax(depth, isMaximizing, alpha, beta) {
        if (depth === 0) {
          return evaluatePosition();
        }

        let moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (isMaximizing ? isAIPiece(gameState.board[r][c]) : isPlayerPiece(gameState.board[r][c])) {
              const pieceMoves = getValidMoves(r, c);
              for (let [nr, nc, isCapture] of pieceMoves) {
                moves.push([r, c, nr, nc, isCapture]);
              }
            }
          }
        }

        if (moves.length === 0) return isMaximizing ? -Infinity : Infinity;

        if (isMaximizing) {
          let maxEval = -Infinity;
          for (let [r, c, nr, nc, isCapture] of moves) {
            const captured = gameState.board[nr][nc];
            const capturedPiece = isCapture ? gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] : null;
            gameState.board[nr][nc] = gameState.board[r][c];
            gameState.board[r][c] = null;
            if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = null;

            const eval_ = minimax(depth - 1, false, alpha, beta);
            gameState.board[r][c] = gameState.board[nr][nc];
            gameState.board[nr][nc] = captured;
            if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = capturedPiece;

            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha) break;
          }
          return maxEval;
        } else {
          let minEval = Infinity;
          for (let [r, c, nr, nc, isCapture] of moves) {
            const captured = gameState.board[nr][nc];
            const capturedPiece = isCapture ? gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] : null;
            gameState.board[nr][nc] = gameState.board[r][c];
            gameState.board[r][c] = null;
            if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = null;

            const eval_ = minimax(depth - 1, true, alpha, beta);
            gameState.board[r][c] = gameState.board[nr][nc];
            gameState.board[nr][nc] = captured;
            if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = capturedPiece;

            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha) break;
          }
          return minEval;
        }
      }

      function getAIMove() {
        let moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (isAIPiece(gameState.board[r][c])) {
              const pieceMoves = getValidMoves(r, c);
              for (let [nr, nc, isCapture] of pieceMoves) {
                moves.push([r, c, nr, nc, isCapture]);
              }
            }
          }
        }

        if (moves.length === 0) {
          gameState.gameOver = true;
          resultDiv.innerHTML = '<strong style="color: green;">🎉 Вы выиграли!</strong>';
          gameEngine.award(20, 15);
          return null;
        }

        if (difficulty === 'easy') {
          return moves[Math.floor(Math.random() * moves.length)];
        }

        const captureMoves = moves.filter(m => m[4]);
        const priorityMoves = captureMoves.length > 0 ? captureMoves : moves;

        let bestScore = -Infinity;
        let bestMoves = [];

        for (let [r, c, nr, nc, isCapture] of priorityMoves) {
          const captured = gameState.board[nr][nc];
          const capturedPiece = isCapture ? gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] : null;
          gameState.board[nr][nc] = gameState.board[r][c];
          gameState.board[r][c] = null;
          if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = null;

          const depth = difficulty === 'medium' ? 3 : 5;
          const score = minimax(depth, false, -Infinity, Infinity);

          gameState.board[r][c] = gameState.board[nr][nc];
          gameState.board[nr][nc] = captured;
          if (isCapture) gameState.board[Math.floor((r+nr)/2)][Math.floor((c+nc)/2)] = capturedPiece;

          if (score > bestScore) {
            bestScore = score;
            bestMoves = [[r, c, nr, nc, isCapture]];
          } else if (score === bestScore) {
            bestMoves.push([r, c, nr, nc, isCapture]);
          }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }

      function renderBoard() {
        board.innerHTML = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.style.width = '40px';
            cell.style.height = '40px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.background = (row + col) % 2 === 0 ? '#e0e0e0' : '#333';
            cell.style.cursor = 'pointer';
            cell.style.fontSize = '24px';
            cell.style.transition = 'all 0.2s';
            cell.textContent = gameState.board[row][col] || '';

            if (gameState.selectedRow === row && gameState.selectedCol === col) {
              cell.style.background = '#FFD700';
              cell.style.boxShadow = 'inset 0 0 10px rgba(255, 215, 0, 0.5)';
            }

            cell.onmouseover = () => { if (!waitingForAI) cell.style.opacity = '0.8'; };
            cell.onmouseout = () => { cell.style.opacity = '1'; };
            cell.onclick = () => !waitingForAI && moveCheckers(row, col);
            board.appendChild(cell);
          }
        }
      }

      function moveCheckers(row, col) {
        if (waitingForAI || !gameState.isPlayerTurn || gameState.gameOver) return;

        if (gameState.selectedRow === null) {
          if (isPlayerPiece(gameState.board[row][col])) {
            gameState.selectedRow = row;
            gameState.selectedCol = col;
          }
        } else {
          const moves = getValidMoves(gameState.selectedRow, gameState.selectedCol);
          const moveData = moves.find(m => m[0] === row && m[1] === col);

          if (moveData) {
            const [nr, nc, isCapture] = moveData;
            gameState.board[row][col] = gameState.board[gameState.selectedRow][gameState.selectedCol];
            gameState.board[gameState.selectedRow][gameState.selectedCol] = null;

            if (isCapture) {
              const captureRow = Math.floor((gameState.selectedRow + row) / 2);
              const captureCol = Math.floor((gameState.selectedCol + col) / 2);
              gameState.board[captureRow][captureCol] = null;
            }

            if ((isPlayerPiece(gameState.board[row][col]) && row === 7) ||
                (isAIPiece(gameState.board[row][col]) && row === 0)) {
              gameState.board[row][col] += '♕';
            }

            gameState.selectedRow = null;
            gameState.selectedCol = null;
            gameState.moves++;
            gameState.isPlayerTurn = false;

            waitingForAI = true;
            setTimeout(() => {
              const move = getAIMove();
              if (move) {
                const [r, c, nr, nc, isCapture] = move;
                gameState.board[nr][nc] = gameState.board[r][c];
                gameState.board[r][c] = null;

                if (isCapture) {
                  const captureRow = Math.floor((r + nr) / 2);
                  const captureCol = Math.floor((c + nc) / 2);
                  gameState.board[captureRow][captureCol] = null;
                }

                if ((isPlayerPiece(gameState.board[nr][nc]) && nr === 7) ||
                    (isAIPiece(gameState.board[nr][nc]) && nr === 0)) {
                  gameState.board[nr][nc] += '♕';
                }

                const playerHasPieces = gameState.board.some(row => 
                  row.some(piece => isPlayerPiece(piece))
                );

                if (!playerHasPieces) {
                  gameState.gameOver = true;
                  resultDiv.innerHTML = '<strong style="color: red;">💔 Вы проиграли!</strong>';
                }
              }
              gameState.isPlayerTurn = true;
              waitingForAI = false;
              renderBoard();
            }, 500);
          } else {
            gameState.selectedRow = null;
            gameState.selectedCol = null;
          }
        }
        renderBoard();
      }

      btnNew.onclick = () => {
        gameState = initializeCheckers();
        resultDiv.innerHTML = '';
        waitingForAI = false;
        renderBoard();
      };

      difficultyBtn.onclick = () => {
        if (difficulty === 'easy') {
          difficulty = 'medium';
          difficultyBtn.textContent = 'Средне';
          statsDiv.textContent = 'Уровень: Средне';
        } else if (difficulty === 'medium') {
          difficulty = 'hard';
          difficultyBtn.textContent = 'Сложно';
          statsDiv.textContent = 'Уровень: Сложно';
        } else {
          difficulty = 'easy';
          difficultyBtn.textContent = 'Легко';
          statsDiv.textContent = 'Уровень: Легко';
        }
        gameState = initializeCheckers();
        resultDiv.innerHTML = '';
        waitingForAI = false;
        renderBoard();
      };

      renderBoard();
    },

    // ============ СУДОКУ ============
    startSudoku() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = '🔢 Судоку';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '10px';
      controls.style.marginBottom = '15px';
      controls.style.flexWrap = 'wrap';

      const btnNew = document.createElement('button');
      btnNew.className = 'buy-btn';
      btnNew.textContent = 'Новая игра';
      controls.appendChild(btnNew);

      const diffBtn = document.createElement('button');
      diffBtn.className = 'shop-tab';
      diffBtn.textContent = 'Легко';
      controls.appendChild(diffBtn);

      const resultDiv = document.createElement('div');
      resultDiv.style.textAlign = 'center';
      resultDiv.style.marginBottom = '15px';
      resultDiv.style.fontWeight = 'bold';

      body.appendChild(controls);
      body.appendChild(resultDiv);

      const board = document.createElement('div');
      board.style.display = 'grid';
      board.style.gridTemplateColumns = 'repeat(9, 35px)';
      board.style.gap = '1px';
      board.style.background = '#666';
      board.style.padding = '5px';
      board.style.margin = '0 auto';
      board.style.borderRadius = '5px';
      body.appendChild(board);

      let gameState = generateSudoku('easy');
      let difficulty = 'easy';

      function generateSudoku(diff) {
        const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        const solution = solveSudoku(JSON.parse(JSON.stringify(emptyBoard)), true);
        const puzzle = JSON.parse(JSON.stringify(solution));
        
        const cellsToRemove = diff === 'easy' ? 30 : diff === 'medium' ? 45 : 55;
        let removed = 0;
        while (removed < cellsToRemove) {
          const r = Math.floor(Math.random() * 9);
          const c = Math.floor(Math.random() * 9);
          if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            removed++;
          }
        }

        return {
          puzzle: puzzle,
          solution: solution,
          current: puzzle.map(row => [...row]),
          gameOver: false
        };
      }

      function solveSudoku(board, generate = false) {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
              const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
              for (let num of nums) {
                if (isValid(board, r, c, num)) {
                  board[r][c] = num;
                  if (solveSudoku(board, generate)) return board;
                  board[r][c] = 0;
                }
              }
              return null;
            }
          }
        }
        return board;
      }

      function isValid(board, r, c, num) {
        for (let i = 0; i < 9; i++) {
          if (board[r][i] === num || board[i][c] === num) return false;
        }
        const boxR = Math.floor(r / 3) * 3;
        const boxC = Math.floor(c / 3) * 3;
        for (let i = boxR; i < boxR + 3; i++) {
          for (let j = boxC; j < boxC + 3; j++) {
            if (board[i][j] === num) return false;
          }
        }
        return true;
      }

      function renderBoard() {
        board.innerHTML = '';
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.style.width = '35px';
            cell.style.height = '35px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.background = '#fff';
            cell.style.border = (r % 3 === 2 && r !== 8 ? '2px solid #333' : '1px solid #ccc') + ';' + (c % 3 === 2 && c !== 8 ? '2px solid #333' : '1px solid #ccc');
            cell.style.fontSize = '16px';
            cell.style.fontWeight = gameState.puzzle[r][c] !== 0 ? 'bold' : 'normal';
            cell.style.color = gameState.puzzle[r][c] !== 0 ? '#000' : '#0074ff';
            cell.textContent = gameState.current[r][c] || '';

            if (gameState.puzzle[r][c] === 0) {
              cell.style.cursor = 'pointer';
              cell.onclick = () => inputNumber(r, c, cell);
            }

            board.appendChild(cell);
          }
        }
      }

      function inputNumber(r, c, cellEl) {
        const num = prompt('Введите число (1-9) или оставьте пусто для очистки:');
        if (num === null) return;
        if (num === '') {
          gameState.current[r][c] = 0;
        } else {
          const n = parseInt(num);
          if (n >= 1 && n <= 9) {
            gameState.current[r][c] = n;
            if (isValid(gameState.current, r, c, n) && isSudokuComplete()) {
              resultDiv.innerHTML = '<strong style="color: green;">🎉 Вы решили судоку!</strong>';
              gameEngine.award(12, 10);
            }
          }
        }
        renderBoard();
      }

      function isSudokuComplete() {
        return gameState.current.every(row => row.every(cell => cell !== 0)) &&
               gameState.current.every((row, r) => 
                 row.every((val, c) => gameState.solution[r][c] === val)
               );
      }

      btnNew.onclick = () => {
        gameState = generateSudoku(difficulty);
        resultDiv.innerHTML = '';
        renderBoard();
      };

      diffBtn.onclick = () => {
        if (difficulty === 'easy') {
          difficulty = 'medium';
          diffBtn.textContent = 'Средне';
        } else if (difficulty === 'medium') {
          difficulty = 'hard';
          diffBtn.textContent = 'Сложно';
        } else {
          difficulty = 'easy';
          diffBtn.textContent = 'Легко';
        }
        gameState = generateSudoku(difficulty);
        resultDiv.innerHTML = '';
        renderBoard();
      };

      renderBoard();
    },

    // ============ МОРСКОЙ БОЙ ============
    startBattleship() {
      const body = this.qs('#gamesContent');
      body.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'ef-game-title';
      title.textContent = '🚢 Морской бой';
      title.style.marginBottom = '15px';
      body.appendChild(title);

      const gameContainer = document.createElement('div');
      gameContainer.style.display = 'flex';
      gameContainer.style.gap = '20px';
      gameContainer.style.justifyContent = 'center';
      gameContainer.style.flexWrap = 'wrap';
      body.appendChild(gameContainer);

      const playerSection = document.createElement('div');
      playerSection.style.textAlign = 'center';
      const playerTitle = document.createElement('div');
      playerTitle.style.fontWeight = 'bold';
      playerTitle.textContent = 'Ваше поле';
      playerSection.appendChild(playerTitle);
      const playerBoard = document.createElement('div');
      playerBoard.style.display = 'grid';
      playerBoard.style.gridTemplateColumns = 'repeat(10, 30px)';
      playerBoard.style.gap = '1px';
      playerBoard.style.background = '#999';
      playerBoard.style.padding = '5px';
      playerSection.appendChild(playerBoard);
      gameContainer.appendChild(playerSection);

      const aiSection = document.createElement('div');
      aiSection.style.textAlign = 'center';
      const aiTitle = document.createElement('div');
      aiTitle.style.fontWeight = 'bold';
      aiTitle.textContent = 'Поле противника';
      aiSection.appendChild(aiTitle);
      const aiBoard = document.createElement('div');
      aiBoard.style.display = 'grid';
      aiBoard.style.gridTemplateColumns = 'repeat(10, 30px)';
      aiBoard.style.gap = '1px';
      aiBoard.style.background = '#999';
      aiBoard.style.padding = '5px';
      aiSection.appendChild(aiBoard);
      gameContainer.appendChild(aiSection);

      const controlsDiv = document.createElement('div');
      controlsDiv.style.marginTop = '20px';
      controlsDiv.style.textAlign = 'center';

      const statusDiv = document.createElement('div');
      statusDiv.style.marginTop = '10px';
      statusDiv.style.fontWeight = 'bold';
      controlsDiv.appendChild(statusDiv);

      body.appendChild(controlsDiv);

      const gameState = {
        playerShips: generateBattleshipFleet(),
        aiShips: generateBattleshipFleet(),
        playerHits: Array(100).fill(null),
        aiHits: Array(100).fill(null),
        gameOver: false,
        winner: null,
        isPlayerTurn: true,
        aiHuntMode: false,
        aiTargets: [],
        aiLastHit: null
      };

      function generateBattleshipFleet() {
        const fleet = [];
        const board = Array(100).fill(0);
        const ships = [
          { size: 4, count: 1 },
          { size: 3, count: 2 },
          { size: 2, count: 3 },
          { size: 1, count: 4 }
        ];

        for (let shipType of ships) {
          for (let i = 0; i < shipType.count; i++) {
            let placed = false;
            while (!placed) {
              const startIdx = Math.floor(Math.random() * 100);
              const horizontal = Math.random() > 0.5;
              placed = placeShip(board, startIdx, shipType.size, horizontal, fleet);
            }
          }
        }

        function placeShip(board, start, size, horizontal, fleet) {
          const row = Math.floor(start / 10);
          const col = start % 10;

          if (horizontal) {
            if (col + size > 10) return false;
            for (let i = 0; i < size; i++) {
              const idx = row * 10 + col + i;
              if (board[idx] !== 0) return false;
            }
            const ship = [];
            for (let i = 0; i < size; i++) {
              const idx = row * 10 + col + i;
              board[idx] = 1;
              ship.push(idx);
            }
            fleet.push({ cells: ship, hits: 0 });
            markAround(board, start, size, horizontal);
            return true;
          } else {
            if (row + size > 10) return false;
            for (let i = 0; i < size; i++) {
              const idx = (row + i) * 10 + col;
              if (board[idx] !== 0) return false;
            }
            const ship = [];
            for (let i = 0; i < size; i++) {
              const idx = (row + i) * 10 + col;
              board[idx] = 1;
              ship.push(idx);
            }
            fleet.push({ cells: ship, hits: 0 });
            markAround(board, start, size, horizontal);
            return true;
          }
        }

        function markAround(board, start, size, horizontal) {
          const row = Math.floor(start / 10);
          const col = start % 10;
          const positions = horizontal ? 
            [[row-1,col-1], [row-1,col], [row-1,col+size], [row,col-1], [row,col+size], [row+1,col-1], [row+1,col], [row+1,col+size]] :
            [[row-1,col-1], [row-1,col], [row-1,col+1], [row,col-1], [row,col+1], [row+size,col-1], [row+size,col], [row+size,col+1]];
          
          for (let [r, c] of positions) {
            if (r >= 0 && r < 10 && c >= 0 && c < 10) {
              const idx = r * 10 + c;
              if (board[idx] === 0) board[idx] = 2;
            }
          }
        }

        return fleet;
      }

      function getAIMove() {
        if (gameState.aiHuntMode && gameState.aiTargets.length > 0) {
          return gameState.aiTargets.shift();
        }

        let validMoves = [];
        for (let i = 0; i < 100; i++) {
          if (gameState.playerHits[i] === null) {
            validMoves.push(i);
          }
        }

        if (validMoves.length === 0) return null;

        const pattern = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];
        const checkered = [];
        for (let r = 0; r < 10; r++) {
          for (let c of pattern) {
            if (r * 10 + c < 100 && gameState.playerHits[r * 10 + c] === null) {
              checkered.push(r * 10 + c);
            }
          }
        }

        const movePool = checkered.length > 0 ? checkered : validMoves;
        return movePool[Math.floor(Math.random() * movePool.length)];
      }

      function renderBoards() {
        playerBoard.innerHTML = '';
        aiBoard.innerHTML = '';

        for (let i = 0; i < 100; i++) {
          const playerCell = document.createElement('div');
          playerCell.style.width = '30px';
          playerCell.style.height = '30px';
          playerCell.style.background = '#e0e0e0';
          playerCell.style.border = '1px solid #999';
          playerCell.style.display = 'flex';
          playerCell.style.alignItems = 'center';
          playerCell.style.justifyContent = 'center';
          playerCell.style.fontSize = '12px';

          let isShip = false;
          for (let ship of gameState.playerShips) {
            if (ship.cells.includes(i)) {
              playerCell.style.background = '#666';
              isShip = true;
              break;
            }
          }

          if (gameState.playerHits[i] === 'hit') {
            playerCell.style.background = '#ff0000';
            playerCell.textContent = '💥';
          } else if (gameState.playerHits[i] === 'miss') {
            playerCell.textContent = '•';
            playerCell.style.color = '#999';
          }

          playerBoard.appendChild(playerCell);

          const aiCell = document.createElement('div');
          aiCell.style.width = '30px';
          aiCell.style.height = '30px';
          aiCell.style.background = '#4a7ba7';
          aiCell.style.border = '1px solid #999';
          aiCell.style.display = 'flex';
          aiCell.style.alignItems = 'center';
          aiCell.style.justifyContent = 'center';
          aiCell.style.cursor = gameState.gameOver ? 'default' : (gameState.isPlayerTurn ? 'pointer' : 'default');
          aiCell.style.fontSize = '12px';

          if (gameState.aiHits[i] === 'hit') {
            aiCell.style.background = '#ff0000';
            aiCell.textContent = '💥';
          } else if (gameState.aiHits[i] === 'miss') {
            aiCell.textContent = '•';
            aiCell.style.color = '#fff';
          }

          aiCell.onclick = () => !gameState.gameOver && gameState.isPlayerTurn && playerShoot(i);
          aiBoard.appendChild(aiCell);
        }
      }

      function playerShoot(idx) {
        if (gameState.aiHits[idx] !== null) return;

        let hit = false;
        for (let ship of gameState.aiShips) {
          if (ship.cells.includes(idx)) {
            gameState.aiHits[idx] = 'hit';
            ship.hits++;
            hit = true;
            if (ship.hits === ship.cells.length) {
              statusDiv.textContent = '🎯 Корабль противника потоплен!';
            } else {
              statusDiv.textContent = '💥 Попадание!';
            }
            break;
          }
        }

        if (!hit) {
          gameState.aiHits[idx] = 'miss';
          statusDiv.textContent = '💨 Промах!';
        }

        const aiAlive = gameState.aiShips.some(ship => ship.hits < ship.cells.length);
        if (!aiAlive) {
          statusDiv.textContent = '🎉 Вы выиграли!';
          gameState.gameOver = true;
          gameEngine.award(20, 15);
          renderBoards();
          return;
        }

        gameState.isPlayerTurn = false;
        renderBoards();

        setTimeout(() => {
          aiShoot();
        }, 600);
      }

      function aiShoot() {
        const idx = getAIMove();
        if (idx === null) {
          gameState.gameOver = true;
          statusDiv.textContent = '💔 Ваш флот потоплен! Вы проиграли!';
          renderBoards();
          return;
        }

        let hit = false;
        for (let ship of gameState.playerShips) {
          if (ship.cells.includes(idx)) {
            gameState.playerHits[idx] = 'hit';
            ship.hits++;
            hit = true;

            if (ship.hits === ship.cells.length) {
              statusDiv.textContent = '💥 Робот потопил ваш корабль!';
              gameState.aiHuntMode = false;
              gameState.aiTargets = [];
            } else {
              statusDiv.textContent = '💥 Робот попал в ваш корабль!';
              gameState.aiHuntMode = true;
              gameState.aiLastHit = idx;

              const row = Math.floor(idx / 10);
              const col = idx % 10;
              const neighbors = [
                [row - 1, col],
                [row + 1, col],
                [row, col - 1],
                [row, col + 1]
              ];

              for (let [r, c] of neighbors) {
                if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                  const nIdx = r * 10 + c;
                  if (gameState.playerHits[nIdx] === null) {
                    gameState.aiTargets.push(nIdx);
                  }
                }
              }
            }
            break;
          }
        }

        if (!hit) {
          statusDiv.textContent = '💨 Робот не попал!';
          gameState.aiHuntMode = false;
          gameState.aiTargets = [];
        }

        const playerAlive = gameState.playerShips.some(ship => ship.hits < ship.cells.length);
        if (!playerAlive) {
          statusDiv.textContent = '💔 Вы проиграли! Все ваши корабли потоплены!';
          gameState.gameOver = true;
          renderBoards();
          return;
        }

        gameState.isPlayerTurn = true;
        renderBoards();
      }

      renderBoards();
    }
  };

  window.gameEngine = gameEngine;
})();
