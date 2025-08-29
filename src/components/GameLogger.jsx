import React, { useEffect, useRef } from 'react';

const GameLogger = ({ logs = [] }) => {
  const loggerRef = useRef(null);

  useEffect(() => {
    if (loggerRef.current) {
      loggerRef.current.scrollTop = loggerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="game-logger">
      <div className="logger-header">
        <span className="logger-title">GAME LOG</span>
      </div>
      <div className="logger-content" ref={loggerRef}>
        {logs.map((log, index) => (
          <div key={log.id || index} className="log-entry">
            <span className="log-timestamp">{formatTimestamp(log.timestamp) ? `[${formatTimestamp(log.timestamp)}]:` : ''}</span>
            <span className="log-message">{log.message.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLogger;
