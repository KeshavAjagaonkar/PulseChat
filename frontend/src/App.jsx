import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'

import Login from './pages/Login';
import Register from './pages/Register';
import HomeLayout from './pages/HomeLayout'; 

const App = () => {
  // 1. STATE: Manage authentication status here
  // Default to false so we see the Login screen first
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Helper function to simulate logging in
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // 2. PROTECTED ROUTE WRAPPER
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };
  
  return (
      <Routes>
        {/* Pass handleLogin to the Login page */}
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
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    
  );
};

export default App;