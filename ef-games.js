    // ============ ШАШКИ (ПЕРЕПИСАНО) ============
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
      infoDiv.textContent = 'Кликните на шашку, потом на клетку (диагональ или 2 клетки для взятия)';
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
            if ((r + c) % 2 === 1) b[r][c] = '⚪';
          }
        }
        for (let r = 5; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) b[r][c] = '⚫';
          }
        }
        return { 
          board: b, 
          selectedRow: null, 
          selectedCol: null, 
          moves: 0,
          isPlayerTurn: true,
          gameOver: false
        };
      }

      function isPlayerPiece(piece) {
        return piece === '⚪' || (piece && piece.includes('⚪'));
      }

      function isAIPiece(piece) {
        return piece === '⚫' || (piece && piece.includes('⚫'));
      }

      function getValidMoves(row, col) {
        const moves = [];
        const piece = gameState.board[row][col];
        if (!piece) return moves;

        const isDame = piece.length > 1;
        const isPlayer = isPlayerPiece(piece);

        const directions = isDame ? 
          [[1,1],[1,-1],[-1,1],[-1,-1]] : 
          isPlayer ? [[1,1],[1,-1]] : [[-1,1],[-1,-1]];

        // Обычные ходы
        for (let [dr, dc] of directions) {
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !gameState.board[nr][nc]) {
            moves.push([nr, nc, false]);
          }
        }

        // Захваты
        for (let [dr, dc] of directions) {
          const nr = row + dr, nc = col + dc;
          const nr2 = row + 2*dr, nc2 = col + 2*dc;
          
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && 
              nr2 >= 0 && nr2 < 8 && nc2 >= 0 && nc2 < 8 &&
              gameState.board[nr][nc] && 
              (isPlayer ? isAIPiece(gameState.board[nr][nc]) : isPlayerPiece(gameState.board[nr][nc])) &&
              !gameState.board[nr2][nc2]) {
            moves.push([nr2, nc2, true, nr, nc]);
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
              const isDame = piece.length > 1;
              const value = isDame ? 5 : 1;
              score += isPlayer ? value : -value;
            }
          }
        }
        return score;
      }

      function getAIMove() {
        let moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (isAIPiece(gameState.board[r][c])) {
              const pieceMoves = getValidMoves(r, c);
              for (let move of pieceMoves) {
                moves.push([r, c, ...move]);
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

        let bestMove = moves[0];
        let bestScore = -999;
        for (let move of moves) {
          const [r, c, nr, nc, isCapture] = move;
          const captured = gameState.board[nr][nc];
          const capturedPiece = isCapture && move.length > 4 ? gameState.board[move[3]][move[4]] : null;
          
          gameState.board[nr][nc] = gameState.board[r][c];
          gameState.board[r][c] = null;
          if (isCapture && move.length > 4) gameState.board[move[3]][move[4]] = null;
          
          const score = evaluatePosition();
          
          gameState.board[r][c] = gameState.board[nr][nc];
          gameState.board[nr][nc] = captured;
          if (isCapture && move.length > 4) gameState.board[move[3]][move[4]] = capturedPiece;
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        return bestMove;
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

            if (isCapture && moveData.length > 3) {
              gameState.board[moveData[3]][moveData[4]] = null;
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

                if (isCapture && move.length > 4) {
                  gameState.board[move[3]][move[4]] = null;
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
