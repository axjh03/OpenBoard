import React, { useEffect, useRef } from 'react';

const GameLogger = ({ logs = [] }) => {
  const loggerRef = useRef(null);

  useEffect(() => {
    if (loggerRef.current) {
      loggerRef.current.scrollTop = loggerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="game-logger">
      <div className="logger-content" ref={loggerRef}>
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
