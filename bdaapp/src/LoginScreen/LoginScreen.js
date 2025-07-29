import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginScreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        console.log('Saved token:', data.token);
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className='container'>
      <h1 className='header'>Welcome Back!</h1>

      <div className='inputs'>
        <input
          className='input'
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className='input'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Link to="/signup" className='signupLink'>
        Don't have an account? Sign up
      </Link>

      <div className='rememberMe'>
        <input type='checkbox' checked={isChecked} onChange={handleOnChange} /> Remember me
      </div>

      <div className='Login' onClick={handleLogin}>
        Login
      </div>

      {/* Guest Button */}
      <Link to="/public-explorer" className="guest-btn">
        Continue as Guest
      </Link>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default LoginScreen;
