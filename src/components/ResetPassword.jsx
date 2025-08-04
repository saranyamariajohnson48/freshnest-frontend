import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from "../api";
import { useToastContext } from "../contexts/ToastContext";
import { 
  FiLock, 
  FiArrowLeft, 
  FiCheck, 
  FiRefreshCw,
  FiShield,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiX
} from 'react-icons/fi';

function validatePassword(password) {
  if (!password || password.trim() === "") return "Password is required";
  if (password.includes(" ")) return "Password cannot contain spaces";
  if (password.length < 6) return "Password must be at least 6 characters";
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!(hasUppercase && hasLowercase && hasDigit && hasSpecialChar)) {
    return "Password should include at least one uppercase letter, one lowercase letter, one digit, and one special character";
  }
  return "";
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToastContext();
  const token = searchParams.get('token');
  
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setServerError("Invalid or missing reset token");
    }
  }, [token]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const newErrors = {
      password: validatePassword(form.password),
      confirmPassword: form.password !== form.confirmPassword ? "Passwords do not match" : ""
    };
    
    setErrors(newErrors);
    if (newErrors.password || newErrors.confirmPassword) return;

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 400 && data.error.includes('token')) {
          setTokenValid(false);
        }
        setServerError(data.error || "Failed to reset password");
        error(data.error || "Failed to reset password", { duration: 4000 });
      } else {
        success("Password reset successful! 🎉 You can now login with your new password.", { duration: 4000 });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setServerError("Server error. Please try again.");
    }
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/login')}
            className="mb-8 flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
          >
            <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Login</span>
          </button>

          {/* Error Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FiX className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold text-slate-800 mb-3">Invalid Reset Link</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Request New Reset Link
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
        >
          <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Login</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            {/* Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiLock className="w-8 h-8 text-white" />
            </div>
            
            {/* Brand */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="text-emerald-600">Fresh</span>
                <span className="text-slate-800">Nest</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium">Reset Password</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {/* Title & Description */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Create New Password</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Choose a strong password to secure your account.
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your new password"
                    className="w-full pl-12 pr-12 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center mt-2">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.password}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    className="w-full pl-12 pr-12 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center mt-2">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              
              {serverError && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-700 text-sm flex items-center">
                    <FiAlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {serverError}
                  </p>
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Updating Password...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiCheck className="w-5 h-5 mr-2" />
                    Update Password
                  </div>
                )}
              </button>
            </form>

            {/* Password Requirements */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start">
                <FiShield className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-700 font-medium mb-2">Password Requirements</p>
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-600">
                    <div className="flex items-center">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                      At least 6 characters long
                    </div>
                    <div className="flex items-center">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                      One uppercase letter (A-Z)
                    </div>
                    <div className="flex items-center">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                      One lowercase letter (a-z)
                    </div>
                    <div className="flex items-center">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                      One number (0-9)
                    </div>
                    <div className="flex items-center">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                      One special character (!@#$%^&*)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;