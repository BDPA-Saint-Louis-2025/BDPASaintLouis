import React, { useState } from 'react';

function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  const handleRecover = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) return setMessage(data.message || 'Recovery failed');
      setSent(true);
      setMessage(data.message || 'Recovery link sent');
    } catch {
      setMessage('Network error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Recover Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleRecover} style={{ marginLeft: '10px' }}>
        Send Recovery Link
      </button>
      {message && <p>{message}</p>}
      {sent && <p>Check console for your reset link.</p>}
    </div>
  );
}

export default RecoverPassword;
