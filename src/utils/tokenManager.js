import authService from '../services/authService';

class TokenManager {
  constructor() {
    this.refreshInterval = null;
    this.isRefreshing = false;
  }

  // Start automatic token refresh
  startAutoRefresh() {
    // Clear any existing interval
    this.stopAutoRefresh();
    
    // Check token every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Also check immediately
    this.checkAndRefreshToken();
  }

  // Stop automatic token refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Check if token needs refresh and refresh if needed
  async checkAndRefreshToken() {
    if (this.isRefreshing) return;
    
    try {
      this.isRefreshing = true;
      
      // Check if token is expired or will expire soon (within 2 minutes)
      const expiryTime = localStorage.getItem('freshnest_token_expiry');
      if (!expiryTime) return;
      
      const timeUntilExpiry = parseInt(expiryTime) - Date.now();
      const twoMinutes = 2 * 60 * 1000;
      
      if (timeUntilExpiry <= twoMinutes) {
        console.log('Token expiring soon, refreshing...');
        await authService.refreshAccessToken();
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't logout automatically, let the user continue
    } finally {
      this.isRefreshing = false;
    }
  }

  // Manual token refresh
  async refreshToken() {
    try {
      await authService.refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return authService.isAuthenticated();
  }

  // Get current user
  getCurrentUser() {
    return authService.getUser();
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager;