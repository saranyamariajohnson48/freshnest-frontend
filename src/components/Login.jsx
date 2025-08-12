import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';

import { API_BASE_URL } from "../api";
import img1 from "../assets/img1.jpg";
import authService from "../services/authService";
import { useToastContext } from "../contexts/ToastContext";
import SimpleGoogleAuth from "./SimpleGoogleAuth";
import { validateEmail, validateLoginPassword } from "../utils/dynamicValidation";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: showError } = useToastContext();
  const role = searchParams.get('role');
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  


  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
    setServerError("");
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    let validationError = "";
    
    if (name === "email") {
      validationError = validateEmail(value);
    } else if (name === "password") {
      validationError = validateLoginPassword(value);
    }
    
    if (validationError) {
      setErrors({ ...errors, [name]: validationError });
    }
  }



  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {
      email: validateEmail(form.email),
      password: validateLoginPassword(form.password),
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;
    
    setLoading(true);
    setServerError("");
    
    try {
      console.log("Attempting login with:", {
        email: form.email,
        passwordLength: form.password?.length
      });
      
      const data = await authService.login(form);
      setLoading(false);
      
      if (!data || !data.user) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Login successful:", data);
      console.log("User role:", data.user?.role);
      
      // Show success toast
      success(`Welcome back, ${data.user?.fullName || data.user?.email}! 🎉`, {
        duration: 3000
      });
      
      // Redirect based on user role
      setTimeout(() => {
        if (data.user && (data.user.role === 'admin' || data.user.role === 'Admin')) {
          console.log("Redirecting to admin dashboard...");
          navigate("/admin/dashboard");
          setTimeout(() => {
            if (window.location.pathname !== "/admin/dashboard") {
              window.location.href = "/admin/dashboard";
            }
          }, 500);
        } else if (data.user && (data.user.role === 'retailer' || data.user.role === 'Retailer')) {
          console.log("Redirecting to retailer dashboard...");
          navigate("/retailer/dashboard");
          setTimeout(() => {
            if (window.location.pathname !== "/retailer/dashboard") {
              window.location.href = "/retailer/dashboard";
            }
          }, 500);
        } else if (data.user && (data.user.role === 'staff' || data.user.role === 'Staff')) {
          console.log("Redirecting to staff dashboard...");
          navigate("/staff/dashboard");
          setTimeout(() => {
            if (window.location.pathname !== "/staff/dashboard") {
              window.location.href = "/staff/dashboard";
            }
          }, 500);
        } else if (data.user && (data.user.role === 'supplier' || data.user.role === 'Supplier')) {
          console.log("Redirecting to supplier dashboard...");
          navigate("/supplier/dashboard");
          setTimeout(() => {
            if (window.location.pathname !== "/supplier/dashboard") {
              window.location.href = "/supplier/dashboard";
            }
          }, 500);
        } else if (data.user && (data.user.role === 'user' || data.user.role === 'User')) {
          console.log("Redirecting to user dashboard...");
          navigate("/user/dashboard");
          setTimeout(() => {
            if (window.location.pathname !== "/user/dashboard") {
              window.location.href = "/user/dashboard";
            }
          }, 500);
        } else {
          console.log("Redirecting to home...");
          navigate("/");
        }
      }, 100);
      
    } catch (error) {
      setLoading(false);
      console.error('Login error details:', error);
      
      // Handle specific error cases
      const errorMessage = error.message.toLowerCase();
      let displayMessage = "";
      
      if (errorMessage.includes('verify your email') || errorMessage.includes('email not verified')) {
        displayMessage = "⚠️ Please verify your email address before logging in. Check your inbox for the verification link.";
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        displayMessage = "🚫 Too many login attempts. Please wait a few minutes before trying again.";
      } else if (errorMessage.includes('server error') || errorMessage.includes('server is')) {
        displayMessage = "🔧 Server is currently unavailable. Please try again later or contact support.";
      } else if (errorMessage.includes('invalid credentials') || errorMessage.includes('invalid email or password') || errorMessage.includes('invalid')) {
        displayMessage = "❌ Invalid login credentials. Please check your email and password and try again.";
      } else if (errorMessage.includes('not found') || errorMessage.includes('user not found')) {
        displayMessage = "👤 Account not found. Please check your email or sign up for a new account.";
      } else if (errorMessage.includes('password must be')) {
        displayMessage = "🔒 " + error.message;
      } else if (errorMessage.includes('email format') || errorMessage.includes('invalid email format')) {
        displayMessage = "📧 Please enter a valid email address.";
      } else {
        displayMessage = "❌ Login failed. " + (error.message || "Please try again.");
      }
      
      // Show error toast
      showError(displayMessage, { duration: 5000 });
      setServerError(displayMessage);
      
      // Log additional debugging information
      console.log('Login attempt details:', {
        email: form.email,
        timestamp: new Date().toISOString(),
        errorType: error.name,
        errorStack: error.stack
      });
    }
  }

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
        <div className="w-full pl-8 pr-24 grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Form */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20 m-[4rem]">
              {/* Back Button */}
              <button 
                onClick={() => navigate(-1)} 
                className="absolute -top-4 -left-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group"
              >
                <svg className="w-8 h-8 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2">
                  <span className="text-5xl font-black text-white">Fresh</span>
                  <span className="text-5xl font-black" style={{color: '#437057'}}>Nest</span>
                </div>
                <div className="mt-4">
                  <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                  <p className="text-gray-300 text-lg">Sign in to your account</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tab Switcher */}
                <div className="flex rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm">
                  <button 
                    type="button" 
                    className="flex-1 py-4 text-lg font-semibold transition-all duration-300 text-white shadow-lg"
                    style={{backgroundColor: '#437057'}}
                  >
                    Sign In
                  </button>
                  <button 
                    type="button" 
                    className="flex-1 py-4 text-lg font-semibold transition-all duration-300 bg-transparent text-gray-300 hover:text-white" 
                    onClick={() => navigate(role === 'retailer' ? '/retailer-signup' : '/signup')}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      style={{focusRingColor: '#437057'}}
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {errors.email && (
                    <div className="text-red-300 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      style={{focusRingColor: '#437057'}}
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  {errors.password && (
                    <div className="text-red-300 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </div>
                  )}
                </div>

                {serverError && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-200 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {serverError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-white hover:text-gray-300 transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{backgroundColor: '#437057', focusRingColor: '#437057'}}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
                  </div>
                </div>

                <SimpleGoogleAuth />

                <div className="text-center">
                  <p className="text-gray-300">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate(role === 'retailer' ? '/retailer-signup' : '/signup')}
                      className="text-white hover:text-gray-300 font-semibold underline"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="hidden lg:block relative">
            <div className="relative h-full min-h-[600px] rounded-3xl overflow-hidden">
                 <img
                src={img1}
                alt="Fresh produce and groceries"
                className="w-full h-full object-cover"
              />
              
             
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              


              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Welcome Back to FreshNest
                </h2>
                                 <p className="text-emerald-200 text-lg mb-6">
                   Access your dashboard, manage your inventory, and keep your business running smoothly.
                 </p>
                 <div className="flex items-center space-x-4">
                   <div className="flex -space-x-2">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="w-8 h-8 bg-emerald-400 rounded-full border-2 border-white"></div>
                     ))}
                   </div>
                   <span className="text-emerald-200 text-sm">Trusted by 10,000+ users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login; 
