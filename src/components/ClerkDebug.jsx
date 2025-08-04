import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const ClerkDebug = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <div>Loading Clerk...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="font-bold mb-2">Clerk Debug Info:</h3>
      <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
      <p><strong>Is Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
      <p><strong>User ID:</strong> {user?.id || 'None'}</p>
      <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'None'}</p>
      <p><strong>Full Name:</strong> {user?.fullName || 'None'}</p>
      <p><strong>Image URL:</strong> {user?.imageUrl || 'None'}</p>
      
      {user && (
        <div className="mt-2">
          <h4 className="font-semibold">Full User Object:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ClerkDebug;