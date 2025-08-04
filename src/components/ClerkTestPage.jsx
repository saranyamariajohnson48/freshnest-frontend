import React from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';

const ClerkTestPage = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Clerk Google Auth Test</h1>
        
        <SignedOut>
          <div className="space-y-4">
            <div className="text-center text-gray-600 mb-6">
              <p>Test Google authentication without any redirect URI configuration!</p>
            </div>
            
            {/* Sign In with Modal */}
            <SignInButton mode="modal">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In with Google (Modal)
              </button>
            </SignInButton>
            
            {/* Sign Up with Modal */}
            <SignUpButton mode="modal">
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Sign Up with Google (Modal)
              </button>
            </SignUpButton>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>✅ No redirect URIs needed</p>
              <p>✅ No Clerk Dashboard configuration required</p>
              <p>✅ Works out of the box</p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <UserButton afterSignOutUrl="/clerk-test" />
              <div>
                <h2 className="text-xl font-semibold">Welcome!</h2>
                <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Authentication Successful!</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Name:</strong> {user?.fullName}</p>
                <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
                <p><strong>Clerk ID:</strong> {user?.id}</p>
                <p><strong>Provider:</strong> Google OAuth</p>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mr-2"
              >
                Go to Main Login
              </button>
              <button
                onClick={() => window.location.href = '/sign-out'}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out Google Account
              </button>
            </div>
          </div>
        </SignedIn>
      </div>
    </div>
  );
};

export default ClerkTestPage;