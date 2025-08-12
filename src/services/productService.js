import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ProductService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Create one product
  async createProduct(product) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      body: JSON.stringify(product)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create product');
    return data;
  }

  // List products
  async list(params = {}) {
    const query = new URLSearchParams(params);
    const response = await this.apiRequest(`${API_BASE_URL}/api/products?${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch products');
    return data;
  }

  // Import CSV
  async importCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.apiRequest(`${API_BASE_URL}/api/products/import-csv`, {
      method: 'POST',
      body: formData,
      headers: {} // authService will not set Content-Type for FormData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'CSV import failed');
    return data;
  }
  // Update a product
  async updateProduct(id, updates) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update product');
    return data;
  }

  // Delete a product (soft by default)
  async deleteProduct(id, permanent = false) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/products/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  }
}

const productService = new ProductService();
export default productService;