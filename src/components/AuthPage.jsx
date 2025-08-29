import React, { useState } from 'react';
import Toast from './Toast';
import './AuthPage.css';

const AuthPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Add toast function
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Remove toast function
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Simulate successful login (showing "hello" for now)
  const simulateLogin = () => {
    addToast(`Hello ${username}!`, 'success');
    // Here you would typically redirect to the main app
    console.log(`User ${username} logged in successfully`);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Username and password are required', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Auto-detect backend URL
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
      
      const backendUrl = isLocalhost 
        ? 'http://localhost:3001'
        : 'https://openboard-l6io.onrender.com';
      
      // Call NestJS backend
      const response = await fetch(`${backendUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        addToast('Signed in successfully!', 'success');
        setTimeout(() => {
          if (onLogin) {
            onLogin(data.user);
          } else {
            simulateLogin();
          }
        }, 1000);
      } else {
        addToast(data.message || 'Sign in failed', 'error');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Username and password are required', 'error');
      return;
    }
    
    // Check length restrictions
    if (username.length >= 256) {
      addToast('Username must be less than 256 characters', 'error');
      return;
    }
    
    if (password.length >= 256) {
      addToast('Password must be less than 256 characters', 'error');
      return;
    }
    
    setIsLoading(true);
    
        try {
      // Auto-detect backend URL
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
      
      const backendUrl = isLocalhost 
        ? 'http://localhost:3001'
        : 'https://openboard-l6io.onrender.com';
      
      // Call NestJS backend
      const response = await fetch(`${backendUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        addToast('User created successfully!', 'success');
        
        // Auto-login after 2 seconds
        setTimeout(() => {
          addToast(`Hello ${username}!`, 'success');
          console.log(`User ${username} created and logged in`);
        }, 2000);
        
      } else {
        if (data.code === 'USER_EXISTS') {
          addToast('User exists', 'error');
        } else {
          addToast(data.message || 'Sign up failed', 'error');
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-overlay"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          {/* Header with tabs only */}
          <div className="auth-header">
            <div className="auth-tabs">
              <button
                onClick={() => setActiveTab("signup")}
                className={`auth-tab ${activeTab === "signup" ? "auth-tab-active" : ""}`}
              >
                Sign up
              </button>
              <button
                onClick={() => setActiveTab("signin")}
                className={`auth-tab ${activeTab === "signin" ? "auth-tab-active" : ""}`}
              >
                Sign in
              </button>
            </div>
          </div>

          <h1 className="auth-title">
            {activeTab === "signup" ? "Create an account" : "Welcome back"}
          </h1>

          <div className="auth-form-container">
            <div
              className={`auth-form ${activeTab === "signup" ? "active" : ""}`}
            >
              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="auth-form-content">
                {/* Username field */}
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input auth-input-with-icon"
                    placeholder="Enter your username"
                    maxLength={255}
                  />
                </div>

                {/* Password field */}
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input-password"
                    placeholder="Enter your password"
                    maxLength={255}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>

                {/* Create account button */}
                <button
                  type="submit"
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create an account"}
                </button>
              </form>
            </div>

            <div
              className={`auth-form ${activeTab === "signin" ? "active" : ""}`}
            >
              <form onSubmit={handleSignIn} className="auth-form-content">
                {/* Username field */}
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input auth-input-with-icon"
                    placeholder="Enter your username"
                    maxLength={255}
                  />
                </div>

                {/* Password field */}
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input-password"
                    placeholder="Enter your password"
                    maxLength={255}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>

                {/* Remember me */}
                <div className="remember-me">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default AuthPage;
