import React, { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from "../api";
import img1 from "../assets/img1.jpg";

function validateEmail(email) {
  if (!email || email.trim() === "") return "Email is required";
  if (email.includes(" ")) return "Email cannot contain spaces";
  const emailRegex = /^[a-z][a-z0-9]*(?:[-][a-z0-9]+)*@(gmail\.com|mca\.ajce\.in|yahoo\.com)$/;
  if (!emailRegex.test(email)) return "Enter a valid email address (gmail.com, mca.ajce.in, or yahoo.com only)";
  return "";
}

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

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        if (data.emailNotVerified) {
          setServerError("Please verify your email address before logging in. Check your inbox for the verification link.");
        } else {
          setServerError(data.error || "Login failed");
        }
      } else {
        console.log("Login response:", data);
        console.log("User role:", data.user?.role);
        alert("Login successful!");
        // Redirect based on user role with a small delay
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
      }
    } catch (err) {
      setLoading(false);
      setServerError("Server error. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen" style={{backgroundImage: "url('https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1500&q=80')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-md z-0" />
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px) saturate(180%)'}}>
        {/* Back Arrow */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 text-white text-2xl bg-black/30 rounded-full p-1 hover:bg-green-700 transition z-20">
          &#8592;
        </button>
        {/* Left: Login Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <div className="mb-8 flex items-center justify-center">
          <span
  className="text-4xl font-extrabold select-none tracking-normal"
  style={{
    fontFamily: "'Inter', sans-serif",
    color: '#79c9b3ff', // Tailwind's emerald-900
  }}
>
  <span className="text-green-600">Fresh</span>
  <span className="text-gray-900">Nest</span>
</span>


          </div>
          <h2 className="text-2xl font-bold mb-2 text-white text-center">Welcome Back</h2>
          <p className="text-gray-200 mb-6 text-center">Please enter your details</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex rounded-lg overflow-hidden border border-green-300 mb-2">
              <button type="button" className={`flex-1 py-2 text-lg font-semibold ${window.location.pathname === "/login" ? "bg-green-500 text-white" : "bg-transparent text-green-200"}`}>Sign In</button>
              <button type="button" className={`flex-1 py-2 text-lg font-semibold ${window.location.pathname === "/signup" ? "bg-green-500 text-white" : "bg-transparent text-green-200"}`} onClick={() => navigate(role === 'retailer' ? '/retailer-signup' : '/signup')}>Signup</button>
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="email  your@email.com"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="text-red-400 text-sm mt-1">{errors.email}</div>}
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <div className="text-red-400 text-sm mt-1">{errors.password}</div>}
            </div>
            {serverError && <div className="text-red-400 text-sm mt-1">{serverError}</div>}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-green-300 hover:text-green-100 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition" disabled={loading}>
              {loading ? "Logging in..." : "Continue"}
            </button>
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-green-300"></div>
              <span className="mx-2 text-green-200">Or Continue With</span>
              <div className="flex-grow border-t border-green-300"></div>
            </div>
            <div className="flex justify-center mb-2">
              <button type="button" className="flex items-center gap-2 border border-green-300 rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 transition">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" className="w-5 h-5" />
                <span className="text-white">Continue with Google</span>
              </button>
            </div>
          </form>
          <p className="mt-4 text-sm text-green-200 text-center">
            Join the smart grocery revolution. Log in to manage your inventory, track orders, and keep your produce fresh!
          </p>
          <p className="mt-4 text-sm text-green-200 text-center">
            Don't have an account?{' '}
            <button
              onClick={() => navigate(role === 'retailer' ? '/retailer-signup' : '/signup')}
              className="text-green-400 underline"
            >
              Sign up
            </button>
          </p>
        </div>
        {/* Right: Image and CTA */}
        <div className="hidden md:block flex-1 relative min-h-[400px]">
          <img
            src={img1}
            alt="Warehouse with white and brown labeled boxes"
            className="absolute inset-0 w-full h-full object-cover rounded-r-2xl"
          />
          <div className="absolute inset-0 bg-black/40 rounded-r-2xl" />
          <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
            <h2 className="text-white text-2xl font-bold mb-2 drop-shadow">Keep your produce fresh, always.</h2>
            <p className="text-white text-sm">Sign up for free and enjoy access to all FreshNest features for 30 days. No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
