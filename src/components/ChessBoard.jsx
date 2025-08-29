import React, { useState, useEffect, useCallback } from 'react';
import ChessPiece from './ChessPiece';

// Initial chess board setup
const initialBoard = [
  // Black pieces (CPU)
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],
  // Black pawns
  Array(8).fill({ type: "pawn", color: "black" }),
  // Empty rows
  Array(8).fill({ type: null, color: null }),
  Array(8).fill({ type: null, color: null }),
  Array(8).fill({ type: null, color: null }),
  Array(8).fill({ type: null, color: null }),
  // White pawns
  Array(8).fill({ type: "pawn", color: "white" }),
  // White pieces (User)
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
];

const ChessBoard = ({ onMove, gameState, selectedSquare, onSquareClick, validMoves = [] }) => {
  const [board, setBoard] = useState(initialBoard);

  // Update board when game state changes
  useEffect(() => {
    if (gameState && gameState.board) {
      setBoard(gameState.board);
    }
  }, [gameState]);

  const handleSquareClick = useCallback((rowIndex, colIndex) => {
    onSquareClick(rowIndex, colIndex);
  }, [onSquareClick]);

  const isSquareSelected = (rowIndex, colIndex) => {
    return selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex;
  };

  const isValidMove = (rowIndex, colIndex) => {
    return validMoves.some(move => move.row === rowIndex && move.col === colIndex);
  };

  const getSquareClass = (rowIndex, colIndex, baseClass) => {
    let finalClass = baseClass;

    if (isSquareSelected(rowIndex, colIndex)) {
      finalClass += " selected";
    } else if (isValidMove(rowIndex, colIndex)) {
      finalClass += " valid-move";
    }

    return finalClass;
  };

  return (
    <div className="chess-board">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0;
          const squareClass = `chess-square ${isLight ? 'light' : 'dark'}`;
          
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getSquareClass(rowIndex, colIndex, squareClass)}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {piece.type && <ChessPiece type={piece.type} color={piece.color} />}
              
              {/* Show valid move indicator */}
              {isValidMove(rowIndex, colIndex) && !piece.type && (
                <div className="valid-move-indicator"></div>
              )}
              
              {/* Show capture indicator */}
              {isValidMove(rowIndex, colIndex) && piece.type && (
                <div className="valid-capture-indicator"></div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;
