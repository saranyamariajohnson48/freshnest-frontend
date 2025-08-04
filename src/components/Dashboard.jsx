import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiShield, 
  FiLogOut,
  FiRefreshCw,
  FiClock,
  FiCheck
} from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout, updateProfile, authService } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    // Get token information
    const token = authService.getAccessToken();
    const refreshToken = authService.getRefreshToken();
    const isExpired = authService.isTokenExpired();
    
    setTokenInfo({
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      isExpired
    });
  }, [authService]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      // Show logout toast
      success("Logging out... See you soon! 👋", { duration: 2000 });
      
      await logout();
      
      // Delay redirect to show toast
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Logout error:', err);
      error("Logout failed, please try again", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    try {
      setLoading(true);
      await updateProfile();
      success('Profile refreshed successfully! ✨', { duration: 3000 });
    } catch (err) {
      console.error('Profile refresh error:', err);
      error('Failed to refresh profile. Please try again.', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedAPI = async () => {
    try {
      setLoading(true);
      const response = await authService.apiRequest(`${authService.API_BASE_URL || 'http://localhost:3001'}/api/auth/profile`);
      const data = await response.json();
      
      if (response.ok) {
        success('Protected API call successful! 🎉', { duration: 3000 });
        console.log('API Response:', data);
      } else {
        error('Protected API call failed: ' + data.error, { duration: 4000 });
      }
    } catch (err) {
      console.error('API test error:', err);
      error('API test failed: ' + err.message, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Welcome, {user.fullName}!
              </h1>
              <p className="text-slate-600">JWT Authentication Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefreshProfile}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Profile
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-emerald-600" />
              User Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiUser className="w-5 h-5 text-slate-500 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-medium text-slate-800">{user.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiMail className="w-5 h-5 text-slate-500 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-800">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiPhone className="w-5 h-5 text-slate-500 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-800">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiShield className="w-5 h-5 text-slate-500 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'retailer' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiCheck className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Email Verified</p>
                  <p className="font-medium text-slate-800">
                    {user.isEmailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* JWT Token Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <FiShield className="w-5 h-5 mr-2 text-emerald-600" />
              JWT Token Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mr-3 ${tokenInfo?.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm text-slate-500">Access Token</p>
                  <p className="font-medium text-slate-800">
                    {tokenInfo?.hasToken ? 'Present' : 'Missing'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mr-3 ${tokenInfo?.hasRefreshToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm text-slate-500">Refresh Token</p>
                  <p className="font-medium text-slate-800">
                    {tokenInfo?.hasRefreshToken ? 'Present' : 'Missing'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <FiClock className={`w-5 h-5 mr-3 ${tokenInfo?.isExpired ? 'text-red-500' : 'text-green-500'}`} />
                <div>
                  <p className="text-sm text-slate-500">Token Status</p>
                  <p className={`font-medium ${tokenInfo?.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {tokenInfo?.isExpired ? 'Expired' : 'Valid'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={testProtectedAPI}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <FiShield className="w-4 h-4 mr-2" />
                Test Protected API
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Account Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiUser className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FiShield className="w-4 h-4 mr-2" />
              Settings
            </button>
            
            <button
              onClick={() => navigate('/change-password')}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FiShield className="w-4 h-4 mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;