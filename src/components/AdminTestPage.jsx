import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminTestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🎛️ Admin Dashboard Test
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Admin Credentials:</h3>
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> saranyamariajohnson@mca.ajce.in<br/>
              <strong>Password:</strong> Saranya@20003
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🔐 Go to Login Page
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🎛️ Direct to Admin Dashboard
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🏠 Back to Home
            </button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Test Steps:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click "Go to Login Page"</li>
              <li>2. Enter admin credentials</li>
              <li>3. Should auto-redirect to dashboard</li>
              <li>4. Test sidebar and charts</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTestPage;