import { Navigate } from 'react-router-dom';

export default function AuthMiddleware({ children, requiredRole }) {
  // Get user and token from localStorage using the correct keys
  const user = JSON.parse(localStorage.getItem('freshnest_user'));
  const token = localStorage.getItem('freshnest_access_token');

  // Check if both user and token exist
  if (!user || !token) {
    // Clear any potentially invalid data
    localStorage.removeItem('freshnest_user');
    localStorage.removeItem('freshnest_access_token');
    localStorage.removeItem('freshnest_refresh_token');
    localStorage.removeItem('freshnest_token_expiry');
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
    // User's role doesn't match the required role, redirect to appropriate dashboard
    switch (user.role.toLowerCase()) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'retailer':
        return <Navigate to="/retailer/dashboard" replace />;
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />;
      case 'supplier':
        return <Navigate to="/supplier/dashboard" replace />;
      case 'user':
        return <Navigate to="/user/dashboard" replace />;
      default:
        // Clear invalid session data
        localStorage.removeItem('freshnest_user');
        localStorage.removeItem('freshnest_access_token');
        localStorage.removeItem('freshnest_refresh_token');
        localStorage.removeItem('freshnest_token_expiry');
        return <Navigate to="/login" replace />;
    }
  }

  // Authorized, render children
  return children;
}
