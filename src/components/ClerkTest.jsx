import React from 'react';
import { useAuth, useUser, useSignIn } from '@clerk/clerk-react';

const ClerkTest = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signIn } = useSignIn();

  const handleGoogleTest = async () => {
    try {
      console.log('Testing Google sign-in...');
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: window.location.href,
        redirectUrlComplete: window.location.href
      });
    } catch (err) {
      console.error('Google test error:', err);
    }
  };

  if (!isLoaded) {
    return <div className="p-4">Loading Clerk...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Clerk Test</h2>
      
      <div className="space-y-2 mb-4">
        <p><strong>Loaded:</strong> {isLoaded ? '✅' : '❌'}</p>
        <p><strong>Signed In:</strong> {isSignedIn ? '✅' : '❌'}</p>
        <p><strong>User:</strong> {user ? user.primaryEmailAddress?.emailAddress : 'None'}</p>
      </div>

      {!isSignedIn && (
        <button
          onClick={handleGoogleTest}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Test Google Sign-In
        </button>
      )}

      {isSignedIn && (
        <div className="space-y-2">
          <p className="text-green-600">✅ Successfully signed in!</p>
          <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
          <p><strong>Name:</strong> {user?.fullName}</p>
        </div>
      )}
    </div>
  );
};

export default ClerkTest;