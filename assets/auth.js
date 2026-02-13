/**
 * CoExAI Authentication Client
 * Handles login, signup, tokens, and API calls
 */

const AUTH_CONFIG = {
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://api.coexai.ai/api',
  TOKEN_KEY: 'coexai_token',
  USER_KEY: 'coexai_user'
};

// Auth state
let currentUser = null;
let authToken = null;

/**
 * Initialize auth from localStorage
 */
function initAuth() {
  authToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const userJson = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  
  if (userJson) {
    try {
      currentUser = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user:', e);
      logout();
    }
  }
  
  return { user: currentUser, token: authToken };
}

/**
 * Register new user
 */
async function register(email, password, fullName) {
  try {
    const response = await fetch(`${AUTH_CONFIG.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, fullName })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Save auth data
    setAuth(data.token, data.user);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Login user
 */
async function login(email, password) {
  try {
    const response = await fetch(`${AUTH_CONFIG.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save auth data
    setAuth(data.token, data.user);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  currentUser = null;
  authToken = null;
  
  // Redirect to home
  window.location.href = '/';
}

/**
 * Set authentication data
 */
function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
}

/**
 * Get current user
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!authToken;
}

/**
 * Get auth token
 */
function getToken() {
  return authToken;
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${AUTH_CONFIG.API_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // Add auth token if available
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch user profile
 */
async function fetchProfile() {
  return apiRequest('/auth/me');
}

/**
 * Update user profile
 */
async function updateProfile(updates) {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * Join waitlist
 */
async function joinWaitlist(email, source = 'website') {
  try {
    const response = await fetch(`${AUTH_CONFIG.API_URL}/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, source })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to join waitlist');
    }
    
    return { success: true, alreadyRegistered: data.alreadyRegistered };
  } catch (error) {
    console.error('Waitlist error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Protect route - redirect if not authenticated
 */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/demo';
    return false;
  }
  return true;
}

/**
 * Redirect if already authenticated
 */
function redirectIfAuth(redirectTo = '/dashboard') {
  if (isAuthenticated()) {
    window.location.href = redirectTo;
    return true;
  }
  return false;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initAuth,
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    getToken,
    apiRequest,
    fetchProfile,
    updateProfile,
    joinWaitlist,
    requireAuth,
    redirectIfAuth,
    AUTH_CONFIG
  };
}
