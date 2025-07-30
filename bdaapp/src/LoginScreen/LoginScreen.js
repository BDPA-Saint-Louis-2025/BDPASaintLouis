import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginScreen.css';

import myImage from '../LoginScreen/bdpaLogo.png'; // Ensure the path is correct

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const imageStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '50px',
    height: '50px',
    zIndex: 9999,
  };

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOnChange = () => setIsChecked(!isChecked);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid login");
      } else {
        const storage = isChecked ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("username", data.user.username);

        alert(`Welcome back, ${data.user.username}!`);
        navigate("/explorer");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="page-container">
       
        
      <h1 className="header1">Welcome Back!</h1>
      <div className="signup-container">
        
        <div className="left-column">
          <form className="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="inputs">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="inputs">
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="rememberMe">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleOnChange}
              />
              Remember me
            </div>
            <button type="submit">Login</button>
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          </form>

          <p className="or-separator">OR</p>

          <Link to="/public-explorer" className="guest-btn">
            Continue as Guest
          </Link>

          <div className="theme-login-row">
            <Link to="/signup" className="link-option">
              Don't have an account? Sign Up
            </Link>
            <button className="primary-btn" onClick={toggleTheme}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>

        <div className="right-column">
          {/* Optional image or content */}
          <img src={myImage} alt="Top Right Icon" style={imageStyle} />
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
