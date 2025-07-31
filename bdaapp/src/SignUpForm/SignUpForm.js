import React, { useState, useEffect } from 'react';
import './SignUpForm.css';
import { useNavigate, Link } from 'react-router-dom';

const SignUpForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

    const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        navigate("/explorer");
        setError('');
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="page-container">
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

          <Link to="/public-explorer" className="guest-btn">
            Continue as Guest
          </Link>

          <div className="login-theme-row">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link-option">Log In</Link>
            </p>
            <button className="primary-btn" onClick={toggleTheme}>
              {theme === 'light' ? ' Dark' : ' Light'}
            </button>
          </div>
        </div>

        <div className="right-column">
          {/* You can place an image or branding content here */}
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
