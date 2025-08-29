import React, { useState, useEffect } from 'react';
import './BackendLoadingModal.css';

const BackendLoadingModal = ({ onBackendConnected }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const checkBackend = async () => {
      try {
        // For production, replace with your render.com URL
        const response = await fetch('http://localhost:3001/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          setIsConnected(true);
          onBackendConnected();
          clearInterval(interval);
        }
      } catch (error) {
        // Backend not ready yet, continue checking
      }
    };

    // Check backend every 3 seconds
    const backendCheckInterval = setInterval(checkBackend, 3000);
    
    // Initial check
    checkBackend();

    // Timeout after 120 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      clearInterval(backendCheckInterval);
      console.error('Backend connection timeout after 120 seconds');
    }, 120000);

    return () => {
      clearInterval(interval);
      clearInterval(backendCheckInterval);
      clearTimeout(timeout);
    };
  }, [onBackendConnected]);

  const getHumorousMessage = () => {
    if (timeElapsed < 10) {
      return "Alok is too poor to buy premium hosting, so please wait while the backend spins up...";
    } else if (timeElapsed < 30) {
      return "The lazy developer forgot to optimize the startup time...";
    } else if (timeElapsed < 50) {
      return "It's running on render.com (free tier), so it's taking its sweet time...";
    } else if (timeElapsed < 70) {
      return "Should be ready in 50-70 seconds they said... 🤦‍♂️";
    } else {
      return "Okay, this is getting ridiculous. Maybe try refreshing?";
    }
  };

  return (
    <div className="backend-loading-modal">
      <div className="loading-content">
        <div className="spinner"></div>
        <h2>Connecting to Backend...</h2>
        <p className="humorous-message">{getHumorousMessage()}</p>
        <p className="time-elapsed">Time elapsed: {timeElapsed}s</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default BackendLoadingModal;
