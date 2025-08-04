import React from 'react';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SignOutHelper = () => {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      console.log('🔄 Starting complete sign out...');
      
      // Clear backend session and JWT tokens
      await authService.logout();
      console.log('✅ Cleared backend session');
      
      // Sign out from Clerk (Google OAuth)
      await signOut();
      console.log('✅ Signed out from Clerk');
      
      // Clear any remaining auth data
      authService.clearAuthData();
      console.log('✅ Cleared all auth data');
      
      console.log('✅ Complete sign out successful');
      
      // Navigate to login page
      navigate('/login');
      
      // Force page reload to clear all state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      
      // Even if there's an error, try to clear everything
      try {
        await signOut();
      } catch (clerkError) {
        console.error('Clerk signout error:', clerkError);
      }
      
      authService.clearAuthData();
      navigate('/login');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
        <p className="text-green-800">✅ No user is currently signed in</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
      <p className="text-red-800 mb-3">🔴 Google account is currently signed in</p>
      <button
        onClick={handleSignOut}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2"
      >
        Sign Out Google Account
      </button>
      <button
        onClick={() => navigate('/clerk-test-page')}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Back to Test Page
      </button>
    </div>
  );
};

export default SignOutHelper;