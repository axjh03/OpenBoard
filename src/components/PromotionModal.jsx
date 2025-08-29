import React from 'react';
import ChessPiece from './ChessPiece';

const PromotionModal = ({ isOpen, onClose, onPromote, playerColor }) => {
  if (!isOpen) return null;

  // Valid promotion options (queen, rook, bishop, knight) - cannot promote to pawn or king
  const promotionOptions = ['queen', 'rook', 'bishop', 'knight'];

  return (
    <div className="promotion-modal-overlay">
      <div className="promotion-modal">
        <div className="promotion-modal-header">
          <h3>Choose Promotion Piece</h3>
          <button className="promotion-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="promotion-modal-content">
          <p>Choose what to promote your pawn to (queen, rook, bishop, or knight):</p>
          <div className="promotion-pieces-grid">
            {promotionOptions.map((pieceType) => (
              <button
                key={pieceType}
                className="promotion-piece-button"
                onClick={() => onPromote(pieceType)}
              >
                <ChessPiece type={pieceType} color={playerColor} />
                <span className="promotion-piece-label">{pieceType}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
