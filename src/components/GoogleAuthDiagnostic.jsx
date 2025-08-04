import React, { useState, useEffect } from 'react';
import { useAuth, useUser, useSignIn } from '@clerk/clerk-react';

const GoogleAuthDiagnostic = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signIn } = useSignIn();
  const [logs, setLogs] = useState([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    addLog(`Clerk loaded: ${isLoaded}, User loaded: ${userLoaded}`);
    if (isSignedIn && user) {
      addLog(`User signed in: ${user.primaryEmailAddress?.emailAddress}`, 'success');
    }
  }, [isLoaded, userLoaded, isSignedIn, user]);

  const testGoogleAuth = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('Starting Google authentication test...');
      addLog(`Current URL: ${window.location.href}`);
      addLog(`Clerk publishable key: ${import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 20)}...`);
      addLog(`API Base URL: ${import.meta.env.VITE_API_BASE_URL}`);
      
      const redirectUrl = `${window.location.origin}/auth-handler`;
      addLog(`Redirect URL: ${redirectUrl}`);
      
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl
      });
      
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      setTesting(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      addLog('Testing backend connection...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/auth/msg`);
      const data = await response.json();
      
      if (response.ok) {
        addLog(`Backend connected: ${data.message}`, 'success');
      } else {
        addLog(`Backend error: ${response.status}`, 'error');
      }
    } catch (err) {
      addLog(`Backend connection failed: ${err.message}`, 'error');
    }
  };

  const testGoogleSignInEndpoint = async () => {
    try {
      addLog('Testing Google sign-in endpoint...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const testData = {
        email: 'test@gmail.com',
        fullName: 'Test User',
        clerkId: 'test_clerk_id',
        provider: 'google'
      };
      
      const response = await fetch(`${apiUrl}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addLog(`Google endpoint working: ${data.message}`, 'success');
      } else {
        addLog(`Google endpoint error: ${data.error || response.status}`, 'error');
      }
    } catch (err) {
      addLog(`Google endpoint test failed: ${err.message}`, 'error');
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Google Auth Diagnostic Tool</h2>
      
      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold">Clerk Status</h3>
          <p>Loaded: {isLoaded ? '✅' : '❌'}</p>
          <p>Signed In: {isSignedIn ? '✅' : '❌'}</p>
          <p>User: {user?.primaryEmailAddress?.emailAddress || 'None'}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold">Environment</h3>
          <p>Frontend: http://localhost:5173</p>
          <p>Backend: {import.meta.env.VITE_API_BASE_URL}</p>
          <p>Clerk Key: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅' : '❌'}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold">Current User</h3>
          {user ? (
            <>
              <p>ID: {user.id}</p>
              <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
              <p>Name: {user.fullName}</p>
            </>
          ) : (
            <p>No user signed in</p>
          )}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testGoogleAuth}
          disabled={testing || !isLoaded}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Google Auth'}
        </button>
        
        <button
          onClick={testBackendConnection}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Backend
        </button>
        
        <button
          onClick={testGoogleSignInEndpoint}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Test Google Endpoint
        </button>
        
        <button
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs Panel */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        <h3 className="text-white mb-2">Diagnostic Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Click a test button to start.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`mb-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              'text-gray-300'
            }`}>
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>First, test backend connection to ensure API is working</li>
          <li>Test Google endpoint to verify backend Google auth is configured</li>
          <li>Test Google Auth to see if Clerk redirects work properly</li>
          <li>Check the logs for any error messages</li>
          <li>If Google Auth redirects you back here, check Clerk Dashboard configuration</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleAuthDiagnostic;