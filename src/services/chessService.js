// Chess Service - Handles communication with the backend chess engine

class ChessService {
  constructor() {
    this.backendUrl = 'http://localhost:3001';
    this.game = null;
  }

  // Initialize a new game
  async initializeGame(vsAI = true, playerSide = 'white', aiDifficulty = 3) {
    try {
      const response = await fetch(`${this.backendUrl}/chess/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vsAI,
          playerSide,
          aiDifficulty
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize game');
      }

      const gameData = await response.json();
      this.game = gameData;
      return gameData;
    } catch (error) {
      console.error('Error initializing game:', error);
      throw error;
    }
  }

  // Get current board state
  async getBoardState() {
    try {
      const response = await fetch(`${this.backendUrl}/chess/board`);
      if (!response.ok) {
        throw new Error('Failed to get board state');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting board state:', error);
      throw error;
    }
  }

  // Make a move
  async makeMove(pieceId, targetSquare) {
    try {
      const response = await fetch(`${this.backendUrl}/chess/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pieceId,
          targetSquare
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to make move');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  }

  // Get valid moves for a piece
  async getValidMoves(pieceId) {
    try {
      const response = await fetch(`${this.backendUrl}/chess/moves/${pieceId}`);
      if (!response.ok) {
        throw new Error('Failed to get valid moves');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting valid moves:', error);
      throw error;
    }
  }

  // Get AI move
  async getAIMove() {
    try {
      const response = await fetch(`${this.backendUrl}/chess/ai-move`);
      if (!response.ok) {
        throw new Error('Failed to get AI move');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI move:', error);
      throw error;
    }
  }

  // Get game status
  async getGameStatus() {
    try {
      const response = await fetch(`${this.backendUrl}/chess/status`);
      if (!response.ok) {
        throw new Error('Failed to get game status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting game status:', error);
      throw error;
    }
  }

  // Convert board coordinates to chess notation
  convertToChessNotation(row, col) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return `${files[col]}${ranks[row]}`;
  }

  // Convert chess notation to board coordinates
  convertFromChessNotation(square) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    const file = square[0];
    const rank = square[1];
    const col = files.indexOf(file);
    const row = ranks.indexOf(rank);
    return { row, col };
  }

  // Get piece at specific coordinates
  getPieceAt(board, row, col) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) {
      return null;
    }
    return board[row][col];
  }

  // Convert backend piece format to frontend format
  convertPieceFormat(backendPiece) {
    if (!backendPiece) return null;
    
    const pieceMap = {
      'P': 'pawn',
      'N': 'knight', 
      'B': 'bishop',
      'R': 'rook',
      'Q': 'queen',
      'K': 'king'
    };

    return {
      type: pieceMap[backendPiece.ptype] || backendPiece.ptype,
      color: backendPiece.side === '_W' ? 'white' : 'black'
    };
  }

  // Convert backend board to frontend format
  convertBoardFormat(backendBoard) {
    const frontendBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = backendBoard[row][col];
        if (piece) {
          // Backend returns ChessPiece objects with type, color, and id properties
          frontendBoard[row][col] = {
            type: piece.type,
            color: piece.color
          };
        } else {
          frontendBoard[row][col] = { type: null, color: null };
        }
      }
    }
    
    return frontendBoard;
  }

  // Helper method to extract piece info from backend piece ID (for move validation)
  getPieceFromId(pieceId) {
    if (!pieceId) return null;
    
    // pieceId format: "pawn_6_0", "rook_7_0", etc.
    const parts = pieceId.split('_');
    if (parts.length >= 3) {
      const type = parts[0];
      const row = parseInt(parts[1]);
      const col = parseInt(parts[2]);
      
      return {
        type: type,
        row: row,
        col: col
      };
    }
    
    return null;
  }
}

export default new ChessService();
