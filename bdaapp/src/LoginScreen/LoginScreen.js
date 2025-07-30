import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginScreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleOnChange = () => setIsChecked(!isChecked);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
      return;
    }

    const storage = isChecked ? localStorage : sessionStorage;
    storage.setItem("token", data.token);
    storage.setItem("username", data.user.username);

    console.log("Saved token:", data.token);
    alert(`Welcome back, ${data.user.username}!`);
    navigate("/explorer");

  } catch (err) {
    console.error(err);
    setError("Network error");
  }
};


  return (
    <div className="page-container">
      <h1 className="header1">Welcome Back</h1>
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

            <div className="options-row">
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleOnChange}
                />
                Remember Me
              </label>
            </div>
    <p style={{ marginTop: '10px', fontSize: '14px' }}>
    <Link to="/forgot-password" style={{ color: '#007bff', textDecoration: 'underline' }}>
      Forgot your password?
    </Link>
    </p>
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

            <button type="submit">Login</button>
          </form>

          <p className="or-separator">OR</p>

          <Link to="/public-explorer" className="guest-btn">Continue as Guest</Link>

          <div className="login-theme-row">
            <p>
              Don’t have an account?{' '}
              <Link to="/signup" className="link-option">Sign Up</Link>
            </p>
            <button className="primary-btn" onClick={toggleTheme}>
              {theme === 'light' ? ' Dark' : ' Light'}
            </button>
          </div>
        </div>

        <div className="right-column">
          {/* Optionally place image or branding content here */}
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
