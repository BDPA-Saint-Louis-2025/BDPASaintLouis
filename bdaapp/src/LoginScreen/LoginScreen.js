import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginScreen.css';
import myImage from '../LoginScreen/bdpaLogo.png';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [randomNum1, setRandomNum1] = useState(0);
  const [randomNum2, setRandomNum2] = useState(0);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false); // To toggle CAPTCHA modal
  const [shakeCaptcha, setShakeCaptcha] = useState(false); // To control shake animation
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Generate two random numbers between 1 and 10 when the component loads
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setRandomNum1(num1);
    setRandomNum2(num2);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOnChange = () => setIsChecked(!isChecked);

  // Show the CAPTCHA modal when the login button is clicked
  const handleLogin = async () => {
    setShowCaptcha(true); // Show the CAPTCHA modal first
  };

  // Validate CAPTCHA and proceed with login if correct
  const validateCaptcha = () => {
    const sum = randomNum1 + randomNum2;
    if (parseInt(captchaAnswer) === sum) {
      setIsCaptchaVerified(true);
      setShowCaptcha(false); // Hide CAPTCHA once verified
      proceedWithLogin();
    } else {
      setError('Incorrect CAPTCHA answer, please try again.');
      setShakeCaptcha(true); // Trigger the shake animation
      setTimeout(() => setShakeCaptcha(false), 500); // Stop shaking after a short duration
    }
  };

  // Proceed with login after CAPTCHA is solved correctly
  const proceedWithLogin = async () => {
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

      alert(`Welcome back, ${data.user.username}!`);
      navigate("/explorer");
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  return (
    <div className="page-container">

      <div className="bar">
                  <img src={myImage} alt="Top Right Icon" className='imgStyle'/>
          <ul>
          <Link to="/login" style={{color: '#fff'}}><li>Login </li> </Link>
         <Link to="/signup" style={{color: '#fff'}}> <li> Sign Up</li> </Link> 
          <Link to="/explorer" style={{color: '#fff'}}><li> File Explorer</li> </Link>
      
          </ul>
      
      
          </div>
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
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            <img src={myImage} alt="Top Right Icon" style={{ position: 'fixed', top: '10px', right: '10px', width: '50px', height: '50px', zIndex: 9999 }} />
          </div>
        </div>

        {/* CAPTCHA Modal */}
        {showCaptcha && (
          <div className="modal-overlay">
            <div className={`modal-content ${shakeCaptcha ? 'shake' : ''}`}>
              <div className="modal-header">
                <h3>CAPTCHA</h3>
              </div>
              <p>What is {randomNum1} + {randomNum2}?</p>
              <input
                type="text"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Enter the answer"
              />
              {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
              <div className="modal-actions">
                <button onClick={validateCaptcha} className="primary-btn">Verify</button>
                <button className="cancel" onClick={() => setShowCaptcha(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;
