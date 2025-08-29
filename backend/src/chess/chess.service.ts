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
        
        // Check for pawn promotion
        if (piece.type === 'pawn') {
          const promotionRow = piece.color === 'white' ? 0 : 7;
          if (toRow === promotionRow) {
            // Auto-promote to queen (most common choice)
            this.board[toRow][toCol] = { 
              type: 'queen', 
              color: piece.color, 
              id: `Q1_${piece.color === 'white' ? 'W' : 'B'}` 
            };
          }
        }
        
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
    } else if (piece.type === 'knight') {
      // Knight moves: L-shaped pattern
      const knightMoves = [
        { row: -2, col: -1 }, { row: -2, col: 1 },
        { row: -1, col: -2 }, { row: -1, col: 2 },
        { row: 1, col: -2 }, { row: 1, col: 2 },
        { row: 2, col: -1 }, { row: 2, col: 1 }
      ];
      
      for (const move of knightMoves) {
        const newRow = row + move.row;
        const newCol = col + move.col;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    } else if (piece.type === 'bishop') {
      // Bishop moves: diagonal
      const directions = [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ];
      
      for (const dir of directions) {
        let newRow = row + dir.row;
        let newCol = col + dir.col;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dir.row;
          newCol += dir.col;
        }
      }
    } else if (piece.type === 'rook') {
      // Rook moves: horizontal and vertical
      const directions = [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
      ];
      
      for (const dir of directions) {
        let newRow = row + dir.row;
        let newCol = col + dir.col;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dir.row;
          newCol += dir.col;
        }
      }
    } else if (piece.type === 'queen') {
      // Queen moves: combination of rook and bishop
      const directions = [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ];
      
      for (const dir of directions) {
        let newRow = row + dir.row;
        let newCol = col + dir.col;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dir.row;
          newCol += dir.col;
        }
      }
    } else if (piece.type === 'king') {
      // King moves: one square in any direction
      const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
      ];
      
      for (const dir of directions) {
        const newRow = row + dir.row;
        const newCol = col + dir.col;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
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
            
            // Check for pawn promotion
            if (newRow === 7) {
              this.board[newRow][col] = { 
                type: 'queen', 
                color: piece.color, 
                id: `Q1_B` 
              };
            }
            
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

  async promotePawn(pieceId: string, promotionType: string) {
    try {
      const [row, col] = this.findPieceById(pieceId);
      
      if (row === -1 || col === -1) {
        return { success: false, message: 'Piece not found' };
      }

      const piece = this.board[row][col];
      if (!piece || piece.type !== 'pawn') {
        return { success: false, message: 'Piece is not a pawn' };
      }

      // Check if pawn is on promotion rank
      const promotionRow = piece.color === 'white' ? 0 : 7;
      if (row !== promotionRow) {
        return { success: false, message: 'Pawn is not on promotion rank' };
      }

      // Promote the pawn
      this.board[row][col] = { 
        type: promotionType as any, 
        color: piece.color, 
        id: `${promotionType.charAt(0)}1_${piece.color === 'white' ? 'W' : 'B'}` 
      };

      return {
        success: true,
        message: 'Pawn promoted successfully',
        gameState: this.getGameState()
      };
    } catch (error) {
      return { success: false, message: 'Promotion failed: ' + error.message };
    }
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
    // Handle frontend format: "pawn_6_0", "rook_7_0", etc.
    const parts = pieceId.split('_');
    if (parts.length >= 3) {
      const type = parts[0];
      const row = parseInt(parts[1]);
      const col = parseInt(parts[2]);
      
      // Validate coordinates
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const piece = this.board[row][col];
        if (piece && piece.type === type) {
          return [row, col];
        }
      }
    }
    
    // Fallback to old format (id property)
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
