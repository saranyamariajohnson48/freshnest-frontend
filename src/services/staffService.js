import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class StaffService {
  // Make authenticated API request
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Create new staff member
  async createStaff(staffData) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        body: JSON.stringify(staffData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff member');
      }

      return data;
    } catch (error) {
      console.error('Create staff error:', error);
      throw error;
    }
  }

  // Get all staff members with pagination and filters
  async getAllStaff(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff?${queryParams}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff members');
      }

      return data;
    } catch (error) {
      console.error('Get staff error:', error);
      throw error;
    }
  }

  // Get staff member by ID
  async getStaffById(staffId) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/${staffId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff member');
      }

      return data;
    } catch (error) {
      console.error('Get staff by ID error:', error);
      throw error;
    }
  }

  // Update staff member
  async updateStaff(staffId, updateData) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff member');
      }

      return data;
    } catch (error) {
      console.error('Update staff error:', error);
      throw error;
    }
  }

  // Delete/Deactivate staff member
  async deleteStaff(staffId, permanent = false) {
    try {
      const url = `${API_BASE_URL}/api/staff/${staffId}${permanent ? '?permanent=true' : ''}`;
      const response = await this.apiRequest(url, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member');
      }

      return data;
    } catch (error) {
      console.error('Delete staff error:', error);
      throw error;
    }
  }

  // Reset staff password
  async resetStaffPassword(staffId, newPassword = null) {
    try {
      const body = newPassword ? { password: newPassword } : {};
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/${staffId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Get staff statistics
  async getStaffStats() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff statistics');
      }

      return data;
    } catch (error) {
      console.error('Get staff stats error:', error);
      throw error;
    }
  }

  // Generate QR code for staff member (bonus feature)
  async generateStaffQR(staffId) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/${staffId}/qr`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      return data;
    } catch (error) {
      console.error('Generate QR error:', error);
      throw error;
    }
  }

  // Export staff data (bonus feature)
  async exportStaffData(format = 'csv', filters = {}) {
    try {
      const queryParams = new URLSearchParams({ format, ...filters });
      const response = await this.apiRequest(`${API_BASE_URL}/api/staff/export?${queryParams}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export staff data');
      }

      // Return blob for file download
      return await response.blob();
    } catch (error) {
      console.error('Export staff data error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const staffService = new StaffService();
export default staffService;