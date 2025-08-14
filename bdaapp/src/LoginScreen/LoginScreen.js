// src/LoginScreen/LoginScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginScreen.css";
import myImage from "../LoginScreen/bdpaLogo.png";
import { authenticate } from "../api/auth";

function LoginScreen() {
  const [username, setUsername] = useState(""); // <-- username instead of email
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [randomNum1, setRandomNum1] = useState(0);
  const [randomNum2, setRandomNum2] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [shakeCaptcha, setShakeCaptcha] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setRandomNum1(Math.floor(Math.random() * 10) + 1);
    setRandomNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const handleOnChange = () => setIsChecked((v) => !v);

  const handleLogin = () => setShowCaptcha(true);

  const validateCaptcha = async () => {
    const sum = randomNum1 + randomNum2;
    if (parseInt(captchaAnswer) !== sum) {
      setError("Incorrect CAPTCHA answer, please try again.");
      setShakeCaptcha(true);
      setTimeout(() => setShakeCaptcha(false), 500);
      return;
    }
    setShowCaptcha(false);
    try {
      setError("");
      await authenticate({ username, password, remember: isChecked });
      alert(`Welcome back, ${username}!`);
      navigate("/"); // go to Buffet
    } catch (e) {
      setError(e.message || "Invalid login");
    }
  };

  return (
    <div className="page-container">
      <h1 className="header1">Welcome Back!</h1>
      <div className="signup-container">
        <div className="left-column">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="inputs">
              <input
                className="input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
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
                autoComplete="current-password"
              />
            </div>

            <div className="options-row">
              <label className="option-item">
                <input type="checkbox" checked={isChecked} onChange={handleOnChange} />
                Remember Me
              </label>
            </div>

            <p style={{ marginTop: "10px", fontSize: "14px" }}>
              <Link to="/forgot-password" style={{ color: "#007bff", textDecoration: "underline" }}>
                Forgot your password?
              </Link>
            </p>

            {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
            <button type="submit">Login</button>
          </form>

          <div className="login-theme-row">
            <p>
              Don’t have an account? <Link to="/signup" className="link-option">Sign Up</Link>
            </p>
            <button className="primary-btn" onClick={toggleTheme}>
              Switch to {theme === "light" ? "Dark" : "Light"} Mode
            </button>

            <div className="bar">
              <img src={myImage} alt="Top Right Icon" className="imgStyle" />
              <ul>
                <Link to="/signup" style={{ color: "#fff" }}>
                  <li> Sign Up </li>
                </Link>
                <Link to="/login" style={{ color: "#fff" }}>
                  <li>Login</li>
                </Link>
                <Link to="/" style={{ color: "#fff" }}>
                  <li> Question Viewer</li>
                </Link>
              </ul>
            </div>
          </div>
        </div>

        {showCaptcha && (
          <div className="modal-overlay">
            <div className={`modal-content ${shakeCaptcha ? "shake" : ""}`}>
              <div className="modal-header">
                <h3>CAPTCHA</h3>
              </div>
              <p>
                What is {randomNum1} + {randomNum2}?
              </p>
              <input
                type="text"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Enter the answer"
              />
              {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
              <div className="modal-actions">
                <button onClick={validateCaptcha} className="primary-btn">
                  Verify
                </button>
                <button className="cancel" onClick={() => setShowCaptcha(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;