import React, { useState } from 'react';
import AuthPage from './components/AuthPage';
import ChessGame from './components/ChessGame';
import BackendLoadingModal from './components/BackendLoadingModal';
import Toast from './components/Toast';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleBackendConnected = () => {
    setIsBackendConnected(true);
    setToastMessage('Backend connected! 🎉');
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  return (
    <div className="App">
      {!isBackendConnected ? (
        <BackendLoadingModal onBackendConnected={handleBackendConnected} />
      ) : (
        <>
          {isAuthenticated ? (
            <div className="chess-game-container">
              <ChessGame onLogout={handleLogout} currentUser={currentUser} />
            </div>
          ) : (
            <AuthPage onLogin={handleLogin} />
          )}
          {showToast && (
            <Toast 
              message={toastMessage} 
              type="success" 
              onClose={handleToastClose}
              duration={3000}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
