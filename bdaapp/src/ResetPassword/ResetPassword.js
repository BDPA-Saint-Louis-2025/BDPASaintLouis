import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      setMessage(data.message || 'Reset complete');
    } catch {
      setMessage('Network error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="Enter new password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleReset} style={{ marginLeft: '10px' }}>
        Reset
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ResetPassword;
