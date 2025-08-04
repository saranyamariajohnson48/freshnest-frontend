import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import AboutSection from './components/AboutSection';
import OrderSection from './components/OrderSection';
import StorySection from './components/StorySection';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import ContactSection from './components/ContactSection';
import RetailerSignup from './components/RetailerSignup';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import AuthMiddleware from './components/AuthMiddleware';
import Dashboard from './components/Dashboard';

import AdminTestPage from './components/AdminTestPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RetailerDashboard from './components/RetailerDashboard';
import OTPVerification from './components/OTPVerification';

function Home() {
  return (
      <div>
      <LandingPage />
      <AboutSection />
      <OrderSection />
      <StorySection />
      <ContactSection />
      <Footer />
      </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/retailer-signup" element={<RetailerSignup />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* JWT Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Role-based Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRoles={['admin', 'Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/user/dashboard" element={
            <ProtectedRoute requiredRoles={['user', 'User']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/retailer/dashboard" element={
            <ProtectedRoute requiredRoles={['retailer', 'Retailer']}>
              <RetailerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Legacy route for testing */}
          <Route path="/admin/test" element={<AdminTestPage />} />
        </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
