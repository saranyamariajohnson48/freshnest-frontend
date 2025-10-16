import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import authService from '../services/authService';
import { API_BASE_URL } from '../api';

const AdminDebug = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        console.error('API check failed:', error);
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, []);

  useEffect(() => {
    setDebugInfo({
      // Auth state
      isAuthenticated,
      loading,
      user: user ? {
        id: user.id || user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      } : null,
      
      // API configuration
      apiBaseUrl: API_BASE_URL,
      apiStatus,
      
      // Local storage
      localStorage: {
        freshnest_access_token: localStorage.getItem('freshnest_access_token'),
        freshnest_user: localStorage.getItem('freshnest_user'),
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      },
      
      // Environment
      isProduction: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      
      // Timestamp
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, loading, user, apiStatus]);

  const testApiConnection = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setApiStatus('connected');
        alert('API connection successful!');
      } else {
        setApiStatus('error');
        alert(`API connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus('error');
      alert(`API connection error: ${error.message}`);
    }
  };

  const clearAuthData = () => {
    authService.clearAuthData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Authentication Status</h2>
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
              <h2 className="text-lg font-semibold text-gray-800">API Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>API URL:</span>
                  <span className="text-blue-600 text-sm break-all">{API_BASE_URL}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={
                    apiStatus === 'connected' ? 'text-green-600' : 
                    apiStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {apiStatus === 'connected' ? 'Connected' : 
                     apiStatus === 'error' ? 'Error' : 'Checking...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-blue-600">{import.meta.env.PROD ? 'Production' : 'Development'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Debug Information</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={testApiConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test API Connection
            </button>
            <button
              onClick={clearAuthData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Auth Data
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting Steps:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. Check if API URL is correct and accessible</li>
              <li>2. Verify user has admin role</li>
              <li>3. Check browser console for errors</li>
              <li>4. Ensure backend is running and accessible</li>
              <li>5. Check network connectivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
