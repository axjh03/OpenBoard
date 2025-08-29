import React, { useState, useEffect, useCallback } from 'react';
import ChessBoard from './ChessBoard';
import GameLogger from './GameLogger';
import chessService from '../services/chessService';
import './ChessGame.css';

const ChessGame = ({ onLogout, currentUser }) => {
  const [board, setBoard] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [capturedPieces, setCapturedPieces] = useState({
    white: [], // pieces captured by black (CPU)
    black: []  // pieces captured by white (player)
  });

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      await chessService.initializeGame(true, 'white', 3);
      const boardState = await chessService.getBoardState();
      setBoard(chessService.convertBoardFormat(boardState.board));
      addLog("Chess game initialized", "system");
      addLog("Game rules: Standard chess rules apply", "system");
      addLog("You are playing as White (bottom)", "system");
      addLog("CPU is playing as Black (top)", "system");
      addLog("White to move first", "system");
      setIsPlayerTurn(true);
    } catch (error) {
      addLog("Failed to initialize game", "system");
      console.error(error);
    }
  };

  const addLog = (message, type = "system") => {
    const newLog = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateCapturedPieces = (oldBoard, newBoard) => {
    const newCapturedPieces = { ...capturedPieces };
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const oldPiece = oldBoard[row]?.[col];
        const newPiece = newBoard[row]?.[col];
        
        // If there was a piece and now there isn't, it was captured
        if (oldPiece && oldPiece.type && (!newPiece || !newPiece.type)) {
          const capturedColor = oldPiece.color;
          const capturedType = oldPiece.type;
          
          if (capturedColor === 'white') {
            newCapturedPieces.white.push(capturedType);
          } else {
            newCapturedPieces.black.push(capturedType);
          }
        }
      }
    }
    
    setCapturedPieces(newCapturedPieces);
  };

  const handleSquareClick = useCallback(async (rowIndex, colIndex) => {
    if (gameOver || !isPlayerTurn) return;

    const square = { row: rowIndex, col: colIndex };
    const piece = board[rowIndex]?.[colIndex];
    
    // If no square is selected, try to select this one
    if (!selectedSquare) {
      if (piece && piece.color === 'white') {
        setSelectedSquare(square);
        try {
          const moves = await chessService.getValidMoves(`${piece.type}_${rowIndex}_${colIndex}`);
          setValidMoves(moves.moves || []);
          addLog(`🎯 Selected ${piece.type} at ${chessService.convertToChessNotation(rowIndex, colIndex)}`, "player");
        } catch (error) {
          console.error('Error getting valid moves:', error);
        }
      }
    } else {
      // If a square is already selected, try to move
      const isMoveValid = validMoves.some(move => 
        move.row === rowIndex && move.col === colIndex
      );
      
      if (isMoveValid) {
        try {
          const pieceId = `${board[selectedSquare.row][selectedSquare.col].type}_${selectedSquare.row}_${selectedSquare.col}`;
          const targetSquare = chessService.convertToChessNotation(rowIndex, colIndex);
          
          const result = await chessService.makeMove(pieceId, targetSquare);
          if (result.success) {
            const oldBoard = [...board];
            const boardState = await chessService.getBoardState();
            const newBoard = chessService.convertBoardFormat(boardState.board);
            setBoard(newBoard);
            updateCapturedPieces(oldBoard, newBoard);
            setSelectedSquare(null);
            setValidMoves([]);
            setIsPlayerTurn(false);
            addLog(`Player moved piece to ${targetSquare}`, "player");
            
            // AI move after a short delay
            setTimeout(() => {
              makeAIMove();
            }, 1000);
          }
        } catch (error) {
          addLog("Invalid move", "system");
          console.error(error);
        }
      } else {
        // Try to select a different piece
        if (piece && piece.color === 'white') {
          setSelectedSquare(square);
          try {
            const moves = await chessService.getValidMoves(`${piece.type}_${rowIndex}_${colIndex}`);
            setValidMoves(moves.moves || []);
            addLog(`Selected ${piece.type} at ${chessService.convertToChessNotation(rowIndex, colIndex)}`, "player");
          } catch (error) {
            console.error('Error getting valid moves:', error);
          }
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
          addLog(`Deselected piece`, "player");
        }
      }
    }
  }, [selectedSquare, validMoves, isPlayerTurn, gameOver, board]);

  const makeAIMove = async () => {
    addLog("CPU is thinking...", "cpu");
    
    try {
      const aiResult = await chessService.getAIMove();
      if (aiResult.success) {
        addLog(`CPU moved: ${aiResult.move.from} to ${aiResult.move.to}`, "cpu");
        
        const oldBoard = [...board];
        const boardState = await chessService.getBoardState();
        const newBoard = chessService.convertBoardFormat(boardState.board);
        setBoard(newBoard);
        updateCapturedPieces(oldBoard, newBoard);
        
        addLog(`Turn switched to Player`, "system");
        setIsPlayerTurn(true);
      }
    } catch (error) {
      addLog("CPU move failed", "system");
      console.error(error);
    }
  };

  return (
    <div className="chess-game-layout">
      {/* Chess Board Section */}
      <div className="chess-board-section">
        <div className="player-labels">
          <div className="player-label">CPU (Black)</div>
          <div className="player-label">
            You (White)
            <button 
              onClick={onLogout}
              className="logout-btn-small"
            >
              Logout
            </button>
          </div>
        </div>
        
        <ChessBoard 
          gameState={{ board }}
          selectedSquare={selectedSquare}
          onSquareClick={handleSquareClick}
          validMoves={validMoves}
          capturedPieces={capturedPieces}
        />
      </div>

      {/* Game Logger Section */}
      <div className="game-logger-section">
        <GameLogger logs={logs} />
      </div>
    </div>
  );
};

export default ChessGame;
