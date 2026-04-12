// Merchant API Service
// Handles all merchant portal API calls with proper token management

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class MerchantAPI {
  constructor() {
    this.baseUrl = `${API_URL}/api/merchant`;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('merchantToken');
  }

  // Get authorization header
  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ============ AUTHENTICATION ENDPOINTS ============

  /**
   * Login merchant with email and password
   * @param {string} email - Merchant email
   * @param {string} password - Merchant password
   * @returns {Promise} - Auth token and merchant info
   */
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return await response.json();
  }

  /**
   * Logout merchant
   */
  logout() {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('merchantUser');
  }

  /**
   * Check if merchant is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  // ============ DASHBOARD ENDPOINTS ============

  /**
   * Get merchant dashboard data
   * Returns: summary (spend, balance, orders), monthly trends
   * IMPORTANT: Costs are masked - merchant never sees USD buy rates or fulfillment fees
   */
  async getDashboard() {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }

    return await response.json();
  }

  /**
   * Get merchant's orders
   * @param {number} limit - Number of orders to fetch (default: 50)
   */
  async getOrders(limit = 50) {
    const response = await fetch(`${this.baseUrl}/orders?limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return await response.json();
  }

  /**
   * Get merchant wallet transaction history
   * Shows top-ups and spends calculated at merchant's rate (330 DZD)
   */
  async getWalletHistory() {
    const response = await fetch(`${this.baseUrl}/wallet-history`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wallet history');
    }

    return await response.json();
  }

  /**
   * Get merchant invoices
   * Shows final amounts owed (line items hidden)
   */
  async getInvoices() {
    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }

    return await response.json();
  }

  // ============ PROFILE ENDPOINTS ============

  /**
   * Get merchant profile information
   */
  async getProfile() {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  }

  /**
   * Update merchant profile
   * Only allows updating name (email is fixed)
   */
  async updateProfile(data) {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return await response.json();
  }

  /**
   * Change merchant password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${this.baseUrl}/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }

    return await response.json();
  }
}

export default new MerchantAPI();
