import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const TokenDebug = () => {
  const [tokenInfo, setTokenInfo] = useState({});

  useEffect(() => {
    const checkTokens = () => {
      const info = {
        // New token keys
        freshnest_access_token: localStorage.getItem('freshnest_access_token'),
        freshnest_refresh_token: localStorage.getItem('freshnest_refresh_token'),
        freshnest_user: localStorage.getItem('freshnest_user'),
        freshnest_token_expiry: localStorage.getItem('freshnest_token_expiry'),
        
        // Old token key (fallback)
        token: localStorage.getItem('token'),
        
        // Auth service methods
        authService_getAccessToken: authService.getAccessToken(),
        authService_isAuthenticated: authService.isAuthenticated(),
        authService_isTokenExpired: authService.isTokenExpired(),
        authService_getUser: authService.getUser(),
        
        // Current timestamp
        currentTime: new Date().toISOString(),
        currentTimestamp: Date.now()
      };
      
      setTokenInfo(info);
    };

    checkTokens();
    const interval = setInterval(checkTokens, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const clearAllTokens = () => {
    localStorage.removeItem('freshnest_access_token');
    localStorage.removeItem('freshnest_refresh_token');
    localStorage.removeItem('freshnest_user');
    localStorage.removeItem('freshnest_token_expiry');
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Token Debug Information</h1>
            <button
              onClick={clearAllTokens}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Tokens
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(tokenInfo).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{key}</h3>
                  <span className={`text-sm px-2 py-1 rounded ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'null')}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. If tokens are missing, please log in again</li>
              <li>2. If tokens are expired, they should auto-refresh</li>
              <li>3. Check that authService_isAuthenticated is true</li>
              <li>4. If issues persist, clear all tokens and log in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;