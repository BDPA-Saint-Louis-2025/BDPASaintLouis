import React, { useState, useEffect } from 'react';
import './SignUpForm.css';
import { useNavigate, Link } from 'react-router-dom';
import myImage from '../LoginScreen/bdpaLogo.png'; // Adjust path as needed

const SignUpForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [randomNum1, setRandomNum1] = useState(0);
  const [randomNum2, setRandomNum2] = useState(0);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false); // To toggle CAPTCHA modal
  const [shakeCaptcha, setShakeCaptcha] = useState(false); // To control shake animation

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  const imageStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '50px',
    height: '50px',
    zIndex: 1,
    pointerEvents: 'none', // make sure this never blocks clicks
  };

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Basic password strength check
  const isStrongPassword = (pw) => {
    return (
      pw.length >= 11 &&
      /[A-Za-z]/.test(pw) &&
      /\d/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw) // must have special char
    );
  };

  // Generate two random numbers between 1 and 10 when the component loads
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setRandomNum1(num1);
    setRandomNum2(num2);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const u = username.trim();
    const em = email.trim();
    const pw = password;

    if (!u || !em || !pw || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }
    if (pw !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isStrongPassword(pw)) {
      setError('Password must be at least 11 characters and include letters, numbers, and a special character.');
      return;
    }

    setShowCaptcha(true); // Show the CAPTCHA modal first
  };

  // Validate CAPTCHA and proceed with login if correct
  const validateCaptcha = () => {
    const sum = randomNum1 + randomNum2;
    if (parseInt(captchaAnswer) === sum) {
      setIsCaptchaVerified(true);
      setShowCaptcha(false); // Hide CAPTCHA once verified
      proceedWithSignUp();
    } else {
      setError('Incorrect CAPTCHA answer, please try again.');
      setShakeCaptcha(true); // Trigger the shake animation
      setTimeout(() => setShakeCaptcha(false), 500); // Stop shaking after a short duration
    }
  };

  // Proceed with login after CAPTCHA is solved correctly
  const proceedWithSignUp = async () => {
    const u = username.trim();
    const em = email.trim();
    const pw = password;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // uncomment if your backend uses cookies/sessions
        body: JSON.stringify({ username: u, email: em, password: pw }),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { _raw: text }; }

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
          (typeof data?._raw === 'string' && data._raw.slice(0, 200)) ||
          `Registration failed (HTTP ${res.status})`;
        setError(msg);
        return;
      }

      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user)  localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess('Registered successfully!');
      navigate('/explorer');
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
            <div className="bar">
            <img src={myImage} alt="Top Right Icon" className="imgStyle" />
            <ul>
            <Link to='/signup' style={{color: '#fff'}}><li> Sign Up </li></Link>
            <Link to='/login' style={{color: '#fff'}}><li>Login</li></Link>
            <Link to='/' style={{color: '#fff'}}><li> Question Viewer</li></Link>
            </ul>
            </div>
      <h1 className="header1">Create an Account</h1>

      <div className="signup-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="left-column">
          <form onSubmit={handleSubmit} className="form" style={{ position: 'relative', zIndex: 1 }}>
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
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                autoComplete="new-password"
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
                autoComplete="new-password"
              />
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontSize: '14px' }}>{success}</p>}

            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {isSubmitting ? 'Signing Up…' : 'Sign Up'}
            </button>
          </form>

          <p className="or-separator">OR</p>

          <Link to="/public-explorer" className="guest-btn" style={{ position: 'relative', zIndex: 1 }}>
            Continue as Guest
          </Link>

          <div className="login-theme-row">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link-option">Log In</Link>
            </p>
            <button className="primary-btn" onClick={toggleTheme}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
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
};

export default SignUpForm;
