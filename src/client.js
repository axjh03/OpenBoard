// Simple client functions that call your NestJS backend
// Auto-detect backend URL

const getBackendUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('localhost');
  
  const backendUrl = isLocalhost 
    ? 'http://localhost:3001'
    : 'https://openboard-l6io.onrender.com';
  
  return `${backendUrl}/auth`;
};

const API_BASE = getBackendUrl();

// Sign up function
export const signUp = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Sign up failed',
        code: data.statusCode === 409 ? 'USER_EXISTS' : undefined
      };
    }
    
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.'
    };
  }
};

// Sign in function
export const signIn = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Sign in failed'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.'
    };
  }
};
