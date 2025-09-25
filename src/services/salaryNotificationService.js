import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class SalaryNotificationService {
  // Make authenticated API request
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  // Get salary notifications for the authenticated user
  async getMyNotifications(params = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = params;
      const queryParams = new URLSearchParams({ page, limit, unreadOnly });
      const response = await this.apiRequest(`${API_BASE_URL}/salary/me/notifications?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error fetching salary notifications:', error);
      throw error;
    }
  }

  // Mark a specific notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/salary/me/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/salary/me/notifications/read-all`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/salary/me/notifications?page=1&limit=1&unreadOnly=true`);
      return response.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

const salaryNotificationService = new SalaryNotificationService();

export default salaryNotificationService;
