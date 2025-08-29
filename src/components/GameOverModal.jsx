import React from 'react';
import './GameOverModal.css';

const GameOverModal = ({ isOpen, gameOverData, onNewGame, onClose }) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    if (!gameOverData) return null;

    const { reason, winner } = gameOverData;

    switch (reason) {
      case 'checkmate':
        return {
          title: 'Checkmate!',
          message: `${winner === 'white' ? 'White' : 'Black'} wins!`,
          icon: '👑',
          color: winner === 'white' ? '#f0f0f0' : '#333',
          bgColor: winner === 'white' ? '#333' : '#f0f0f0'
        };
      case 'stalemate':
        return {
          title: 'Stalemate!',
          message: 'The game is a draw - no legal moves available.',
          icon: '🤝',
          color: '#666',
          bgColor: '#f8f8f8'
        };
      case 'insufficient material':
        return {
          title: 'Draw!',
          message: 'Insufficient material to checkmate.',
          icon: '⚖️',
          color: '#666',
          bgColor: '#f8f8f8'
        };
      default:
        return {
          title: 'Game Over',
          message: 'The game has ended.',
          icon: '🏁',
          color: '#666',
          bgColor: '#f8f8f8'
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal" style={{ backgroundColor: content.bgColor, color: content.color }}>
        <div className="game-over-icon">{content.icon}</div>
        <h2 className="game-over-title">{content.title}</h2>
        <p className="game-over-message">{content.message}</p>
        <div className="game-over-buttons">
          <button className="game-over-btn new-game-btn" onClick={onNewGame}>
            New Game
          </button>
          <button className="game-over-btn close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
