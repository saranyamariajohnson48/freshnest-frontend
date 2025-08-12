import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';

const ClerkAuthWrapper = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToastContext();
  const [processedUserId, setProcessedUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleClerkAuth = async () => {
      // Wait for Clerk to load
      if (!isLoaded || !userLoaded) {
        return;
      }

      // Skip processing if we're already on a protected route or certain pages
      const skipRoutes = ['/admin/dashboard', '/retailer/dashboard', '/user/dashboard', '/supplier/dashboard', '/sign-out'];
      if (skipRoutes.some(route => location.pathname.startsWith(route))) {
        console.log('Skipping auth processing - already on protected route:', location.pathname);
        return;
      }

      // If user is signed in with Clerk, process them (but only once)
      if (isSignedIn && user && processedUserId !== user.id && !isProcessing) {
        try {
          // Mark this user as being processed
          setProcessedUserId(user.id);
          setIsProcessing(true);
          
          console.log('🔄 Processing Clerk authenticated user:', {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName
          });

          // Extract user data from Clerk
          const userData = {
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.imageUrl,
            clerkId: user.id,
            provider: 'google'
          };

          // Send to backend to create/login user
          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          const response = await fetch(`${apiUrl}/api/auth/google-signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Authentication failed');
          }

          const data = await response.json();
          
          // Store tokens using authService keys
          localStorage.setItem('freshnest_access_token', data.token);
          localStorage.setItem('freshnest_refresh_token', data.refreshToken);
          localStorage.setItem('freshnest_user', JSON.stringify(data.user));
          
          // Also calculate and store token expiry (assuming 1 hour expiry)
          const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
          localStorage.setItem('freshnest_token_expiry', expiryTime.toString());

          console.log('✅ Authentication successful:', data.user);

          // Trigger a storage event to notify other components
          window.dispatchEvent(new Event('storage'));

          // Show success message
          success(`Welcome ${data.user.fullName}! Redirecting to dashboard...`, { duration: 2000 });

          // Redirect based on user role immediately
          console.log('🚀 Redirecting user with role:', data.user.role);
          
          if (data.user.role === 'admin' || data.user.role === 'Admin') {
            console.log('Redirecting to admin dashboard');
            navigate('/admin/dashboard', { replace: true });
          } else if (data.user.role === 'retailer' || data.user.role === 'Retailer') {
            console.log('Redirecting to retailer dashboard');
            navigate('/retailer/dashboard', { replace: true });
          } else if (data.user.role === 'staff' || data.user.role === 'Staff') {
            console.log('Redirecting to staff dashboard');
            navigate('/staff/dashboard', { replace: true });
          } else if (data.user.role === 'supplier' || data.user.role === 'Supplier') {
            console.log('Redirecting to supplier dashboard');
            navigate('/supplier/dashboard', { replace: true });
          } else if (data.user.role === 'user' || data.user.role === 'User') {
            console.log('Redirecting to user dashboard');
            navigate('/user/dashboard', { replace: true });
          } else {
            console.log('Redirecting to user dashboard (default)');
            navigate('/user/dashboard', { replace: true }); // Default to user dashboard
          }
          
          setIsProcessing(false);

        } catch (err) {
          console.error('❌ Error processing Clerk authentication:', err);
          error(err.message || 'Authentication failed. Please try again.', { duration: 5000 });
          // Reset the processed user on error so they can try again
          setProcessedUserId(null);
          setIsProcessing(false);
        }
      } else if (isLoaded && !isSignedIn) {
        // Reset processed user when signed out
        setProcessedUserId(null);
        setIsProcessing(false);
      }
    };

    handleClerkAuth();
  }, [isSignedIn, user, isLoaded, userLoaded, navigate, success, error, processedUserId, isProcessing, location.pathname]);

  return children;
};

export default ClerkAuthWrapper;