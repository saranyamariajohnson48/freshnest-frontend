import authService from './authService';
import { API_BASE_URL } from '../api';

class OrderService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Create new order (Supplier)
  async create(order) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify(order)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create order');
    return data;
  }

  // List orders (supplier sees own, admin sees all)
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await this.apiRequest(`${API_BASE_URL}/api/orders${query ? `?${query}` : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
    return data;
  }

  // Update status (Supplier/Admin)
  async updateStatus(id, status) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  }

  // Review order (Admin): approve/reject
  async review(id, action) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to review order');
    return data;
  }

  // Confirm delivery (Admin)
  async confirmDelivery(id) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/orders/${id}/confirm`, {
      method: 'POST'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to confirm delivery');
    return data;
  }
}

const orderService = new OrderService();
export default orderService;