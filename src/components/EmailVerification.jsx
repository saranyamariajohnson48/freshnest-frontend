import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { FiMail, FiCheck, FiX } from "react-icons/fi";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }
    
    verifyEmail(token);
  }, [searchParams]);
  
  const verifyEmail = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify-email?token=${token}`);
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Server error. Please try again.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === "verifying" && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          )}
          {status === "success" && (
            <FiCheck className="h-16 w-16 text-green-600 mx-auto" />
          )}
          {status === "error" && (
            <FiX className="h-16 w-16 text-red-600 mx-auto" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {status === "verifying" && "Verifying Email..."}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
        </h2>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status === "success" && (
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Continue to Login
          </button>
        )}
        
        {status === "error" && (
          <button
            onClick={() => navigate("/signup")}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Signup
          </button>
        )}
      </div>
    </div>
  );
}