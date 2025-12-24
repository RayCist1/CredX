// API Client for CredX Backend
// This file handles all API calls to the backend
console.log('API.js loaded');
const API_BASE_URL = 'http://localhost:3000/api';

// Get stored token
function getAuthToken() {
  return localStorage.getItem('credxAuthToken');
}

// Set auth token
function setAuthToken(token) {
  localStorage.setItem('credxAuthToken', token);
}

// Remove auth token
function removeAuthToken() {
  localStorage.removeItem('credxAuthToken');
}

// Make API request
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication API
const AuthAPI = {
  async register(username, email, password) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async login(username, password) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async verify() {
    return await apiRequest('/auth/verify');
  },

  logout() {
    removeAuthToken();
  }
};

// Card API
const CardAPI = {
  async getCard() {
    return await apiRequest('/cards');
  },

  async saveCard(cardData) {
    return await apiRequest('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  },

  async deleteCard() {
    return await apiRequest('/cards', {
      method: 'DELETE'
    });
  }
};

// Wallet API
const WalletAPI = {
  async getBalance() {
    const response = await apiRequest('/wallet/balance');
    return response.balance;
  },

  async updateBalance(balance) {
    const response = await apiRequest('/wallet/balance', {
      method: 'PUT',
      body: JSON.stringify({ balance })
    });
    return response.balance;
  },

  async getTransactions(type = null) {
    const query = type ? `?type=${type}` : '';
    const response = await apiRequest(`/wallet/transactions${query}`);
    return response.transactions;
  },

  async addTransaction(transaction) {
    const response = await apiRequest('/wallet/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
    return response.transaction;
  },

  async getStats() {
    const response = await apiRequest('/wallet/stats');
    return response.stats;
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.CredXAPI = {
    Auth: AuthAPI,
    Card: CardAPI,
    Wallet: WalletAPI,
    getAuthToken,
    setAuthToken,
    removeAuthToken
  };
}

