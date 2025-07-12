import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [storageUsed, setStorageUsed] = useState(0);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setUserInfo(data);
      } catch {
        setUserInfo(null);
      }
    };

    const fetchStorage = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/files/storage', {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setStorageUsed(data.totalSize || 0);
      } catch {
        setStorageUsed(0);
      }
    };

    fetchUser();
    fetchStorage();
  }, [token]);

  const handleUpdateEmail = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      setMessage(data.message || 'Email updated');
    } catch {
      setMessage('Email update failed');
    }
  };

  const handleUpdatePassword = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      setMessage(data.message || 'Password updated');
    } catch {
      setMessage('Password update failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This will delete your account and all files.')) return;
    try {
      const res = await fetch('http://localhost:5000/api/auth/delete', {
        method: 'DELETE',
        headers: { Authorization: token },
      });
      if (!res.ok) return alert('Failed to delete account.');
      alert('Account deleted.');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch {
      alert('Network error.');
    }
  };

  if (!userInfo) return <p>Loading user data...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <p><strong>Username:</strong> {userInfo.username}</p>
      <p><strong>Email:</strong> {userInfo.email}</p>
      <p><strong>Storage Used:</strong> {storageUsed} bytes</p>

      <div style={{ marginTop: '20px' }}>
        <h3>Update Email</h3>
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button onClick={handleUpdateEmail}>Update Email</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleUpdatePassword}>Change Password</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Danger Zone</h3>
        <button onClick={handleDeleteAccount} style={{ backgroundColor: 'red', color: 'white' }}>
          Delete My Account
        </button>
      </div>

      {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
    </div>
  );
}

export default Dashboard;
