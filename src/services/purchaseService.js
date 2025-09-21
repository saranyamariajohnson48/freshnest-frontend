import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class PurchaseService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Get current user's purchases
  async getMyPurchases(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);

      const query = queryParams.toString();
      const url = `${API_BASE_URL}/api/purchases/my?${query}`;
      const response = await this.apiRequest(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch my purchases');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get my purchases error:', error);
      throw error;
    }
  }
}

const purchaseService = new PurchaseService();
export default purchaseService;


