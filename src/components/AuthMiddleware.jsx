import { Navigate } from 'react-router-dom';

export default function AuthMiddleware({ children, requiredRole }) {
  // Get user and token from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Check if both user and token exist
  if (!user || !token) {
    // Clear any potentially invalid data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
      case 'user':
        return <Navigate to="/user/dashboard" replace />;
      default:
        // Clear invalid session data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
  }

  // Authorized, render children
  return children;
}
