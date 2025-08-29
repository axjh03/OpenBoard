import React from 'react';

const Timer = ({ time, isActive }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (time <= 30) return 'red';
    if (time <= 60) return 'orange';
    return 'green';
  };

  return (
    <div className="timer-container">
      <div className="timer-label">Time Remaining:</div>
      <div 
        className={`timer-display ${isActive ? 'active' : 'inactive'}`}
        style={{ color: getTimerColor() }}
      >
        {formatTime(time)}
      </div>
    </div>
  );
};

export default Timer;
