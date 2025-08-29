import React from 'react';

const ChessPiece = ({ type, color }) => {
  // Chess piece icons - using actual chess piece images
  const pieceIcons = {
    white: {
      king: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wK.svg",
      queen: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wQ.svg",
      rook: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wR.svg",
      bishop: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wB.svg",
      knight: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wN.svg",
      pawn: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wP.svg",
    },
    black: {
      king: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bK.svg",
      queen: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bQ.svg",
      rook: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bR.svg",
      bishop: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bB.svg",
      knight: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bN.svg",
      pawn: "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bP.svg",
    },
  };

  // Fallback to Unicode symbols if images fail to load
  const fallbackSymbols = {
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
      <img 
        src={pieceIcons[color][type]} 
        alt={`${color} ${type}`}
        className="piece-symbol"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <span className="piece-symbol-fallback" style={{ display: 'none' }}>
        {fallbackSymbols[color][type]}
      </span>
    </div>
  );
};

export default ChessPiece;
