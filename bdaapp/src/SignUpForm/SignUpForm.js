import React from 'react';
import './SignUpForm.css';

const SignUpForm = () => {
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

  return (
    <div className="page-container">
      <h1 className="header1">Welcome!</h1>

<div className="signup-container">

  {/* Left Column */}
  <div className="right-column">
    <h2 className="header2">Sign Up</h2>
    <form onSubmit={handleSubmit}>
      <div className="inputs">
        <input className="input" placeholder="Username" />
      </div>
      <div className="inputs">
        <input className="input" type="email" placeholder="Email" />
      </div>
      <div className="inputs">
        <input className="input" type="password" placeholder="Password" />
      </div>
      <div className="inputs">
        <input className="input" type="password" placeholder="Confirm Password" />
      </div>
      <br />
      <button type="submit">Submit</button>
    </form>
  </div>

  {/* OR Separator */}
  <div className="or-separator">
    <span>OR</span>
  </div>

  {/* Right Column */}
<div className="left-column">
  <a href="#" onClick={handleGuest} className="link-option">Continue as Guest</a>
  <a href="#" onClick={handleLogin} className="link-option">Login</a>
</div>

</div>

    </div>
  );
};

export default SignUpForm;
