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
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/retailer-signup" element={<RetailerSignup />} />
      </Routes>
    </Router>
  );
}
