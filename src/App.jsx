import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import AdminTestPage from './components/AdminTestPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RetailerDashboard from './components/RetailerDashboard';

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
  // You should replace this with your actual user state logic (e.g. Context, Redux, etc.)
  const [user, setUser] = useState(null);
  const handleLogout = () => setUser(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/retailer-signup" element={<RetailerSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/retailer/dashboard" element={<RetailerDashboard user={user} onLogout={handleLogout} />} />
        <Route path="/admin/test" element={<AdminTestPage />} />
      </Routes>
    </Router>
  );
}
