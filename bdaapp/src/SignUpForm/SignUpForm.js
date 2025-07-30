import React, { useState, useEffect } from 'react';
import './SignUpForm.css';
import { useNavigate, Link } from 'react-router-dom';
import myImage from '../LoginScreen/bdpaLogo.png'; // Ensure the path is correct

const SignUpForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showPopup, setShowPopup] = useState(false);

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

  const passwordStrength = (pw) => {
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    const isAlphanumeric = /^[\w\-]+$/.test(pw); // alphanumeric with - and _
    if (pw.length < 11 || !hasSpecial || !isAlphanumeric) return 'weak';
    if (pw.length >= 17) return 'strong';
    return 'moderate';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const strength = passwordStrength(password);
    if (strength === 'weak') {
      setShowPopup(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess("Registered successfully!");
        setError('');
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="page-container">
      <img src={myImage} alt="Top Right Icon" style={imageStyle} />
      <h1 className="header1">Create an Account</h1>
      <div className="signup-container">
        <div className="left-column">
          <form onSubmit={handleSubmit} className="form">
            <div className="inputs">
              <input
                className="input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
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
            <div className="inputs">
              <input
                className="input"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontSize: '14px' }}>{success}</p>}
            <button type="submit">Sign Up</button>
          </form>

          <p className="or-separator">OR</p>

          <Link to="public-explorer" className="guest-btn">
            Continue as Guest
          </Link>

          <div className="theme-login-row">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link-option">Log In</Link>
            </p>
            <button className="primary-btn" onClick={toggleTheme}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>

        <div className="right-column">
          {/* Optional image or promo */}
        </div>
      </div>

      {/* Password Popup Modal */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Password Requirements</h3>
            <ul className="password-instructions">
              <li>Password must be at least 11 characters (moderate).</li>
              <li>Above 17 characters is strong.</li>
              <li>Must be alphanumeric (dashes and underscores allowed).</li>
              <li>Password must include special characters.</li>
            </ul>
            <button onClick={() => setShowPopup(false)} className="try-again-btn">Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
};



export default SignUpForm;
