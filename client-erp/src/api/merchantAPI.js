/**
 * Merchant API - Handles merchant authentication and operations
 * Each method uses the centralized API configuration from ../api.js
 */

import { buildApiUrl } from '../api';

class MerchantAPI {
  /**
   * Login merchant with email and password
   */
  static async login(email, password) {
    try {
      const url = buildApiUrl('/api/merchant/login');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('merchantToken', data.token);
      localStorage.setItem('merchantUser', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('❌ Merchant login error:', error);
      throw error;
    }
  }

  /**
   * Check if merchant is authenticated
   */
  static isAuthenticated() {
    const token = localStorage.getItem('merchantToken');
    const user = localStorage.getItem('merchantUser');
    return !!(token && user);
  }

  /**
   * Get authentication token
   */
  static getToken() {
    return localStorage.getItem('merchantToken');
  }

  /**
   * Get current merchant user
   */
  static getUser() {
    const user = localStorage.getItem('merchantUser');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Get merchant dashboard data
   */
  static async getDashboard() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token');

      const url = buildApiUrl('/api/merchant/dashboard');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      throw error;
    }
  }

  /**
   * Get merchant orders
   */
  static async getOrders() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token');

      const url = buildApiUrl('/api/merchant/orders');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Orders fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Orders fetch error:', error);
      throw error;
    }
  }

  /**
   * Get wallet history
   */
  static async getWalletHistory() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token');

      const url = buildApiUrl('/api/merchant/wallet');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Wallet fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Wallet fetch error:', error);
      throw error;
    }
  }

  /**
   * Get invoices
   */
  static async getInvoices() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token');

      const url = buildApiUrl('/api/merchant/invoices');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Invoices fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Invoices fetch error:', error);
      throw error;
    }
  }

  /**
   * Logout merchant
   */
  static logout() {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('merchantUser');
    window.location.href = '/merchant/login';
  }

  /**
   * Update merchant profile
   */
  static async updateProfile(profileData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token');

      const url = buildApiUrl('/api/merchant/profile');
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`Profile update failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  }
}

export default MerchantAPI;
