import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';

const Register = () => {
  const [username, setUsername] = useState('');
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
      
      // Make the API Call
      const { data } = await axios.post(
        "/api/users/register", // Uses the proxy we set up
        { name: username, email, password },
        config
      );

      console.log('Registration Successful:', data);
      
      // Save user to local storage and Context
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      navigate('/'); // Go to Home
    } catch (error) {
      console.error('Error:', error.response.data.message);
      alert("Error: " + error.response.data.message); // Simple alert for now
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
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
          <button type="submit" className="auth-button">Create Account</button>
        </form>
        <div className="auth-link">
          Already have an account?
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;