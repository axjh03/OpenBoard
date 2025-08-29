import { Injectable } from '@nestjs/common';

export interface ChessPiece {
  type: string;
  color: string;
  id: string;
}

@Injectable()
export class ChessService {
  private board: (ChessPiece | null)[][] = [];
  private currentTurn: 'white' | 'black' = 'white';
  private gameOver: boolean = false;
  private winner: string | null = null;

  async initializeGame(vsAI: boolean, playerSide: string, aiDifficulty: number) {
    this.initializeBoard();
    this.currentTurn = 'white';
    this.gameOver = false;
    this.winner = null;
    
    return {
      success: true,
      message: 'Game initialized successfully',
      gameState: this.getGameState()
    };
  }

  async getBoardState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }

  async makeMove(pieceId: string, targetSquare: string) {
    try {
      const [fromRow, fromCol] = this.findPieceById(pieceId);
      const [toRow, toCol] = this.parseSquare(targetSquare);
      
      if (fromRow === -1 || fromCol === -1) {
        return { success: false, message: 'Piece not found' };
      }

      const piece = this.board[fromRow][fromCol];
      if (!piece || piece.color !== this.currentTurn) {
        return { success: false, message: 'Invalid move - not your turn' };
      }

      // Simple move validation
      if (this.isValidMove(fromRow, fromCol, toRow, toCol, piece)) {
        // Execute move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Switch turns
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        return {
          success: true,
          message: 'Move executed successfully',
          gameState: this.getGameState()
        };
      } else {
        return { success: false, message: 'Invalid move' };
      }
    } catch (error) {
      return { success: false, message: 'Move failed: ' + error.message };
    }
  }

  async getValidMoves(pieceId: string) {
    const [row, col] = this.findPieceById(pieceId);
    if (row === -1 || col === -1) {
      return { moves: [] };
    }

    const piece = this.board[row][col];
    if (!piece) {
      return { moves: [] };
    }

    const moves: { row: number; col: number }[] = [];
    // Simple pawn moves for demonstration
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const newRow = row + direction;
      
      if (newRow >= 0 && newRow < 8) {
        // Forward move
        if (!this.board[newRow][col]) {
          moves.push({ row: newRow, col });
          
          // Double move from starting position
          const startRow = piece.color === 'white' ? 6 : 1;
          if (row === startRow && !this.board[newRow + direction][col]) {
            moves.push({ row: newRow + direction, col });
          }
        }
        
        // Captures
        for (const dCol of [-1, 1]) {
          const newCol = col + dCol;
          if (newCol >= 0 && newCol < 8) {
            const targetPiece = this.board[newRow][newCol];
            if (targetPiece && targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
    
    return { moves };
  }

  async getAIMove() {
    // Simple AI - find a pawn and move it forward
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === 'black' && piece.type === 'pawn') {
          const direction = 1; // Black pawns move down
          const newRow = row + direction;
          
          if (newRow < 8 && !this.board[newRow][col]) {
            const fromSquare = this.toSquareNotation(row, col);
            const toSquare = this.toSquareNotation(newRow, col);
            
            // Execute the move
            this.board[newRow][col] = piece;
            this.board[row][col] = null;
            this.currentTurn = 'white';
            
            return {
              success: true,
              message: 'AI move executed',
              move: { from: fromSquare, to: toSquare },
              gameState: this.getGameState()
            };
          }
        }
      }
    }
    
    return { success: false, message: 'No valid AI move found' };
  }

  async getGameStatus() {
    return {
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      isInCheck: false,
      materialValue: { white: 0, black: 0 }
    };
  }

  private initializeBoard() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place pawns
    for (let i = 0; i < 8; i++) {
      this.board[1][i] = { type: 'pawn', color: 'black', id: `P${i+1}_B` };
      this.board[6][i] = { type: 'pawn', color: 'white', id: `P${i+1}_W` };
    }
    
    // Place other pieces
    const pieces = [
      { type: 'rook', positions: [0, 7] },
      { type: 'knight', positions: [1, 6] },
      { type: 'bishop', positions: [2, 5] },
      { type: 'queen', positions: [3] },
      { type: 'king', positions: [4] }
    ];
    
    pieces.forEach(({ type, positions }) => {
      positions.forEach((col, index) => {
        this.board[0][col] = { type, color: 'black', id: `${type.charAt(0)}${index+1}_B` };
        this.board[7][col] = { type, color: 'white', id: `${type.charAt(0)}${index+1}_W` };
      });
    });
  }

  private findPieceById(pieceId: string): [number, number] {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col]?.id === pieceId) {
          return [row, col];
        }
      }
    }
    return [-1, -1];
  }

  private parseSquare(square: string): [number, number] {
    const file = square.charCodeAt(0) - 97; // 'a' = 0
    const rank = 8 - parseInt(square[1]); // '8' = 0, '1' = 7
    return [rank, file];
  }

  private toSquareNotation(row: number, col: number): string {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  private isValidMove(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean {
    // Simple validation - just check if target square is empty or contains enemy piece
    const targetPiece = this.board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) {
      return false; // Can't capture own piece
    }
    
    // For pawns, implement basic rules
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      
      // Forward move
      if (fromCol === toCol && toRow === fromRow + direction) {
        return !this.board[toRow][toCol]; // Must be empty
      }
      
      // Double move from start
      if (fromCol === toCol && toRow === fromRow + 2 * direction && fromRow === startRow) {
        return !this.board[fromRow + direction][fromCol] && !this.board[toRow][toCol];
      }
      
      // Capture
      if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
        return !!this.board[toRow][toCol]; // Must capture enemy piece
      }
    }
    
    return true; // Allow other moves for now
  }

  private getGameState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }
}
