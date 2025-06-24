import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');

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
        localStorage.setItem("token", data.token);
        alert(`Welcome back, ${data.user.username}!`);
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className='container'>
      <h1 className='header'>Welcome Back!</h1>
      <div className='inputs'>
        <input className='input' type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className='input' type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className='rememberMe'>
        <input type='checkbox' checked={isChecked} onChange={handleOnChange} /> Remember me
      </div>
      <div className='Login' style={{ border: '2px solid black' }} onClick={handleLogin}>
        Login
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginScreen;