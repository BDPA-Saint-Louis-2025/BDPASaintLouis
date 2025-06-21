import React, { useState } from 'react';
import './SignUpForm.css';

const SignUpForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGuest = () => {
    alert('Continue as Guest clicked');
  };

  const handleLogin = () => {
    alert('Login clicked');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted');
  };

  const calculateStrength = (pass) => {
    if (!pass) return 'empty';
    if (pass.length < 6) return 'weak';
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/) && pass.length >= 8) return 'strong';
    return 'medium';
  };

  const passwordStrength = calculateStrength(password);
  const confirmStrength = calculateStrength(confirmPassword);

  return (
    <div className="page-container">
      <h1 className="header1">Welcome!</h1>

      <div className="signup-container">
        <div className="right-column">
          <h2 className="header2">Sign Up</h2>
          <form onSubmit={handleSubmit}>

            <div className="inputs">
              <input className="input" placeholder="Username" />
            </div>

            <div className="inputs">
              <input className="input" type="email" placeholder="Email" />
            </div>

            {/* Password Field */}
            <div className="inputs">
              <input
                className={`input ${passwordStrength}`}
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className={`strength-bar ${passwordStrength}`}></div>
            </div>

            {/* Confirm Password Field */}
            <div className="inputs">
              <input
                className={`input ${confirmStrength}`}
                type="password"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className={`strength-bar ${confirmStrength}`}></div>
            </div>

            <br />
            <button type="submit">Submit</button>
          </form>
        </div>

        <div className="or-separator">
          <span>OR</span>
        </div>

        <div className="left-column">
          <a href="#" onClick={handleGuest} className="link-option">Continue as Guest</a>
          <a href="#" onClick={handleLogin} className="link-option">Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
