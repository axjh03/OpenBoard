import React from 'react';

const ChessPiece = ({ type, color }) => {
  // Chess piece icons from Flaticon
  const pieceIcons = {
    white: {
      king: "♔",
      queen: "♕", 
      rook: "♖",
      bishop: "♗",
      knight: "♘",
      pawn: "♙",
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜", 
      bishop: "♝",
      knight: "♞",
      pawn: "♟",
    },
  };

  // Alternative: Use larger, more visible Unicode symbols
  const pieceSymbols = {
    white: {
      king: "♔",
      queen: "♕",
      rook: "♖", 
      bishop: "♗",
      knight: "♘",
      pawn: "♙",
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜",
      bishop: "♝", 
      knight: "♞",
      pawn: "♟",
    },
  };

  return (
    <div className="chess-piece">
      <span className="piece-symbol">
        {pieceSymbols[color][type]}
      </span>
    </div>
  );
};

export default ChessPiece;
