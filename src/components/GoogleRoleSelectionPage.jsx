import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToastContext } from '../contexts/ToastContext';
import GoogleRoleSelection from './GoogleRoleSelection';

const GoogleRoleSelectionPage = () => {
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { handleGoogleSignIn } = useClerkAuth();
  const { error } = useToastContext();

  useEffect(() => {
    // Get pending user data from session storage
    const pendingData = sessionStorage.getItem('pendingGoogleUser');
    
    if (!pendingData) {
      console.log('No pending Google user data found');
      error('Session expired. Please sign in again.', { duration: 3000 });
      navigate('/login');
      return;
    }

    try {
      const parsedData = JSON.parse(pendingData);
      console.log('Loaded pending Google user data:', parsedData);
      setPendingUser(parsedData);
    } catch (err) {
      console.error('Error parsing pending user data:', err);
      error('Invalid session data. Please sign in again.', { duration: 3000 });
      navigate('/login');
      return;
    }

    setLoading(false);
  }, [navigate, error]);

  const handleRoleSelect = async (selectedRole) => {
    if (!pendingUser) {
      throw new Error('No pending user data available');
    }

    console.log('Role selected:', selectedRole);
    console.log('Processing with user data:', pendingUser.clerkUser);

    try {
      // Clear the pending user data
      sessionStorage.removeItem('pendingGoogleUser');
      
      // Complete the Google sign-in with the selected role
      await handleGoogleSignIn(pendingUser.clerkUser, selectedRole);
    } catch (err) {
      console.error('Error completing Google sign-in with role:', err);
      throw err; // Re-throw to be handled by GoogleRoleSelection component
    }
  };

  const handleCancel = () => {
    // Clear pending user data
    sessionStorage.removeItem('pendingGoogleUser');
    
    // Navigate back to login
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">Session expired. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleRoleSelection
      userEmail={pendingUser.userData.email}
      onRoleSelect={handleRoleSelect}
      onCancel={handleCancel}
    />
  );
};

export default GoogleRoleSelectionPage;