import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = ChatState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/users/login",
        { email, password },
        config
      );

      console.log('Login Successful:', data);
      
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      // If you kept the onLogin prop from App.js, call it here, 
      // but Context usually handles this.
      if(onLogin) onLogin();
      
      navigate('/');
    } catch (error) {
      console.error('Error:', error.response?.data?.message);
      alert("Invalid Email or Password");
    }
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
        </form>
        <div className="auth-link">
          Don't have an account?
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;