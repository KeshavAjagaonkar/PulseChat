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

  // FIX 2: Ensure state stays in sync on load
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
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