import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToastContext } from '../contexts/ToastContext';

const ClerkAuthHandler = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { handleGoogleSignIn } = useClerkAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToastContext();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      // Wait for Clerk to load
      if (!isLoaded || !userLoaded) {
        console.log('Waiting for Clerk to load...');
        return;
      }

      console.log('Clerk auth handler - Auth state:', { 
        isSignedIn, 
        user: user?.id, 
        isLoaded, 
        userLoaded,
        currentUrl: window.location.href,
        urlParams: window.location.search
      });

      if (isSignedIn && user && !processing) {
        try {
          setProcessing(true);
          console.log('Clerk auth handler - processing user:', {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName
          });
          
          await handleGoogleSignIn(user);
          
          // Show success message
          success('Successfully signed in with Google! Redirecting to dashboard...', { duration: 3000 });
          
        } catch (err) {
          console.error('Error processing Google sign-in:', err);
          const errorMessage = err.message || 'Failed to complete sign-in. Please try again.';
          setError(errorMessage);
          showError(errorMessage, { duration: 5000 });
          setTimeout(() => navigate('/login'), 3000);
        }
      } else if (isLoaded && !isSignedIn) {
        console.log('User not signed in, redirecting to login');
        console.log('Current URL:', window.location.href);
        console.log('URL params:', new URLSearchParams(window.location.search).toString());
        
        // Check if there are any error parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('OAuth error in URL:', error, errorDescription);
          setError(`Authentication failed: ${error} - ${errorDescription}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        navigate('/login');
      }
    };

    processAuth();
  }, [isSignedIn, user, isLoaded, userLoaded, handleGoogleSignIn, navigate, processing]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {!isLoaded || !userLoaded ? 'Loading...' : 'Processing your sign-in...'}
        </p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
};

export default ClerkAuthHandler;