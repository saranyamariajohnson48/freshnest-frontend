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
import ClerkAuthHandler from './components/ClerkAuthHandler';
import ClerkTest from './components/ClerkTest';
import GoogleAuthDiagnostic from './components/GoogleAuthDiagnostic';
import ClerkDiagnostic from './components/ClerkDiagnostic';
import ClerkTestPage from './components/ClerkTestPage';
import SignOutHelper from './components/SignOutHelper';
import ClerkAuthWrapper from './components/ClerkAuthWrapper';
import GoogleRoleSelectionPage from './components/GoogleRoleSelectionPage';
import ValidationTest from './components/ValidationTest';
import TestStaffAPI from './components/TestStaffAPI';
import TokenDebug from './components/TokenDebug';
import StaffDashboard from './components/StaffDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import ProductSelector from './components/ProductSelector';
import SupplierOnboardingPublic from './components/SupplierOnboardingPublic';
import InvoicePreview from './components/InvoicePreview';
import SalaryInvoicePreview from './components/SalaryInvoicePreview';

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
          <ClerkAuthWrapper>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/retailer-signup" element={<RetailerSignup />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth-handler" element={<ClerkAuthHandler />} />
          <Route path="/clerk-test" element={<ClerkTest />} />
          <Route path="/google-diagnostic" element={<GoogleAuthDiagnostic />} />
          <Route path="/clerk-diagnostic" element={<ClerkDiagnostic />} />
          <Route path="/clerk-test-page" element={<ClerkTestPage />} />
          <Route path="/sign-out" element={<SignOutHelper />} />
          <Route path="/google-role-selection" element={<GoogleRoleSelectionPage />} />
          <Route path="/validation-test" element={<ValidationTest />} />
          <Route path="/test-staff-api" element={<TestStaffAPI />} />
          <Route path="/token-debug" element={<TokenDebug />} />
          <Route path="/products/select" element={<ProductSelector />} />
          <Route path="/supplier-onboarding" element={<SupplierOnboardingPublic />} />
          <Route path="/invoice/preview" element={<InvoicePreview />} />
          <Route path="/salary-invoice/preview" element={<SalaryInvoicePreview />} />
          
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

          <Route path="/staff/dashboard" element={
            <ProtectedRoute requiredRoles={['staff', 'Staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          <Route path="/supplier/dashboard" element={
            <ProtectedRoute requiredRoles={['supplier', 'Supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          } />

          {/* Legacy route for testing */}
          <Route path="/admin/test" element={<AdminTestPage />} />
            </Routes>
          </ClerkAuthWrapper>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
