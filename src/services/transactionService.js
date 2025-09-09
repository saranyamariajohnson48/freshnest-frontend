import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

class TransactionService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Get all transactions with pagination and filters
  async getAllTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
      if (params.customerEmail) queryParams.append('customerEmail', params.customerEmail);

      const query = queryParams.toString();
      const response = await this.apiRequest(`${API_BASE_URL}/api/payments/transactions?${query}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch transactions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get all transactions error:', error);
      throw error;
    }
  }

  // Get transaction by ID
  async getTransactionById(id) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/payments/transactions/${id}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch transaction');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get transaction by ID error:', error);
      throw error;
    }
  }

  // Get my transaction by ID (user-scoped)
  async getMyTransactionById(id) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/payments/my/transactions/${id}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch my transaction');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get my transaction by ID error:', error);
      throw error;
    }
  }

  // Get transaction statistics
  async getTransactionStats() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/payments/transactions/stats`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch transaction stats');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get transaction stats error:', error);
      throw error;
    }
  }

  // Get current user's transactions
  async getMyTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);

      const query = queryParams.toString();
      const response = await this.apiRequest(`${API_BASE_URL}/api/payments/my/transactions?${query}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch my transactions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get my transactions error:', error);
      throw error;
    }
  }

  // Export transactions to CSV
  async exportTransactions(format = 'csv', filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`${API_BASE_URL}/api/payments/transactions/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Export transactions error:', error);
      throw error;
    }
  }
}

const transactionService = new TransactionService();
export default transactionService;
