import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import img1 from "../assets/img1.jpg";

// Validation functions
function validateFullName(fullName) {
  if (!fullName || fullName.trim() === "") return "Full Name is required";
  if (fullName.charAt(0) === " ") return "Full Name cannot start with a space";
  if (/[0-9]/.test(fullName)) return "Numbers are not allowed in the name";
  if (!/^[A-Z]/.test(fullName)) return "First letter of Full Name must be capital";
  
  const validNameRegex = /^[a-zA-Z' ]+$/;
  if (!validNameRegex.test(fullName) || /\s{2,}/.test(fullName)) {
    return "Full Name should only contain letters, and single spaces";
  }
  
  const regSpecialChars = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
  if (regSpecialChars.test(fullName)) return "Special characters are not allowed in the name";
  
  return "";
}

function validateEmail(email) {
  if (!email || email.trim() === "") return "Email is required";
  if (email.includes(" ")) return "Email cannot contain spaces";
  const emailRegex = /^[a-z][a-z0-9]*(?:[-][a-z0-9]+)*@(gmail\.com|mca\.ajce\.in|yahoo\.com)$/;
  if (!emailRegex.test(email)) return "Enter a valid email address (gmail.com, mca.ajce.in, or yahoo.com only)";
  return "";
}

function validatePhone(phone) {
  if (!phone || phone.trim() === "") return "Phone number is required";
  const phoneRegex = /^(\+91[6-9][0-9]{9}|[6789][0-9]{9})$/;
  if (!phoneRegex.test(phone)) return "Enter a valid phone number";
  
  const repeatingDigitsRegex = /(\d)\1{9}/;
  if (repeatingDigitsRegex.test(phone)) return "Phone number cannot contain repeating digits";
  
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

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || confirmPassword.trim() === "") return "Confirm Password is required";
  if (confirmPassword !== password) return "Passwords do not match";
  return "";
}

export default function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
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
    setErrors({ ...errors, [name]: "" });
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
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
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName: form.fullName,
          email: form.email, 
          phone: form.phone,
          password: form.password 
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setServerError(data.error || "Signup failed");
      } else {
        alert("Signup successful!");
        navigate("/login");
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
        {/* Left: Signup Form */}
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
          <h2 className="text-2xl font-bold mb-2 text-white text-center">Sign Up</h2>
          <p className="text-gray-200 mb-6 text-center">Create your account to join the smart grocery revolution!</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <div className="text-red-400 text-sm mt-1">{errors.fullName}</div>}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="text-red-400 text-sm mt-1">{errors.email}</div>}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="text-red-400 text-sm mt-1">{errors.phone}</div>}
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
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full px-3 py-2 border rounded bg-white/20 border-green-300 text-white placeholder-green-200 focus:outline-none"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="text-red-400 text-sm mt-1">{errors.confirmPassword}</div>}
            </div>
            <label className="flex items-center text-sm text-green-200">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                required
                className="mr-2 accent-green-500"
              />
              I agree to the <a href="#" className="underline text-green-400 ml-1">Terms and Conditions</a>
            </label>
            {serverError && <div className="text-red-400 text-sm mt-1">{serverError}</div>}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
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
} 