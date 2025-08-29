import React from 'react';

const GameLogger = ({ logs = [] }) => {
  return (
    <div className="game-logger">
      <div className="logger-content">
        {logs.map((log, index) => (
          <div key={log.id || index} className="log-entry">
            <span className="log-timestamp">[{log.timestamp}]:</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLogger;
