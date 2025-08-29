import { Injectable } from '@nestjs/common';

export interface ChessPiece {
  type: string;
  color: string;
  id: string;
}

// AI Configuration
const PIECE_VALUES = {
  'pawn': 100,
  'knight': 320,
  'bishop': 330,
  'rook': 500,
  'queen': 900,
  'king': 20000
};

// Positional bonus tables
const PAWN_TABLE = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [ 50, 50, 50, 50, 50, 50, 50, 50],
  [ 10, 10, 20, 30, 30, 20, 10, 10],
  [  5,  5, 10, 25, 25, 10,  5,  5],
  [  0,  0,  0, 20, 20,  0,  0,  0],
  [  5, -5,-10,  0,  0,-10, -5,  5],
  [  5, 10, 10,-20,-20, 10, 10,  5],
  [  0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const KING_MIDDLEGAME_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

interface AIMove {
  pieceId: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  score: number;
  capturedPiece?: ChessPiece | null;
}

@Injectable()
export class ChessService {
  private board: (ChessPiece | null)[][] = [];
  private currentTurn: 'white' | 'black' = 'white';
  private gameOver: boolean = false;
  private winner: string | null = null;
  private aiDifficulty: number = 3;
  private captureHistory: ChessPiece[] = [];

  async initializeGame(vsAI: boolean, playerSide: string, aiDifficulty: number) {
    this.initializeBoard();
    this.currentTurn = 'white';
    this.gameOver = false;
    this.winner = null;
    this.aiDifficulty = aiDifficulty;
    this.captureHistory = [];
    
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
      winner: this.winner,
      capturedPieces: this.captureHistory
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

      // Validate the move
      if (!this.isValidMove(fromRow, fromCol, toRow, toCol, piece)) {
        return { success: false, message: 'Invalid move - against chess rules' };
      }

      // Check if move would leave king in check
      if (!this.wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol, piece.color)) {
        console.log(`CHECK VALIDATION: Move from ${fromRow},${fromCol} to ${toRow},${toCol} would leave king in check`);
        return { success: false, message: 'Invalid move - would leave king in check' };
      }

      // FIXED: Check for capture and handle it properly
      const capturedPiece = this.board[toRow][toCol];
      let moveMessage = 'Move executed successfully';
      
      if (capturedPiece) {
        // This is a capture - add to capture history
        this.captureHistory.push(capturedPiece);
        moveMessage = `Captured ${capturedPiece.color} ${capturedPiece.type}`;
        console.log(`CAPTURE: ${piece.color} ${piece.type} captures ${capturedPiece.color} ${capturedPiece.type} at ${targetSquare}`);
      }

      // Execute the move (this will overwrite the captured piece)
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;
      
      // Switch turns
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      
      // Check for game end conditions
      this.checkGameEnd();
      
      return {
        success: true,
        message: moveMessage,
        capture: capturedPiece ? {
          piece: capturedPiece,
          square: targetSquare
        } : null,
        gameState: this.getGameState()
      };
    } catch (error) {
      return { success: false, message: 'Move failed: ' + error.message };
    }
  }

  private checkGameEnd() {
    const currentSide = this.currentTurn;
    const enemySide = currentSide === 'white' ? 'black' : 'white';
    
    // Check if current player has any legal moves
    const hasLegalMoves = this.hasLegalMoves(currentSide);
    
    if (!hasLegalMoves) {
      if (this.isInCheckReal(currentSide)) {
        // Checkmate
        this.gameOver = true;
        this.winner = enemySide;
        console.log(`CHECKMATE: ${enemySide} wins!`);
      } else {
        // Stalemate
        this.gameOver = true;
        this.winner = 'draw';
        console.log('STALEMATE: Game is a draw!');
      }
    }
  }

  private hasLegalMoves(side: 'white' | 'black'): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === side) {
          const moves = this.getValidMovesForPiece(piece, row, col);
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isInCheckReal(side: 'white' | 'black'): boolean {
    // Find king
    let kingRow = -1, kingCol = -1;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === side) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    
    if (kingRow === -1) return false;
    
    // Check if any enemy piece can attack the king
    const enemySide = side === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(kingRow, kingCol, enemySide);
  }

  private isSquareAttacked(row: number, col: number, bySide: 'white' | 'black'): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === bySide) {
          if (this.canPieceAttackSquare(piece, r, c, row, col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private wouldMoveLeaveKingInCheck(fromRow: number, fromCol: number, toRow: number, toCol: number, side: string): boolean {
    // Make a temporary move
    const tempPiece = this.board[fromRow][fromCol];
    const capturedPiece = this.board[toRow][toCol];
    
    // Execute the move temporarily
    this.board[toRow][toCol] = tempPiece;
    this.board[fromRow][fromCol] = null;
    
    // Check if the king is in check after the move
    const inCheck = this.isInCheckReal(side as 'white' | 'black');
    
    // Undo the move
    this.board[fromRow][fromCol] = tempPiece;
    this.board[toRow][toCol] = capturedPiece;
    
    // Return true if the move would NOT leave king in check (i.e., it's a legal move)
    return !inCheck;
  }

  private canPieceAttackSquare(piece: ChessPiece, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    // Special case for pawn attacks (different from pawn moves)
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const attackRow = fromRow + direction;
      
      if (toRow === attackRow && Math.abs(fromCol - toCol) === 1) {
        return true;
      }
      return false;
    }
    
    // For other pieces, use normal move validation but ignore the "must capture" restriction
    return this.isValidMovePattern(fromRow, fromCol, toRow, toCol, piece);
  }

  private isValidMovePattern(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean {
    switch (piece.type) {
      case 'knight':
        return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'rook':
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king':
        return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
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

    const moves = this.getValidMovesForPiece(piece, row, col);
    return { moves };
  }

  private getValidMovesForPiece(piece: ChessPiece, row: number, col: number): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const newRow = row + direction;
      
      if (newRow >= 0 && newRow < 8) {
        // Forward move - must be empty
        if (!this.board[newRow][col]) {
          if (this.wouldMoveLeaveKingInCheck(row, col, newRow, col, piece.color)) {
            moves.push({ row: newRow, col });
          }
          
          // Double move from starting position
          const startRow = piece.color === 'white' ? 6 : 1;
          if (row === startRow && !this.board[newRow + direction][col]) {
            if (this.wouldMoveLeaveKingInCheck(row, col, newRow + direction, col, piece.color)) {
              moves.push({ row: newRow + direction, col });
            }
          }
        }
        
        // Diagonal captures - must have enemy piece
        for (const dCol of [-1, 1]) {
          const newCol = col + dCol;
          if (newCol >= 0 && newCol < 8) {
            const targetPiece = this.board[newRow][newCol];
            if (targetPiece && targetPiece.color !== piece.color) {
              if (this.wouldMoveLeaveKingInCheck(row, col, newRow, newCol, piece.color)) {
                moves.push({ row: newRow, col: newCol });
              }
            }
          }
        }
      }
    } else if (piece.type === 'knight') {
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
            if (this.wouldMoveLeaveKingInCheck(row, col, newRow, newCol, piece.color)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    } else if (piece.type === 'bishop') {
      this.addSlidingMoves(moves, row, col, [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ], piece);
    } else if (piece.type === 'rook') {
      this.addSlidingMoves(moves, row, col, [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
      ], piece);
    } else if (piece.type === 'queen') {
      this.addSlidingMoves(moves, row, col, [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ], piece);
    } else if (piece.type === 'king') {
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
            // For king moves, check if the destination square is not attacked
            if (!this.isSquareAttacked(newRow, newCol, piece.color === 'white' ? 'black' : 'white')) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
    
    return moves;
  }

  private addSlidingMoves(moves: { row: number; col: number }[], startRow: number, startCol: number, directions: { row: number; col: number }[], piece: ChessPiece) {
    for (const dir of directions) {
      let newRow = startRow + dir.row;
      let newCol = startCol + dir.col;
      
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = this.board[newRow][newCol];
        
        if (!targetPiece) {
          // Empty square - can move here
          if (this.wouldMoveLeaveKingInCheck(startRow, startCol, newRow, newCol, piece.color)) {
            moves.push({ row: newRow, col: newCol });
          }
        } else {
          // Occupied square
          if (targetPiece.color !== piece.color) {
            // Enemy piece - can capture
            if (this.wouldMoveLeaveKingInCheck(startRow, startCol, newRow, newCol, piece.color)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
          // Stop sliding in this direction (blocked by piece)
          break;
        }
        
        newRow += dir.row;
        newCol += dir.col;
      }
    }
  }

  // AI METHODS
  async getAIMove() {
    // Frontend sends depth directly (2, 3, 4, 5), so we use it directly
    const searchDepth = this.aiDifficulty || 3;
    
    console.log(`AI: Thinking at difficulty level ${this.aiDifficulty} (depth ${searchDepth})...`);
    const startTime = Date.now();
    
    const bestMove = this.getBestMove('black', searchDepth);
    
    if (!bestMove) {
      return { success: false, message: 'No valid AI move found' };
    }
    
    const thinkTime = Date.now() - startTime;
    console.log(`AI: Found move in ${thinkTime}ms`);
    
    // FIXED: Properly handle capture in AI move execution
    const capturedPiece = this.board[bestMove.toRow][bestMove.toCol];
    let moveMessage = 'AI move executed';
    
    if (capturedPiece) {
      this.captureHistory.push(capturedPiece);
      moveMessage = `AI captured ${capturedPiece.color} ${capturedPiece.type}`;
      console.log(`AI CAPTURE: black ${this.board[bestMove.fromRow][bestMove.fromCol]?.type} captures ${capturedPiece.color} ${capturedPiece.type}`);
    }
    
    // Execute the move
    const piece = this.board[bestMove.fromRow][bestMove.fromCol];
    this.board[bestMove.toRow][bestMove.toCol] = piece;
    this.board[bestMove.fromRow][bestMove.fromCol] = null;
    
    this.currentTurn = 'white';
    
    // Check for game end
    this.checkGameEnd();
    
    const fromSquare = this.toSquareNotation(bestMove.fromRow, bestMove.fromCol);
    const toSquare = this.toSquareNotation(bestMove.toRow, bestMove.toCol);
    
    return {
      success: true,
      message: moveMessage,
      move: { from: fromSquare, to: toSquare },
      capture: capturedPiece ? {
        piece: capturedPiece,
        square: toSquare
      } : null,
      gameState: this.getGameState(),
      aiInfo: {
        difficulty: this.aiDifficulty,
        depth: searchDepth,
        thinkTime: thinkTime,
        score: bestMove.score
      }
    };
  }

  async getAIHint() {
    // Frontend sends depth directly (2, 3, 4, 5), so we use it directly
    const searchDepth = this.aiDifficulty || 3;
    
    const bestMove = this.getBestMove('white', searchDepth);
    
    if (!bestMove) {
      return { success: false, message: 'No hint available' };
    }
    
    const fromSquare = this.toSquareNotation(bestMove.fromRow, bestMove.fromCol);
    const toSquare = this.toSquareNotation(bestMove.toRow, bestMove.toCol);
    
    return {
      success: true,
      hint: {
        from: fromSquare,
        to: toSquare,
        score: bestMove.score,
        pieceType: this.board[bestMove.fromRow][bestMove.fromCol]?.type
      }
    };
  }

  async getGameStatus() {
    return {
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      capturedPieces: this.captureHistory
    };
  }

  async promotePawn(pieceId: string, promotionType: string) {
    const [row, col] = this.findPieceById(pieceId);
    if (row === -1 || col === -1) {
      return { success: false, message: 'Piece not found' };
    }

    const piece = this.board[row][col];
    if (!piece || piece.type !== 'pawn') {
      return { success: false, message: 'Not a pawn' };
    }

    // Validate promotion type
    const validTypes = ['queen', 'rook', 'bishop', 'knight'];
    if (!validTypes.includes(promotionType)) {
      return { success: false, message: 'Invalid promotion type' };
    }

    // Check if pawn is on the last rank
    const lastRank = piece.color === 'white' ? 0 : 7;
    if (row !== lastRank) {
      return { success: false, message: 'Pawn not on promotion rank' };
    }

    // Promote the pawn
    piece.type = promotionType;
    piece.id = `${promotionType.charAt(0)}_promoted_${piece.color}`;

    return {
      success: true,
      message: `Pawn promoted to ${promotionType}`,
      gameState: this.getGameState()
    };
  }

  private getBestMove(side: 'white' | 'black', depth: number): AIMove | null {
    const allMoves = this.getAllLegalMoves(side);
    
    if (allMoves.length === 0) {
      return null;
    }
    
    const orderedMoves = this.orderMoves(allMoves);
    
    let bestMove: AIMove | null = null;
    let bestScore = side === 'white' ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;
    
    console.log(`AI: Searching ${orderedMoves.length} moves at depth ${depth} for ${side}`);
    
    for (const move of orderedMoves) {
      const gameCopy = this.copyGameState();
      const success = this.executeMoveOnCopy(gameCopy, move);
      
      if (!success) continue;
      
      const score = this.minimax(gameCopy, depth - 1, alpha, beta, true);
      
      if (side === 'white') {
        if (score > bestScore) {
          bestScore = score;
          bestMove = { ...move, score };
          alpha = Math.max(alpha, score);
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = { ...move, score };
          beta = Math.min(beta, score);
        }
      }
      
      if (beta <= alpha) {
        console.log(`AI: Pruned ${orderedMoves.length - orderedMoves.indexOf(move) - 1} moves`);
        break;
      }
    }
    
    return bestMove;
  }

  private minimax(gameState: any, depth: number, alpha: number, beta: number, maximizing: boolean): number {
    if (depth === 0) {
      return this.evaluatePosition(gameState.board);
    }
    
    const side = maximizing ? 'white' : 'black';
    const moves = this.getAllLegalMovesForState(gameState, side);
    
    if (moves.length === 0) {
      return maximizing ? -Infinity : Infinity;
    }
    
    if (maximizing) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const newState = this.copyGameState(gameState);
        this.executeMoveOnCopy(newState, move);
        const score = this.minimax(newState, depth - 1, alpha, beta, false);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of moves) {
        const newState = this.copyGameState(gameState);
        this.executeMoveOnCopy(newState, move);
        const score = this.minimax(newState, depth - 1, alpha, beta, true);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  private evaluatePosition(board: (ChessPiece | null)[][]): number {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceValue = PIECE_VALUES[piece.type] || 0;
          const positionalBonus = this.getPositionalBonus(piece, row, col);
          const totalValue = pieceValue + positionalBonus;
          
          if (piece.color === 'white') {
            score += totalValue;
          } else {
            score -= totalValue;
          }
        }
      }
    }
    
    return score;
  }

  private getPositionalBonus(piece: ChessPiece, row: number, col: number): number {
    let table: number[][] = [];
    
    switch (piece.type) {
      case 'pawn':
        table = PAWN_TABLE;
        break;
      case 'knight':
        table = KNIGHT_TABLE;
        break;
      case 'bishop':
        table = BISHOP_TABLE;
        break;
      case 'king':
        table = KING_MIDDLEGAME_TABLE;
        break;
      default:
        return 0;
    }
    
    const actualRow = piece.color === 'white' ? row : 7 - row;
    return table[actualRow][col] || 0;
  }

  private getAllLegalMoves(side: 'white' | 'black'): AIMove[] {
    const moves: AIMove[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === side) {
          const validMoves = this.getValidMovesForPiece(piece, row, col);
          
          for (const move of validMoves) {
            moves.push({
              pieceId: piece.id,
              fromRow: row,
              fromCol: col,
              toRow: move.row,
              toCol: move.col,
              score: 0,
              capturedPiece: this.board[move.row][move.col]
            });
          }
        }
      }
    }
    
    return moves;
  }

  private getAllLegalMovesForState(gameState: any, side: 'white' | 'black'): AIMove[] {
    const moves: AIMove[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.color === side) {
          const validMoves = this.getValidMovesForPieceInState(gameState, piece, row, col);
          
          for (const move of validMoves) {
            moves.push({
              pieceId: piece.id,
              fromRow: row,
              fromCol: col,
              toRow: move.row,
              toCol: move.col,
              score: 0,
              capturedPiece: gameState.board[move.row][move.col]
            });
          }
        }
      }
    }
    
    return moves;
  }

  private getValidMovesForPieceInState(gameState: any, piece: ChessPiece, row: number, col: number): { row: number; col: number }[] {
    // Simplified version for AI evaluation - similar to getValidMovesForPiece but uses gameState.board
    const moves: { row: number; col: number }[] = [];
    
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const newRow = row + direction;
      
      if (newRow >= 0 && newRow < 8) {
        if (!gameState.board[newRow][col]) {
          moves.push({ row: newRow, col });
          
          const startRow = piece.color === 'white' ? 6 : 1;
          if (row === startRow && !gameState.board[newRow + direction][col]) {
            moves.push({ row: newRow + direction, col });
          }
        }
        
        for (const dCol of [-1, 1]) {
          const newCol = col + dCol;
          if (newCol >= 0 && newCol < 8) {
            const targetPiece = gameState.board[newRow][newCol];
            if (targetPiece && targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    } else if (piece.type === 'knight') {
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
          const targetPiece = gameState.board[newRow][newCol];
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    } else if (piece.type === 'bishop') {
      this.addSlidingMovesForState(moves, gameState, row, col, [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ], piece);
    } else if (piece.type === 'rook') {
      this.addSlidingMovesForState(moves, gameState, row, col, [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
      ], piece);
    } else if (piece.type === 'queen') {
      this.addSlidingMovesForState(moves, gameState, row, col, [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ], piece);
    } else if (piece.type === 'king') {
      const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
      ];
      
      for (const dir of directions) {
        const newRow = row + dir.row;
        const newCol = col + dir.col;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const targetPiece = gameState.board[newRow][newCol];
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    }
    
    return moves;
  }

  private addSlidingMovesForState(moves: { row: number; col: number }[], gameState: any, startRow: number, startCol: number, directions: { row: number; col: number }[], piece: ChessPiece) {
    for (const dir of directions) {
      let newRow = startRow + dir.row;
      let newCol = startCol + dir.col;
      
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = gameState.board[newRow][newCol];
        
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
  }

  private orderMoves(moves: AIMove[]): AIMove[] {
    return moves.sort((a, b) => {
      // Prioritize captures
      const aCapture = a.capturedPiece ? PIECE_VALUES[a.capturedPiece.type] || 0 : 0;
      const bCapture = b.capturedPiece ? PIECE_VALUES[b.capturedPiece.type] || 0 : 0;
      
      if (aCapture !== bCapture) {
        return bCapture - aCapture; // Higher captures first
      }
      
      // Then prioritize by piece value
      const aPiece = this.board[a.fromRow][a.fromCol];
      const bPiece = this.board[b.fromRow][b.fromCol];
      const aValue = aPiece ? PIECE_VALUES[aPiece.type] || 0 : 0;
      const bValue = bPiece ? PIECE_VALUES[bPiece.type] || 0 : 0;
      
      return bValue - aValue; // Higher value pieces first
    });
  }

  private copyGameState(gameState?: any): any {
    const state = gameState || {
      board: this.board,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      captureHistory: this.captureHistory
    };
    
    return {
      board: state.board.map(row => row.map(piece => piece ? { ...piece } : null)),
      currentTurn: state.currentTurn,
      gameOver: state.gameOver,
      winner: state.winner,
      captureHistory: [...state.captureHistory]
    };
  }

  private executeMoveOnCopy(gameState: any, move: AIMove): boolean {
    const piece = gameState.board[move.fromRow][move.fromCol];
    if (!piece) return false;
    
    gameState.board[move.toRow][move.toCol] = piece;
    gameState.board[move.fromRow][move.fromCol] = null;
    
    if (move.capturedPiece) {
      gameState.captureHistory.push(move.capturedPiece);
    }
    
    gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
    
    return true;
  }

  private isValidMove(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean {
    // Check bounds
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
      return false;
    }
    
    // Can't move to same square
    if (fromRow === toRow && fromCol === toCol) {
      return false;
    }
    
    // Check if target square contains own piece
    const targetPiece = this.board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) {
      return false;
    }
    
    // Validate move pattern for piece type
    if (!this.isValidMoveForPieceType(fromRow, fromCol, toRow, toCol, piece)) {
      return false;
    }
    
    return true;
  }

  private isValidMoveForPieceType(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean {
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
      case 'knight':
        return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'rook':
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king':
        return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  }

  private isValidPawnMove(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    
    // Forward move
    if (fromCol === toCol && toRow === fromRow + direction) {
      return !this.board[toRow][toCol];
    }
    
    // Double move from start
    if (fromCol === toCol && toRow === fromRow + 2 * direction && fromRow === startRow) {
      return !this.board[fromRow + direction][fromCol] && !this.board[toRow][toCol];
    }
    
    // Diagonal capture
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
      return !!this.board[toRow][toCol];
    }
    
    return false;
  }

  private isValidKnightMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  private isValidBishopMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    
    if (rowDiff !== colDiff) return false;
    
    const rowStep = fromRow < toRow ? 1 : -1;
    const colStep = fromCol < toCol ? 1 : -1;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow && currentCol !== toCol) {
      if (this.board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  private isValidRookMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    if (fromRow === toRow) {
      const startCol = Math.min(fromCol, toCol);
      const endCol = Math.max(fromCol, toCol);
      for (let col = startCol + 1; col < endCol; col++) {
        if (this.board[fromRow][col]) return false;
      }
    } else {
      const startRow = Math.min(fromRow, toRow);
      const endRow = Math.max(fromRow, toRow);
      for (let row = startRow + 1; row < endRow; row++) {
        if (this.board[row][fromCol]) return false;
      }
    }
    
    return true;
  }

  private isValidQueenMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
  }

  private isValidKingMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return rowDiff <= 1 && colDiff <= 1;
  }
  
  private findPieceById(pieceId: string): [number, number] {
    const parts = pieceId.split('_');
    if (parts.length >= 3) {
      const type = parts[0];
      const row = parseInt(parts[1]);
      const col = parseInt(parts[2]);
      
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const piece = this.board[row][col];
        if (piece && piece.type === type) {
          return [row, col];
        }
      }
    }
    
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
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return [rank, file];
  }

  private toSquareNotation(row: number, col: number): string {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  private initializeBoard() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let i = 0; i < 8; i++) {
      this.board[1][i] = { type: 'pawn', color: 'black', id: `P${i+1}_B` };
      this.board[6][i] = { type: 'pawn', color: 'white', id: `P${i+1}_W` };
    }
    
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

  private getGameState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      capturedPieces: this.captureHistory
    };
  }
}
