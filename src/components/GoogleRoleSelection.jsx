import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';

const GoogleRoleSelection = ({ userEmail, onRoleSelect, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToastContext();
  const navigate = useNavigate();

  const roles = [
    {
      value: 'user',
      label: 'Customer',
      description: 'Browse and purchase fresh products',
      icon: '🛒'
    },
    {
      value: 'retailer',
      label: 'Retailer',
      description: 'Sell your products on our platform',
      icon: '🏪'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      error('Please select your role to continue', { duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      await onRoleSelect(selectedRole);
      success(`Welcome! You've been registered as a ${selectedRole}`, { duration: 3000 });
    } catch (err) {
      console.error('Role selection error:', err);
      error('Failed to complete registration. Please try again.', { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{backgroundColor: '#004030'}}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob" style={{backgroundColor: '#437057'}}></div>
        <div className="absolute top-40 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000" style={{backgroundColor: '#5a8a6b'}}></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000" style={{backgroundColor: '#437057'}}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md mx-auto px-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2">
                <span className="text-4xl font-black text-white">Fresh</span>
                <span className="text-4xl font-black" style={{color: '#437057'}}>Nest</span>
              </div>
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-white mb-2">Complete Your Registration</h1>
                <p className="text-gray-300 text-sm">
                  Hi! We see you're signing in with <span className="font-semibold text-white">{userEmail}</span>
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  Please select your role to continue:
                </p>
              </div>
            </div>

            {/* Role Selection Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`block cursor-pointer transition-all duration-300 ${
                      selectedRole === role.value
                        ? 'transform scale-105'
                        : 'hover:transform hover:scale-102'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                        selectedRole === role.value
                          ? 'border-white bg-white/20 shadow-lg'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{role.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {role.label}
                          </h3>
                          <p className="text-gray-300 text-sm">
                            {role.description}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            selectedRole === role.value
                              ? 'border-white bg-white'
                              : 'border-white/40'
                          }`}
                        >
                          {selectedRole === role.value && (
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#437057'}}></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 px-6 border border-white/20 rounded-2xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedRole}
                  className="flex-1 py-3 px-6 rounded-2xl text-white font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: selectedRole ? '#437057' : '#666',
                    focusRingColor: '#437057'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-xs">
                You can change your role later in your account settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleRoleSelection;