import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';

export const useClerkGoogleAuth = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [processedUserId, setProcessedUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleClerkAuth = async () => {
      // Wait for Clerk to load
      if (!isLoaded || !userLoaded) {
        return;
      }

      // If user is signed in with Clerk, process them (but only once)
      if (isSignedIn && user && processedUserId !== user.id && !isProcessing) {
        try {
          // Mark this user as being processed
          setProcessedUserId(user.id);
          setIsProcessing(true);
          
          console.log('Processing Clerk authenticated user:', {
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
          
          // Store tokens
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Show success message
          success(`Welcome ${data.user.fullName}! Redirecting to dashboard...`, { duration: 3000 });

          // Redirect based on user role
          setTimeout(() => {
            if (data.user.role === 'retailer') {
              navigate('/retailer/dashboard');
            } else {
              navigate('/dashboard');
            }
            setIsProcessing(false);
          }, 1000);

        } catch (err) {
          console.error('Error processing Clerk authentication:', err);
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
  }, [isSignedIn, user, isLoaded, userLoaded, navigate, success, error, processedUserId, isProcessing]);

  return {
    isSignedIn,
    user,
    isLoaded: isLoaded && userLoaded
  };
};