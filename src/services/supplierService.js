import authService from './authService';
import { API_BASE_URL } from '../api';

class SupplierService {
  constructor() {
    this.subscribers = [];
    this.storageKey = 'freshnest_suppliers';
    this.useBackend = true; // Flag to control backend usage
    // Only initialize local data if backend is not available
    // this.initializeLocalData();
  }

  // Initialize local storage with sample data if empty
  initializeLocalData() {
    const existingData = localStorage.getItem(this.storageKey);
    if (!existingData) {
      const sampleSuppliers = [
        {
          id: 1,
          name: "Green Valley Farms",
          email: "contact@greenvalley.com",
          phone: "+1-555-0123",
          status: "active",
          role: "supplier",
          contactPerson: "John Smith",
          address: "123 Farm Road, Green Valley, CA 90210",
          category: "Vegetables",
          paymentTerms: "Net 30",
          notes: "Reliable supplier for organic vegetables",
          totalOrders: 156,
          totalSpent: 45200,
          rating: 4.8,
          lastOrderDate: "2024-01-15T10:00:00Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Fresh Fruit Co.",
          email: "orders@freshfruit.com",
          phone: "+1-555-0124",
          status: "active",
          role: "supplier",
          contactPerson: "Sarah Johnson",
          address: "456 Orchard Lane, Fruit Valley, CA 90211",
          category: "Fruits",
          paymentTerms: "Net 15",
          notes: "Premium fruit supplier",
          totalOrders: 89,
          totalSpent: 32100,
          rating: 4.5,
          lastOrderDate: "2024-01-18T14:30:00Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Dairy Dreams",
          email: "info@dairydreams.com",
          phone: "+1-555-0125",
          status: "active",
          role: "supplier",
          contactPerson: "Mike Wilson",
          address: "789 Milk Road, Dairy Town, CA 90212",
          category: "Dairy",
          paymentTerms: "Net 30",
          notes: "Fresh dairy products daily",
          totalOrders: 203,
          totalSpent: 67800,
          rating: 4.9,
          lastOrderDate: "2024-01-19T09:15:00Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(sampleSuppliers));
    }
  }

  // Get suppliers from local storage
  getLocalSuppliers() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Save suppliers to local storage
  saveLocalSuppliers(suppliers) {
    localStorage.setItem(this.storageKey, JSON.stringify(suppliers));
  }

  // Generate next ID for local storage
  getNextId() {
    const suppliers = this.getLocalSuppliers();
    return suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
  }

  // Make authenticated API request
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Create new supplier (as user with role "supplier")
  async createSupplier(supplierData) {
    if (this.useBackend) {
      try {
        // Transform supplier data to user format with role "supplier"
        const userData = {
          fullName: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
          role: 'supplier',
          status: supplierData.status || 'active',
          address: supplierData.address,
          // Generate a username from email
          username: supplierData.email.split('@')[0] + '_supplier',
          // Password (from form). Fallback to a temporary if not provided.
          password: supplierData.password || 'TempPass123!',
          // Supplier-specific data in a custom field
          supplierDetails: {
            contactPerson: supplierData.contactPerson,
            category: supplierData.category,
            paymentTerms: supplierData.paymentTerms || 'Net 30',
            notes: supplierData.notes || '',
            // Initialize supplier metrics
            totalOrders: 0,
            totalSpent: 0,
            rating: 0,
            lastOrderDate: null
          }
        };

        const response = await this.apiRequest(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create supplier');
        }

        // Notify subscribers
        this.notifySubscribers();

        return data;
      } catch (error) {
        console.error('Backend create supplier error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false; // Disable backend for this session
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      
      // Check for duplicate email
      if (suppliers.some(s => s.email === supplierData.email)) {
        throw new Error('A supplier with this email already exists');
      }

      const newSupplier = {
        id: this.getNextId(),
        name: supplierData.name,
        email: supplierData.email,
        phone: supplierData.phone,
        status: supplierData.status || 'active',
        role: 'supplier',
        contactPerson: supplierData.contactPerson,
        address: supplierData.address,
        category: supplierData.category,
        paymentTerms: supplierData.paymentTerms || 'Net 30',
        notes: supplierData.notes || '',
        totalOrders: 0,
        totalSpent: 0,
        rating: 0,
        lastOrderDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      suppliers.push(newSupplier);
      this.saveLocalSuppliers(suppliers);

      // Notify subscribers
      this.notifySubscribers();

      return { success: true, user: newSupplier };
    } catch (error) {
      console.error('Local create supplier error:', error);
      throw error;
    }
  }

  // Get all suppliers with pagination and filters
  async getAllSuppliers(params = {}) {
    if (this.useBackend) {
      try {
        const queryParams = new URLSearchParams({
          role: 'supplier',
          ...params
        });
        
        const response = await this.apiRequest(`${API_BASE_URL}/api/users?${queryParams}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch suppliers');
        }

        return data;
      } catch (error) {
        console.error('Backend get suppliers error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false; // Disable backend for this session
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      
      // Apply filters if provided
      let filteredSuppliers = [...suppliers];
      
      if (params.status) {
        filteredSuppliers = filteredSuppliers.filter(s => s.status === params.status);
      }
      
      if (params.category) {
        filteredSuppliers = filteredSuppliers.filter(s => s.category === params.category);
      }

      // Simple pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

      return {
        success: true,
        users: paginatedSuppliers,
        pagination: {
          page,
          limit,
          total: filteredSuppliers.length,
          pages: Math.ceil(filteredSuppliers.length / limit)
        }
      };
    } catch (error) {
      console.error('Local get suppliers error:', error);
      throw error;
    }
  }

  // Get supplier by ID
  async getSupplierById(id) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/users/${id}`);
      const data = await response.json();
      if (!response.ok) {
        // If forbidden for non-admins, fall back to own profile
        if (response.status === 403 || response.status === 401) {
          const profileResp = await authService.apiRequest(`${API_BASE_URL}/api/auth/profile`);
          const profileData = await profileResp.json();
          if (!profileResp.ok) throw new Error(profileData.error || 'Failed to fetch profile');
          return { user: profileData.user };
        }
        throw new Error(data.error || 'Failed to fetch supplier');
      }
      return data;
    } catch (error) {
      console.error('Get supplier error:', error);
      // Last resort: try profile endpoint directly
      try {
        const profileResp = await authService.apiRequest(`${API_BASE_URL}/api/auth/profile`);
        const profileData = await profileResp.json();
        if (!profileResp.ok) throw new Error(profileData.error || 'Failed to fetch profile');
        return { user: profileData.user };
      } catch (e) {
        throw error;
      }
    }
  }

  // Update supplier
  async updateSupplier(id, supplierData) {
    if (this.useBackend) {
      try {
        // Transform supplier data to user format
        const userData = {
          fullName: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
          status: supplierData.status,
          address: supplierData.address,
          supplierDetails: {
            contactPerson: supplierData.contactPerson,
            category: supplierData.category,
            paymentTerms: supplierData.paymentTerms,
            notes: supplierData.notes
          }
        };

        const response = await this.apiRequest(`${API_BASE_URL}/api/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update supplier');
        }

        // Notify subscribers
        this.notifySubscribers();

        return data;
      } catch (error) {
        console.error('Backend update supplier error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false;
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      const supplierIndex = suppliers.findIndex(s => String(s.id ?? s._id) === String(id));
      
      if (supplierIndex === -1) {
        throw new Error('Supplier not found');
      }

      // Update supplier data
      suppliers[supplierIndex] = {
        ...suppliers[supplierIndex],
        name: supplierData.name,
        email: supplierData.email,
        phone: supplierData.phone,
        status: supplierData.status,
        contactPerson: supplierData.contactPerson,
        address: supplierData.address,
        category: supplierData.category,
        paymentTerms: supplierData.paymentTerms,
        notes: supplierData.notes,
        updatedAt: new Date().toISOString()
      };

      this.saveLocalSuppliers(suppliers);

      // Notify subscribers
      this.notifySubscribers();

      return { success: true, user: suppliers[supplierIndex] };
    } catch (error) {
      console.error('Local update supplier error:', error);
      throw error;
    }
  }

  // Delete supplier
  async deleteSupplier(id, permanent = false) {
    if (this.useBackend) {
      try {
        const url = `${API_BASE_URL}/api/users/${id}${permanent ? '?permanent=true' : ''}`;
        const response = await this.apiRequest(url, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete supplier');
        }

        // Notify subscribers
        this.notifySubscribers();

        return true;
      } catch (error) {
        console.error('Backend delete supplier error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false;
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      const supplierIndex = suppliers.findIndex(s => String(s.id ?? s._id) === String(id));
      
      if (supplierIndex === -1) {
        throw new Error('Supplier not found');
      }

      // Remove supplier from array
      suppliers.splice(supplierIndex, 1);
      this.saveLocalSuppliers(suppliers);

      // Notify subscribers
      this.notifySubscribers();

      return true;
    } catch (error) {
      console.error('Local delete supplier error:', error);
      throw error;
    }
  }

  // Toggle supplier status (active/inactive)
  async toggleSupplierStatus(id) {
    if (this.useBackend) {
      try {
        const response = await this.apiRequest(`${API_BASE_URL}/api/users/${id}/toggle-status`, {
          method: 'PATCH'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to toggle supplier status');
        }

        // Notify subscribers
        this.notifySubscribers();

        return data;
      } catch (error) {
        console.error('Backend toggle supplier status error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false;
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      const supplierIndex = suppliers.findIndex(s => String(s.id ?? s._id) === String(id));
      
      if (supplierIndex === -1) {
        throw new Error('Supplier not found');
      }

      // Toggle status
      const currentStatus = suppliers[supplierIndex].status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      suppliers[supplierIndex].status = newStatus;
      suppliers[supplierIndex].updatedAt = new Date().toISOString();
      
      this.saveLocalSuppliers(suppliers);

      // Notify subscribers
      this.notifySubscribers();

      return { success: true, status: newStatus, user: suppliers[supplierIndex] };
    } catch (error) {
      console.error('Local toggle supplier status error:', error);
      throw error;
    }
  }

  // Search suppliers
  async searchSuppliers(query, filters = {}) {
    if (this.useBackend) {
      try {
        const params = {
          role: 'supplier',
          search: query,
          ...filters
        };

        const queryParams = new URLSearchParams(params);
        const response = await this.apiRequest(`${API_BASE_URL}/api/users/search?${queryParams}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to search suppliers');
        }

        return data;
      } catch (error) {
        console.error('Backend search suppliers error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false;
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      const queryLower = query.toLowerCase();
      
      let filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(queryLower) ||
        supplier.email.toLowerCase().includes(queryLower) ||
        supplier.contactPerson.toLowerCase().includes(queryLower) ||
        supplier.category.toLowerCase().includes(queryLower)
      );

      // Apply additional filters
      if (filters.category) {
        filteredSuppliers = filteredSuppliers.filter(s => s.category === filters.category);
      }
      
      if (filters.status) {
        filteredSuppliers = filteredSuppliers.filter(s => s.status === filters.status);
      }

      return {
        success: true,
        users: filteredSuppliers
      };
    } catch (error) {
      console.error('Local search suppliers error:', error);
      throw error;
    }
  }

  // List suppliers by category (for inventory linking)
  async listByCategory(category, status = 'active') {
    try {
      const res = await this.getAllSuppliers({ category, status, limit: 200 });
      const users = res.users || [];
      return users.map(u => this.transformUserToSupplier(u));
    } catch (e) {
      console.error('listByCategory failed:', e);
      return [];
    }
  }

  // Get supplier statistics
  async getSupplierStats() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/suppliers/stats`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier statistics');
      }

      return data;
    } catch (error) {
      console.error('Get supplier stats error:', error);
      throw error;
    }
  }

  // Get suppliers by category
  async getSuppliersByCategory(category) {
    try {
      const params = {
        role: 'supplier',
        category: category
      };

      return await this.getAllSuppliers(params);
    } catch (error) {
      console.error('Get suppliers by category error:', error);
      throw error;
    }
  }

  // Get active suppliers
  async getActiveSuppliers() {
    try {
      const params = {
        role: 'supplier',
        status: 'active'
      };

      return await this.getAllSuppliers(params);
    } catch (error) {
      console.error('Get active suppliers error:', error);
      throw error;
    }
  }

  // Update supplier rating
  async updateSupplierRating(id, rating) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/suppliers/${id}/rating`, {
        method: 'PATCH',
        body: JSON.stringify({ rating })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier rating');
      }

      // Notify subscribers
      this.notifySubscribers();

      return data;
    } catch (error) {
      console.error('Update supplier rating error:', error);
      throw error;
    }
  }

  // Record supplier order (for tracking metrics)
  async recordSupplierOrder(id, orderData) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/suppliers/${id}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record supplier order');
      }

      // Notify subscribers
      this.notifySubscribers();

      return data;
    } catch (error) {
      console.error('Record supplier order error:', error);
      throw error;
    }
  }

  // Send onboarding email (styled HTML from backend)
  async sendOnboardingEmail({ supplierId, email, supplierName }) {
    const payload = {};
    if (email) payload.email = email;
    if (supplierName) payload.supplierName = supplierName;
    const response = await this.apiRequest(`${API_BASE_URL}/api/users/${supplierId}/send-onboarding-email`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send onboarding email');
    }
    return data;
  }

  // Export suppliers data
  async exportSuppliers(format = 'json') {
    if (this.useBackend) {
      try {
        const response = await this.apiRequest(`${API_BASE_URL}/api/suppliers/export?format=${format}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to export suppliers');
        }

        // Handle different export formats
        if (format === 'json') {
          const data = await response.json();
          const dataStr = JSON.stringify(data, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          
          const exportFileDefaultName = `suppliers_${new Date().toISOString().split('T')[0]}.json`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
        } else if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const exportFileDefaultName = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', url);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          
          window.URL.revokeObjectURL(url);
        }

        return true;
      } catch (error) {
        console.error('Backend export suppliers error:', error);
        console.log('Falling back to local storage...');
        this.useBackend = false;
        // Fall through to local storage implementation
      }
    }

    // Local storage fallback
    try {
      const suppliers = this.getLocalSuppliers();
      const dataStr = JSON.stringify(suppliers, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `suppliers_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      return true;
    } catch (error) {
      console.error('Local export suppliers error:', error);
      throw error;
    }
  }

  // Subscribe to supplier changes (for real-time updates)
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(data = null) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Utility method to transform backend user data to supplier format
  transformUserToSupplier(userData) {
    return {
      id: userData._id || userData.id,
      name: userData.fullName || userData.name, // Handle both field names
      email: userData.email,
      phone: userData.phone,
      status: userData.status,
      role: userData.role,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      // Supplier-specific fields from supplierDetails or direct fields
      contactPerson: userData.supplierDetails?.contactPerson || '',
      address: userData.address || userData.supplierDetails?.address || '',
      category: userData.supplierDetails?.category || 'Other',
      brands: Array.isArray(userData.supplierDetails?.brands) ? userData.supplierDetails.brands : [],
      paymentTerms: userData.supplierDetails?.paymentTerms || 'Net 30',
      notes: userData.supplierDetails?.notes || '',
      totalOrders: userData.supplierDetails?.totalOrders || 0,
      totalSpent: userData.supplierDetails?.totalSpent || 0,
      rating: userData.supplierDetails?.rating || 0,
      lastOrderDate: userData.supplierDetails?.lastOrderDate || null
    };
  }

  // Utility method to transform supplier data to backend user format
  transformSupplierToUser(supplierData) {
    return {
      fullName: supplierData.name,
      email: supplierData.email,
      phone: supplierData.phone,
      role: 'supplier',
      status: supplierData.status || 'active',
      address: supplierData.address,
      supplierDetails: {
        contactPerson: supplierData.contactPerson,
        category: supplierData.category,
        paymentTerms: supplierData.paymentTerms,
        notes: supplierData.notes,
        totalOrders: supplierData.totalOrders || 0,
        totalSpent: supplierData.totalSpent || 0,
        rating: supplierData.rating || 0,
        lastOrderDate: supplierData.lastOrderDate
      }
    };
  }
}

// Create and export a singleton instance
const supplierService = new SupplierService();
export default supplierService;