import { API_BASE_URL } from '../api';

class AuthService {
  constructor() {
    this.tokenKey = 'freshnest_access_token';
    this.refreshTokenKey = 'freshnest_refresh_token';
    this.userKey = 'freshnest_user';
    this.tokenExpiryKey = 'freshnest_token_expiry';
  }

  // Store tokens and user data
  setAuthData(authData) {
    const { accessToken, refreshToken, user, expiresIn } = authData;
    
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    // Calculate expiry time
    const expiryTime = this.calculateExpiryTime(expiresIn);
    localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
  }

  // Get access token
  getAccessToken() {
    // Try new token key first, then fallback to old 'token' key for backward compatibility
    return localStorage.getItem(this.tokenKey) || localStorage.getItem('token');
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get user data
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if token is expired
  isTokenExpired() {
    const expiryTime = localStorage.getItem(this.tokenExpiryKey);
    if (!expiryTime) return true;
    
    return Date.now() >= parseInt(expiryTime);
  }

  // Calculate expiry time from expiresIn string
  calculateExpiryTime(expiresIn) {
    const now = Date.now();
    
    if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn.slice(0, -1));
      return now + (minutes * 60 * 1000);
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1));
      return now + (hours * 60 * 60 * 1000);
    } else if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1));
      return now + (days * 24 * 60 * 60 * 1000);
    }
    
    // Default to 15 minutes
    return now + (15 * 60 * 1000);
  }

  // Get authorization header
  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem(this.tokenKey, data.accessToken);
      localStorage.setItem(this.refreshTokenKey, data.refreshToken);
      
      const expiryTime = this.calculateExpiryTime(data.expiresIn);
      localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());

      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Make authenticated API request
  async apiRequest(url, options = {}) {
    let token = this.getAccessToken();
    
    // Check if token is expired and refresh if needed
    if (this.isTokenExpired()) {
      try {
        token = await this.refreshAccessToken();
      } catch (error) {
        throw new Error('Authentication required');
      }
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is invalid, try to refresh once
    if (response.status === 401) {
      try {
        token = await this.refreshAccessToken();
        
        // Retry the request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        });

        return retryResponse;
      } catch (refreshError) {
        // Don't automatically logout, let the component handle it
        console.error('Token refresh failed:', refreshError);
        throw new Error('Token expired - please login again');
      }
    }

    return response;
  }

  // Login
  async login(credentials) {
    try {
      console.log('=== AUTH SERVICE LOGIN ===');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Credentials:', credentials);
      console.log('Full URL:', `${API_BASE_URL}/api/auth/login`);
      
      // Check if backend is reachable
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding properly');
        }
      } catch (error) {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned ${response.status}: Unable to parse response`);
      }

      if (!response.ok) {
        console.error('Login failed with status:', response.status);
        console.error('Error data:', data);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Use the exact error message from backend, fallback to generic message
          const errorMsg = data.error || data.message || 'Invalid credentials';
          throw new Error(errorMsg);
        } else if (response.status === 400) {
          // Bad request - validation errors
          const errorMsg = data.error || data.message || 'Invalid input';
          throw new Error(errorMsg);
        } else if (response.status === 429) {
          // Rate limiting
          const errorMsg = data.error || 'Too many login attempts. Please try again later.';
          throw new Error(errorMsg);
        } else if (response.status === 404) {
          throw new Error('User not found');
        } else if (response.status === 500) {
          console.error('Server error details:', data);
          throw new Error('Server error. Please try again later or contact support.');
        } else {
          throw new Error(data.error || data.message || `Server error: ${response.status}`);
        }
      }

      // Store auth data
      this.setAuthData(data);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      
      // Call logout endpoint if we have a refresh token
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
    }
  }

  // Clear all auth data
  clearAuthData() {
    // Clear current auth keys
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenExpiryKey);
    
    // Clear any other potential auth-related data
    localStorage.removeItem('token'); // Legacy key
    localStorage.removeItem('user'); // Legacy key
    localStorage.removeItem('refreshToken'); // Legacy key
    
    // Clear session storage as well
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenExpiryKey);
    
    // Clear legacy session storage keys
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('refreshToken');
    
    console.log('🧹 Cleared all authentication data from localStorage and sessionStorage');
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.apiRequest(`${API_BASE_URL}/api/auth/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      // Update stored user data
      localStorage.setItem(this.userKey, JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Check user role
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin') || this.hasRole('Admin');
  }

  // Check if user is retailer
  isRetailer() {
    return this.hasRole('retailer');
  }

  // Check if user is regular user
  isRegularUser() {
    return this.hasRole('user');
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;