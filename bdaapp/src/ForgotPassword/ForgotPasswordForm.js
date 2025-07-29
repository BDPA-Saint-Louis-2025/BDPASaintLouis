import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Validate the token on mount
    const validate = async () => {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`);
      const data = await res.json();
      if (res.ok) {
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Password reset successfully. You can now log in.');
      navigate('/login');
    } else {
      alert(data.message);
    }
  };

  if (status === 'invalid') {
    return <div style={{ padding: 20 }}><h2>Invalid or expired link</h2></div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
