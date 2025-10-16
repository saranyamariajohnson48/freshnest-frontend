import { useState, useEffect, useContext, createContext } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Run migration first to ensure consistent localStorage keys
        authService.migrateOldKeys();
        
        // Check if we have a token
        const token = authService.getAccessToken();
        const userData = authService.getUser();
        
        if (token && userData) {
          setUser(userData);
          setIsAuthenticated(true);
          
          // Try to refresh profile data, but don't fail if it doesn't work
          try {
            const freshProfile = await authService.getProfile();
            setUser(freshProfile);
          } catch (error) {
            console.log('Could not refresh profile:', error.message);
            // Keep existing user data if profile refresh fails
            // Don't set isAuthenticated to false here
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Only clear auth data if there's a serious error
        if (!authService.getAccessToken()) {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes (when ClerkAuthWrapper updates auth data)
    const handleStorageChange = () => {
      console.log('Storage changed, re-checking auth state');
      initializeAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const data = await authService.login(credentials);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local data
      authService.clearAuthData();
    } finally {
      // Ensure complete state reset
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async () => {
    try {
      const freshProfile = await authService.getProfile();
      setUser(freshProfile);
      return freshProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Refresh auth state manually
  const refreshAuth = async () => {
    try {
      const token = authService.getAccessToken();
      const userData = authService.getUser();
      
      if (token && userData) {
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      return false;
    }
  };

  // Check user role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin') || hasRole('Admin');
  };

  // Check if user is retailer
  const isRetailer = () => {
    return hasRole('retailer');
  };

  // Check if user is regular user
  const isRegularUser = () => {
    return hasRole('user');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    refreshAuth,
    hasRole,
    isAdmin,
    isRetailer,
    isRegularUser,
    authService // Expose auth service for direct API calls
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component, requiredRoles = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Required roles: {requiredRoles.join(', ')}</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default useAuth;