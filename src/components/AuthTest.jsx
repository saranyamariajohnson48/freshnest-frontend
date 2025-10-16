import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import authService from '../services/authService';

const AuthTest = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isAuthenticated,
        user,
        loading,
        token: authService.getAccessToken(),
        refreshToken: authService.getRefreshToken(),
        userData: authService.getUser(),
        isTokenExpired: authService.isTokenExpired(),
        localStorageKeys: {
          freshnest_access_token: localStorage.getItem('freshnest_access_token'),
          freshnest_refresh_token: localStorage.getItem('freshnest_refresh_token'),
          freshnest_user: localStorage.getItem('freshnest_user'),
          freshnest_token_expiry: localStorage.getItem('freshnest_token_expiry'),
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user'),
          refreshToken: localStorage.getItem('refreshToken')
        }
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, loading]);

  const testMigration = () => {
    // Simulate old keys
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'user', email: 'test@example.com' }));
    localStorage.setItem('refreshToken', 'test-refresh');
    
    // Run migration
    authService.migrateOldKeys();
    
    // Update debug info
    setTimeout(() => {
      setDebugInfo(prev => ({ ...prev }));
    }, 100);
  };

  const clearAll = () => {
    authService.clearAuthData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Auth State</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                    {loading ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User Role:</span>
                  <span className="text-blue-600">{user?.role || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>User Email:</span>
                  <span className="text-blue-600">{user?.email || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Token Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Access Token:</span>
                  <span className={debugInfo.token ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.token ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Refresh Token:</span>
                  <span className={debugInfo.refreshToken ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.refreshToken ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Token Expired:</span>
                  <span className={debugInfo.isTokenExpired ? 'text-red-600' : 'text-green-600'}>
                    {debugInfo.isTokenExpired ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">localStorage Keys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(debugInfo.localStorageKeys || {}).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{key}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {value ? 'Set' : 'Empty'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 break-all">
                    {value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'null'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={testMigration}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Migration
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Data
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Test Instructions:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. If you see "Access Denied" errors, check if localStorage keys are consistent</li>
              <li>2. Click "Test Migration" to simulate old keys and test migration</li>
              <li>3. All keys should use "freshnest_" prefix after migration</li>
              <li>4. If issues persist, clear all data and log in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
