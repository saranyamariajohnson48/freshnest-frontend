import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../api";
import { 
  FiMail, 
  FiArrowLeft, 
  FiCheck, 
  FiRefreshCw,
  FiShield,
  FiLock
} from 'react-icons/fi';

function validateEmail(email) {
  if (!email || email.trim() === "") return "Email is required";
  if (email.includes(" ")) return "Email cannot contain spaces";
  const emailRegex = /^[a-z][a-z0-9]*(?:[-][a-z0-9]+)*@(gmail\.com|mca\.ajce\.in|yahoo\.com)$/;
  if (!emailRegex.test(email)) return "Enter a valid email address (gmail.com, mca.ajce.in, or yahoo.com only)";
  return "";
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function handleChange(e) {
    setEmail(e.target.value);
    setError("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
      } else {
        setMessage("Password reset link has been sent to your email address.");
        setEmailSent(true);
      }
    } catch (err) {
      setLoading(false);
      setError("Server error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/login')}
          className="mb-4 sm:mb-6 md:mb-8 flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
        >
          <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs sm:text-sm font-medium">Back to Login</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6 text-center">
            {/* Logo */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg">
              <FiLock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            
            {/* Brand */}
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-1">
                <span className="text-emerald-600">Fresh</span>
                <span className="text-slate-800">Nest</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Password Recovery</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            {!emailSent ? (
              <>
                {/* Title & Description */}
                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 mb-2">Forgot your password?</h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed px-2">
                    No worries! Enter your email address and we'll send you a secure link to reset your password.
                  </p>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 border border-slate-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400 text-xs sm:text-sm md:text-base"
                        value={email}
                        onChange={handleChange}
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs sm:text-sm flex items-center mt-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span className="break-words">{error}</span>
                      </p>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm md:text-base" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <FiRefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                        <span className="truncate">Sending Reset Link...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FiMail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="truncate">Send Reset Link</span>
                      </div>
                    )}
                  </button>
                </form>

                {/* Security Note */}
                <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
                  <div className="flex items-start">
                    <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium mb-1">Secure Process</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        We'll send you a secure, time-limited link to reset your password. The link will expire in 1 hour for your security.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg">
                    <FiCheck className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 mb-3">Check Your Email</h2>
                  <p className="text-slate-600 mb-2 leading-relaxed text-xs sm:text-sm">
                    We've sent a password reset link to:
                  </p>
                  <p className="text-emerald-600 font-semibold mb-3 sm:mb-4 md:mb-6 bg-emerald-50 px-2 sm:px-3 md:px-4 py-2 rounded-lg border border-emerald-200 text-xs sm:text-sm md:text-base break-all">
                    {email}
                  </p>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                      <p className="text-xs sm:text-sm text-blue-800 leading-relaxed text-left">
                        <strong>Next steps:</strong><br />
                        1. Check your email inbox<br />
                        2. Click the reset link<br />
                        3. Create your new password
                      </p>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-500 px-2">
                      Didn't receive the email? Check your spam folder or try again with a different email address.
                    </p>
                    
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                        setMessage("");
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-xs sm:text-sm transition-colors"
                    >
                      Try with a different email
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 sm:mt-4 md:mt-6">
          <p className="text-xs sm:text-sm text-slate-500 px-4">
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

export default ForgotPassword;