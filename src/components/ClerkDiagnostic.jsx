import React, { useState, useEffect } from 'react';
import { useAuth, useUser, useSignIn } from '@clerk/clerk-react';

const ClerkDiagnostic = () => {
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
    addLog(`Clerk Status - Loaded: ${isLoaded}, User Loaded: ${userLoaded}, Signed In: ${isSignedIn}`);
    
    if (user) {
      addLog(`User Details - ID: ${user.id}, Email: ${user.primaryEmailAddress?.emailAddress}`, 'success');
    }

    // Check URL parameters for OAuth errors
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (error) {
      addLog(`OAuth Error: ${error} - ${errorDescription}`, 'error');
    }
    if (code) {
      addLog(`OAuth Code received: ${code.substring(0, 20)}...`, 'success');
    }
    if (state) {
      addLog(`OAuth State: ${state}`, 'info');
    }

  }, [isLoaded, userLoaded, isSignedIn, user]);

  const testClerkConfiguration = () => {
    addLog('=== Clerk Configuration Test ===');
    addLog(`Publishable Key: ${import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 30)}...`);
    addLog(`Current Domain: ${window.location.origin}`);
    addLog(`Clerk Domain: resolved-emu-40.clerk.accounts.dev`);
    
    // Test if Clerk is properly initialized
    if (isLoaded) {
      addLog('✅ Clerk is loaded and initialized', 'success');
    } else {
      addLog('❌ Clerk is not loaded', 'error');
    }
  };

  const testGoogleAuth = async () => {
    setTesting(true);
    try {
      addLog('=== Starting Google Authentication Test ===');
      addLog('Initiating Google OAuth redirect...');
      
      const redirectUrl = `${window.location.origin}/auth-handler`;
      addLog(`Redirect URL: ${redirectUrl}`);
      
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl
      });
      
    } catch (err) {
      addLog(`Google Auth Error: ${err.message}`, 'error');
      setTesting(false);
    }
  };

  const checkClerkDashboardConfig = () => {
    addLog('=== Clerk Dashboard Configuration Check ===');
    addLog('Required URLs to add in Clerk Dashboard → Domains:');
    addLog('1. http://localhost:5173');
    addLog('2. http://localhost:5173/login');
    addLog('3. http://localhost:5173/auth-handler');
    addLog('');
    addLog('Required Google OAuth Redirect URI:');
    addLog('https://resolved-emu-40.clerk.accounts.dev/v1/oauth_callback');
    addLog('');
    addLog('Check these configurations in your Clerk Dashboard!', 'warning');
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Clerk Google Auth Diagnostic</h2>
      
      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Status</h3>
          <div className="space-y-1 text-sm">
            <p>Clerk Loaded: {isLoaded ? '✅' : '❌'}</p>
            <p>User Loaded: {userLoaded ? '✅' : '❌'}</p>
            <p>Signed In: {isSignedIn ? '✅' : '❌'}</p>
            <p>Current URL: {window.location.href}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">User Info</h3>
          {user ? (
            <div className="space-y-1 text-sm">
              <p>ID: {user.id}</p>
              <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
              <p>Name: {user.fullName}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No user signed in</p>
          )}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testClerkConfiguration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Clerk Config
        </button>
        
        <button
          onClick={testGoogleAuth}
          disabled={testing || !isLoaded}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Google Auth'}
        </button>
        
        <button
          onClick={checkClerkDashboardConfig}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Show Required Config
        </button>
        
        <button
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs Panel */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        <h3 className="text-white mb-2">Diagnostic Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Click a test button to start.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`mb-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              log.type === 'warning' ? 'text-yellow-400' :
              'text-gray-300'
            }`}>
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      {/* Configuration Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded border-l-4 border-yellow-400">
        <h3 className="font-semibold text-yellow-800 mb-2">Next Steps:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Click "Show Required Config" to see what needs to be configured</li>
          <li>Go to <a href="https://dashboard.clerk.com/" target="_blank" rel="noopener noreferrer" className="underline">Clerk Dashboard</a></li>
          <li>Add the required URLs to Domains section</li>
          <li>Configure Google OAuth with the correct redirect URI</li>
          <li>Come back and test Google Auth</li>
        </ol>
      </div>
    </div>
  );
};

export default ClerkDiagnostic;