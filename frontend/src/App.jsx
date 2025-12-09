import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'

import Login from './pages/Login';
import Register from './pages/Register';
import HomeLayout from './pages/HomeLayout';

const App = () => {
  // FIX 1: Initialize state based on localStorage presence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? true : false;
  });

  // FIX 2: Ensure state stays in sync on load and when storage changes
  useEffect(() => {
    const checkAuth = () => {
      const userInfo = localStorage.getItem("userInfo");
      setIsAuthenticated(!!userInfo);
    };

    // Check on mount
    checkAuth();

    // Apply saved theme settings on mount
    const savedSettings = localStorage.getItem('pulsechat_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        // Apply accent color
        if (settings.accentColor) {
          document.documentElement.style.setProperty('--accent-color', settings.accentColor);
        }
        // Apply theme (dark/light)
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    } else {
      // Default to dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for storage changes (e.g., logout from another tab)
    window.addEventListener('storage', checkAuth);

    // Also check periodically to catch logout from same tab
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Home Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeLayout />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;