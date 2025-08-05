import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import img1 from "../assets/img1.jpg";
import { useToastContext } from "../contexts/ToastContext";
import { 
  validateFullName, 
  validateEmail, 
  validatePhone,
  validatePassword, 
  validateConfirmPassword 
} from "../utils/dynamicValidation";

export default function RetailerSignup() {
  const { success, error } = useToastContext();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
    role: "retailer"
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setServerError("");
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    let error = "";
    
    if (name === "fullName") {
      error = validateFullName(value);
    } else if (name === "email") {
      error = validateEmail(value);
    } else if (name === "phone") {
      error = validatePhone(value);
    } else if (name === "password") {
      error = validatePassword(value);
    } else if (name === "confirmPassword") {
      error = validateConfirmPassword(value, form);
    }
    
    if (error) {
      setErrors({ ...errors, [name]: error });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.confirmPassword, form),
    };
    
    setErrors(newErrors);
    
    // Check if there are any validation errors
    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }
    
    // Check terms agreement
    if (!form.terms) {
      setServerError("You must agree to the Terms and Conditions");
      return;
    }
    
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName: form.fullName,
          email: form.email, 
          phone: form.phone,
          password: form.password,
          role: form.role
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setServerError(data.error || "Signup failed");
        error(data.error || "Signup failed", { duration: 4000 });
      } else {
        success("Registration successful! 🎉 Please check your email for the verification code.", { duration: 4000 });
        setTimeout(() => {
          navigate("/otp-verification", { 
            state: { 
              email: form.email, 
              userType: 'retailer' 
            } 
          });
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setServerError("Server error. Please try again.");
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
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
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
                  <h1 className="text-3xl font-bold text-white mb-2">Retailer Registration</h1>
                  <p className="text-gray-300 text-lg">Join our network and grow your business</p>
                </div>
          </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <div className="relative">
              <input
                type="text"
                name="fullName"
                        placeholder="Business Owner Name"
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        style={{focusRingColor: '#437057'}}
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    {errors.fullName && (
                      <div className="mt-2 text-red-300 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.fullName}
                      </div>
                    )}
            </div>

            <div>
                    <div className="relative">
              <input
                type="email"
                name="email"
                        placeholder="Business Email"
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
                      <div className="mt-2 text-red-300 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.email}
                      </div>
                    )}
            </div>

            <div>
                    <div className="relative">
              <input
                type="tel"
                name="phone"
                        placeholder="Contact Number"
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        style={{focusRingColor: '#437057'}}
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    {errors.phone && (
                      <div className="mt-2 text-red-300 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.phone}
                      </div>
                    )}
            </div>

            <div>
                    <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Password"
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
                      <div className="mt-2 text-red-300 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.password}
                      </div>
                    )}
            </div>

            <div>
                    <div className="relative">
                            <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                style={{focusRingColor: '#437057'}}
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <div className="mt-2 text-red-300 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
            </div>

                <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                    className="mt-1 w-5 h-5 bg-white/10 border-white/20 rounded focus:ring-2"
                    style={{accentColor: '#437057', focusRingColor: '#437057'}}
                  />
                  <label className="text-sm text-gray-300">
                    I agree to the{" "}
                    <a href="#" className="hover:underline font-medium" style={{color: '#437057'}}>
                      Terms and Conditions
                    </a>
            </label>
                </div>

                {serverError && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-200 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {serverError}
                  </div>
                )}

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
                      Registering Business...
                    </div>
                  ) : (
                    "Register Business"
                  )}
                </button>

                <div className="text-center">
                                    <p className="text-gray-300">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="font-semibold hover:underline"
                      style={{color: '#437057'}}
                    >
                      Sign In
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
                alt="Business and retail environment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              


              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Grow Your Business with FreshNest
                </h2>
                                 <p className="text-emerald-200 text-lg mb-6">
                   Access exclusive tools, analytics, and support designed for retailers.
                 </p>
                 <div className="flex items-center space-x-4">
                   <div className="flex -space-x-2">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="w-8 h-8 bg-emerald-400 rounded-full border-2 border-white"></div>
                     ))}
                   </div>
                   <span className="text-emerald-200 text-sm">Join 500+ successful retailers</span>
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
} 
