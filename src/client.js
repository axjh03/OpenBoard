// Simple client functions that call your NestJS backend
// Backend runs on localhost:3001

const API_BASE = 'http://localhost:3001/auth';

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
