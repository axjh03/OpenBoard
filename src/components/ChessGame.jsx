import React, { useState, useEffect, useCallback } from 'react';
import ChessBoard from './ChessBoard';
import GameLogger from './GameLogger';
import PromotionModal from './PromotionModal';
import DifficultyModal from './DifficultyModal';
import Timer from './Timer';
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
  const [promotionModal, setPromotionModal] = useState({
    isOpen: false,
    pieceId: null,
    position: null
  });
  const [difficultyModal, setDifficultyModal] = useState({
    isOpen: true,
    selectedDifficulty: null
  });
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [timer, setTimer] = useState(120);
  const [timerActive, setTimerActive] = useState(false);

  // Initialize game
  useEffect(() => {
    if (difficultyModal.selectedDifficulty) {
      initializeGame();
    }
  }, [difficultyModal.selectedDifficulty]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const initializeGame = async () => {
    try {
      await chessService.initializeGame(true, 'white', aiDifficulty);
      const boardState = await chessService.getBoardState();
      setBoard(chessService.convertBoardFormat(boardState.board));
      
      // Enhanced logging with difficulty info
      addLog("Welcome to the chess battlefield! Where pawns have dreams and kings have nightmares.", "system");
      addLog(`AI Difficulty: ${getDifficultyName(aiDifficulty)} (Depth ${aiDifficulty}) - because easy would be too embarrassing for both of us.`, "system");
      addLog("Game rules: Standard chess rules apply (and yes, that includes the rule about not crying when you lose).", "system");
      addLog("You're playing as White - the color of hope, dreams, and inevitable disappointment.", "system");
      addLog("CPU is playing as Black - the color of darkness, despair, and calculated moves.", "system");
      addLog("Timer: 2 minutes per move - because chess should be fast, like your ex leaving you.", "system");
      addLog("Tip: Click on pieces to see valid moves (and pray they're good ones).", "system");
      setIsPlayerTurn(true);
      setTimerActive(true); // Start timer for first move
    } catch (error) {
      addLog("Failed to initialize game - even the jokes failed!", "system");
      console.error(error);
    }
  };

  const getDifficultyName = (difficulty) => {
    const names = { 2: "Easy", 3: "Medium", 4: "Hard", 5: "Expert" };
    return names[difficulty] || "Medium";
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
    // Count pieces in old board
    const oldPieceCounts = { white: {}, black: {} };
    const newPieceCounts = { white: {}, black: {} };
    
    // Count pieces in old board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = oldBoard[row]?.[col];
        if (piece && piece.type) {
          const color = piece.color;
          oldPieceCounts[color][piece.type] = (oldPieceCounts[color][piece.type] || 0) + 1;
        }
      }
    }
    
    // Count pieces in new board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = newBoard[row]?.[col];
        if (piece && piece.type) {
          const color = piece.color;
          newPieceCounts[color][piece.type] = (newPieceCounts[color][piece.type] || 0) + 1;
        }
      }
    }
    
    // Find captured pieces by comparing counts
    const newCapturedPieces = { white: [...capturedPieces.white], black: [...capturedPieces.black] };
    
    for (const color of ['white', 'black']) {
      for (const pieceType of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) {
        const oldCount = oldPieceCounts[color][pieceType] || 0;
        const newCount = newPieceCounts[color][pieceType] || 0;
        
        if (oldCount > newCount) {
          // Check if this is a promotion (pawn disappeared but new piece appeared)
          if (pieceType === 'pawn') {
            const totalOldPieces = Object.values(oldPieceCounts[color]).reduce((a, b) => a + b, 0);
            const totalNewPieces = Object.values(newPieceCounts[color]).reduce((a, b) => a + b, 0);
            
            // If total piece count stayed the same, it's likely a promotion, not a capture
            if (totalOldPieces === totalNewPieces) {
              continue; // Skip this as it's a promotion, not a capture
            }
          }
          
          // Pieces were captured
          const capturedCount = oldCount - newCount;
          for (let i = 0; i < capturedCount; i++) {
            if (color === 'white') {
              newCapturedPieces.white.push(pieceType);
            } else {
              newCapturedPieces.black.push(pieceType);
            }
          }
          
          // Log the capture
          const capturer = color === 'white' ? 'CPU' : 'Player';
          const captured = color === 'white' ? 'your' : 'CPU\'s';
          addLog(`${capturer} captured ${captured} ${pieceType}! - Another piece bites the dust!`, "system");
        }
      }
    }
    
    setCapturedPieces(newCapturedPieces);
  };

  const checkForPromotion = (newBoard) => {
    // Check if any white pawn reached the top rank (row 0)
    for (let col = 0; col < 8; col++) {
      const piece = newBoard[0][col];
      if (piece && piece.type === 'pawn' && piece.color === 'white') {
        setPromotionModal({
          isOpen: true,
          pieceId: `${piece.type}_0_${col}`,
          position: { row: 0, col }
        });
        return true;
      }
    }
    return false;
  };

  const handlePromotion = async (promotionType) => {
    try {
      const result = await chessService.promotePawn(promotionModal.pieceId, promotionType);
      if (result.success) {
        const boardState = await chessService.getBoardState();
        const newBoard = chessService.convertBoardFormat(boardState.board);
        setBoard(newBoard);
        
        addLog(`Pawn promoted to ${promotionType}!`, "player");
        
        // Continue with AI move after promotion
        setIsPlayerTurn(false);
        setTimeout(() => {
          makeAIMove();
        }, 1000);
      }
    } catch (error) {
      addLog("Promotion failed - even pawns can't catch a break!", "system");
      console.error(error);
    } finally {
      setPromotionModal({ isOpen: false, pieceId: null, position: null });
    }
  };

  const closePromotionModal = () => {
    setPromotionModal({ isOpen: false, pieceId: null, position: null });
  };

  const handleDifficultySelection = (difficulty) => {
    setAiDifficulty(difficulty.depth);
    setDifficultyModal({
      isOpen: false,
      selectedDifficulty: difficulty
    });
  };

  const closeDifficultyModal = () => {
    setDifficultyModal({
      isOpen: false,
      selectedDifficulty: { depth: 3, name: "Medium" }
    });
  };

  const handleTimeOut = () => {
    setTimerActive(false);
    setGameOver(true);
    
    // Count captured pieces
    const playerCaptures = capturedPieces.black.length;
    const cpuCaptures = capturedPieces.white.length;
    
    if (playerCaptures > cpuCaptures) {
      setWinner('white');
      addLog("Time's up! Player wins by captured pieces!", "system");
    } else if (cpuCaptures > playerCaptures) {
      setWinner('black');
      addLog("Time's up! CPU wins by captured pieces!", "system");
    } else {
      setWinner(null);
      addLog("Time's up! Draw - equal captured pieces!", "system");
    }
  };

  const restartGame = () => {
    // Reset all game state
    setBoard([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setLogs([]);
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
    setCapturedPieces({ white: [], black: [] });
    setPromotionModal({ isOpen: false, pieceId: null, position: null });
    setTimer(120);
    setTimerActive(false);
    
    // Reset difficulty selection to show modal again
    setDifficultyModal({ 
      isOpen: true, 
      selectedDifficulty: null 
    });
    setAiDifficulty(3); // Reset to default difficulty
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
          const squareNotation = chessService.convertToChessNotation(rowIndex, colIndex);
          const moveCount = moves.moves ? moves.moves.length : 0;
          addLog(`Selected ${piece.type} at ${squareNotation} (${moveCount} valid moves) - now let's see if you can actually use it properly.`, "player");
          
          if (moveCount === 0) {
            addLog("This piece has no legal moves - just like your dating life.", "system");
          } else if (moveCount === 1) {
            addLog("Only one move available - when life gives you lemons, make lemonade (or resign).", "system");
          }
        } catch (error) {
          console.error('Error getting valid moves:', error);
          addLog(" Error calculating moves - even the computer is confused!", "system");
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
            
            // Check for pawn promotion
            const needsPromotion = checkForPromotion(newBoard);
            if (!needsPromotion) {
              setIsPlayerTurn(false);
              setTimerActive(false); // Stop timer during AI turn
              
              // Enhanced move logging
              const fromSquare = chessService.convertToChessNotation(selectedSquare.row, selectedSquare.col);
              const pieceType = board[selectedSquare.row][selectedSquare.col].type;
              addLog(`${pieceType} moved from ${fromSquare} to ${targetSquare}`, "player");
              
              // Check for special moves
              if (pieceType === 'pawn' && Math.abs(selectedSquare.row - rowIndex) === 2) {
                addLog("Pawn made a double move! - This pawn has ambitions!", "system");
              }
              
              // AI move after a short delay
              setTimeout(() => {
                makeAIMove();
              }, 1000);
                          } else {
                addLog(`Pawn reached promotion rank! - From peasant to royalty!`, "player");
              }
          }
        } catch (error) {
          addLog("Invalid move - even your mistakes are invalid!", "system");
          console.error(error);
        }
      } else {
        // Try to select a different piece
        if (piece && piece.color === 'white') {
          setSelectedSquare(square);
          try {
            const moves = await chessService.getValidMoves(`${piece.type}_${rowIndex}_${colIndex}`);
            setValidMoves(moves.moves || []);
            addLog(`The ${piece.type} enters the stage at ${chessService.convertToChessNotation(rowIndex, colIndex)} - let's hope it's not a tragedy.`, "player");
          } catch (error) {
            console.error('Error getting valid moves:', error);
          }
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
          addLog(`Deselected piece - commitment issues much?`, "player");
        }
      }
    }
  }, [selectedSquare, validMoves, isPlayerTurn, gameOver, board]);

  const makeAIMove = async () => {
    addLog("AI is analyzing the position... - Calculating your demise.", "cpu");
    
    try {
      const startTime = Date.now();
      
      // Add timeout to prevent AI from getting stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI move timeout')), 10000); // 10 second timeout
      });
      
      const aiResult = await Promise.race([
        chessService.getAIMove(),
        timeoutPromise
      ]);
      
      const thinkTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (aiResult.success) {
        const fromSquare = aiResult.move.from;
        const toSquare = aiResult.move.to;
        addLog(`AI moved: ${fromSquare} to ${toSquare} (thought for ${thinkTime}s) - The machine has spoken!`, "cpu");
        
        const oldBoard = [...board];
        const boardState = await chessService.getBoardState();
        const newBoard = chessService.convertBoardFormat(boardState.board);
        setBoard(newBoard);
        updateCapturedPieces(oldBoard, newBoard);
        
        // Enhanced AI move analysis
        const moveAnalysis = analyzeMove(oldBoard, newBoard, fromSquare, toSquare);
        if (moveAnalysis) {
          addLog(moveAnalysis, "cpu");
        }
        
        addLog(`Turn switched to Player - your move, human!`, "system");
        setIsPlayerTurn(true);
        setTimer(120); // Reset timer
        setTimerActive(true); // Start timer for player
      }
    } catch (error) {
      if (error.message === 'AI move timeout') {
        addLog("AI move timed out - making random move - Even AI gets lazy sometimes!", "system");
        // Make a simple random move as fallback
        await makeRandomAIMove();
      } else {
        addLog("AI move failed - even robots have bad days!", "system");
        console.error(error);
      }
    }
  };

  const analyzeMove = (oldBoard, newBoard, fromSquare, toSquare) => {
    // Find what piece moved
    const fromCoords = chessService.convertFromChessNotation(fromSquare);
    const toCoords = chessService.convertFromChessNotation(toSquare);
    
    if (!fromCoords || !toCoords) return null;
    
    const oldPiece = oldBoard[fromCoords.row]?.[fromCoords.col];
    const newPiece = newBoard[toCoords.row]?.[toCoords.col];
    
    if (!oldPiece || !newPiece) return null;
    
    // Check for captures
    if (oldBoard[toCoords.row]?.[toCoords.col] && oldBoard[toCoords.row][toCoords.col].color === 'white') {
      return `AI captured your ${oldBoard[toCoords.row][toCoords.col].type}! - The machine shows no mercy!`;
    }
    
    // Check for pawn moves
    if (oldPiece.type === 'pawn') {
      if (Math.abs(fromCoords.row - toCoords.row) === 2) {
        return "AI pawn made a double move! - Even pawns are faster than you!";
      }
      if (toCoords.row === 0) {
        return "AI pawn was promoted! - From silicon peasant to silicon royalty!";
      }
    }
    
    // Check for center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    if (centerSquares.includes(toSquare)) {
      return "AI is controlling the center! - The machine knows chess theory!";
    }
    
    return null;
  };

  const makeRandomAIMove = async () => {
    try {
      // Simple fallback: find any black piece and move it randomly
      const blackPieces = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === 'black') {
            blackPieces.push({ piece, row, col });
          }
        }
      }
      
      if (blackPieces.length > 0) {
        const randomPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        const targetRow = Math.floor(Math.random() * 8);
        const targetCol = Math.floor(Math.random() * 8);
        
        // Simple move - just move to a random square
        const oldBoard = [...board];
        const newBoard = [...board];
        newBoard[targetRow][targetCol] = randomPiece.piece;
        newBoard[randomPiece.row][randomPiece.col] = null;
        
        setBoard(newBoard);
        updateCapturedPieces(oldBoard, newBoard);
        addLog("AI made a random move - even robots panic sometimes!", "cpu");
        addLog("Turn switched to Player", "system");
        setIsPlayerTurn(true);
        setTimer(120);
        setTimerActive(true);
      }
    } catch (error) {
      addLog("Random AI move also failed - the AI is having a meltdown!", "system");
      console.error(error);
    }
  };

  return (
    <div className="chess-game-layout">
      {/* Timer */}
      <Timer time={timer} isActive={timerActive && isPlayerTurn} />
      
      {/* Restart Button */}
      <button className="restart-button" onClick={restartGame}>
        Restart Game
      </button>

      {/* Chess Board Section */}
      <div className="chess-board-section">
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

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={promotionModal.isOpen}
        onClose={closePromotionModal}
        onPromote={handlePromotion}
        playerColor="white"
      />

      {/* Difficulty Selection Modal */}
      <DifficultyModal
        isOpen={difficultyModal.isOpen}
        onClose={closeDifficultyModal}
        onSelectDifficulty={handleDifficultySelection}
      />
    </div>
  );
};

export default ChessGame;
