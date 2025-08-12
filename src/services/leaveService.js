import { API_BASE_URL } from '../api';

class LeaveService {
  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('freshnest_access_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Apply for leave (Staff)
  async applyLeave(leaveData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(leaveData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to apply for leave');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get my leave applications (Staff)
  async getMyLeaves(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await fetch(`${API_BASE_URL}/api/leave/my-leaves?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch leave applications');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel leave application (Staff)
  async cancelLeave(leaveId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/${leaveId}/cancel`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to cancel leave application');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all leave applications (Admin)
  async getAllLeaves(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_BASE_URL}/api/leave/all?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch leave applications');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Review leave application (Admin)
  async reviewLeave(leaveId, reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/${leaveId}/review`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to review leave application');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get leave statistics (Admin)
  async getLeaveStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch leave statistics');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  handleError(error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else if (error.message) {
      // Error with message (from our API calls)
      return new Error(error.message);
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }

  // Utility methods for frontend
  getLeaveTypeLabel(type) {
    const labels = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      annual: 'Annual Leave'
    };
    return labels[type] || type;
  }

  getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  formatDateRange(startDate, endDate) {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return start === end ? start : `${start} - ${end}`;
  }

  calculateLeaveDays(startDate, endDate, isHalfDay = false) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isHalfDay ? 0.5 : diffDays;
  }

  // Check if dates overlap with existing leaves
  checkDateOverlap(newStart, newEnd, existingLeaves) {
    const start = new Date(newStart);
    const end = new Date(newEnd);

    return existingLeaves.some(leave => {
      if (leave.status === 'rejected') return false;
      
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      return (start <= leaveEnd && end >= leaveStart);
    });
  }

  // Get leave balance after applying for leave
  calculateRemainingBalance(currentBalance, leaveType, leaveDays) {
    const newBalance = { ...currentBalance };
    newBalance[leaveType] = Math.max(0, newBalance[leaveType] - leaveDays);
    return newBalance;
  }
}

export default new LeaveService();