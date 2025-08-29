import React from 'react';

const DifficultyModal = ({ isOpen, onClose, onSelectDifficulty }) => {
  if (!isOpen) return null;

  const difficulties = [
    { id: 1, name: "Easy", description: "Depth 2 - Good for beginners", depth: 2 },
    { id: 2, name: "Medium", description: "Depth 3 - Balanced challenge", depth: 3 },
    { id: 3, name: "Hard", description: "Depth 4 - For experienced players", depth: 4 },
    { id: 4, name: "Expert", description: "Depth 5 - Maximum challenge", depth: 5 }
  ];

  return (
    <div className="difficulty-modal-overlay">
      <div className="difficulty-modal">
        <div className="difficulty-modal-header">
          <h2>🤖 Choose AI Difficulty</h2>
          <p>Select the challenge level for your chess opponent</p>
        </div>
        
        <div className="difficulty-options">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.id}
              className="difficulty-option"
              onClick={() => onSelectDifficulty(difficulty)}
            >
              <div className="difficulty-info">
                <h3>{difficulty.name}</h3>
                <p>{difficulty.description}</p>
              </div>
              <div className="difficulty-level">
                <span className="level-badge">Level {difficulty.id}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="difficulty-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DifficultyModal;
