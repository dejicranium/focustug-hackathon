function solution(input) {
    let xWins = 0;
    let oWins = 0;
    let invalidBoards = 0;
  
    for (const game of boards) {
        const grid = game.slice(0, 3);
  

      const gameRows = game.slice(3).trim().split(' ').map(row=> row !== '' && row.trim())
      const gridSize = parseInt(gameRows[0]);

       
      // Check if the board size is valid
      if (gridSize < 2 || gridSize > 10) {
        invalidBoards++;
        continue;
      }
  
      // Check if the number of rows matches the grid size
      if (gameRows.length !== gridSize) {
        invalidBoards++;
        continue;
      }
  
      let xCount = 0;
      let oCount = 0;
  
      // Check if the board is valid and count X's and O's
      for (const row of gameRows) {
        for (const cell of row) {
          if (cell === 'x') {
            xCount++;
          } else if (cell === 'o') {
            oCount++;
          } else if (cell !== '-') {
            invalidBoards++;
            break;
          }
        }
      }
  
      // Check if the number of X's and O's is valid
      if (Math.abs(xCount - oCount) > 1 || (xCount === oCount && xCount + oCount !== gridSize * gridSize)) {
        invalidBoards++;
        continue;
      }
  
      // Determine the winner
      let xWinsRow = false;
      let oWinsRow = false;
      let xWinsCol = false;
      let oWinsCol = false;
      let xWinsDiag = false;
      let oWinsDiag = false;
  
      // Check rows
      for (const row of gameRows) {
        if (row === 'x'.repeat(gridSize)) {
          xWinsRow = true;
        } else if (row === 'o'.repeat(gridSize)) {
          oWinsRow = true;
        }
      }
  
      // Check columns
      for (let col = 0; col < gridSize; col++) {
        let xColCount = 0;
        let oColCount = 0;
        for (const row of gameRows) {
          if (row[col] === 'x') {
            xColCount++;
          } else if (row[col] === 'o') {
            oColCount++;
          }
        }
        if (xColCount === gridSize) {
          xWinsCol = true;
        } else if (oColCount === gridSize) {
          oWinsCol = true;
        }
      }
  
      // Check diagonals
      let xDiagCount1 = 0;
      let oDiagCount1 = 0;
      let xDiagCount2 = 0;
      let oDiagCount2 = 0;
  
      for (let i = 0; i < gridSize; i++) {
        if (gameRows[i][i] === 'x') {
          xDiagCount1++;
        } else if (gameRows[i][i] === 'o') {
          oDiagCount1++;
        }
  
        if (gameRows[i][gridSize - i - 1] === 'x') {
          xDiagCount2++;
        } else if (gameRows[i][gridSize - i - 1] === 'o') {
          oDiagCount2++;
        }
      }
  
      if (xDiagCount1 === gridSize) {
        xWinsDiag = true;
      } else if (oDiagCount1 === gridSize) {
        oWinsDiag = true;
      }
  
      if (xDiagCount2 === gridSize) {
        xWinsDiag = true;
      } else if (oDiagCount2 === gridSize) {
        oWinsDiag = true;
      }
  
      // Determine the winner based on the row, column, and diagonal checks
      if ((xWinsRow || xWinsCol || xWinsDiag) && !(oWinsRow || oWinsCol || oWinsDiag)) {
        xWins++;
      } else if (!(xWinsRow || xWinsCol || xWinsDiag) && (oWinsRow || oWinsCol || oWinsDiag)) {
        oWins++;
      }
    }
  
    // Return the results
    return [xWins, oWins, invalidBoards];
  }