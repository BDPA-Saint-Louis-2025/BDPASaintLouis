import React, { useEffect, useState } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import './Dashboard.css';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const [message, setMessage] = useState('');

  // Bio
  const [bio, setBio] = useState('');
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [newBio, setNewBio] = useState('');

  // Modal states
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form values
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation flags
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakeUsername, setShakeUsername] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setUserInfo(data);
        setBio(data.bio || '');
      } catch {
        setUserInfo(null);
      }
    };

const fetchStorage = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/files/storage', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      setStorageUsed(data.totalSize || 0);
    } else {
      console.error(data.message);
    }
  } catch (err) {
    console.error('Error fetching storage:', err);
  }
};


    fetchUser();
    fetchStorage();
  }, [token]);

  /** VALIDATIONS **/
  const isValidUsername = (username) => /^[a-zA-Z0-9-_]+$/.test(username);
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const hasSpecialChar = (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isAlphanumericWithDashes = (password) =>
    /^[a-zA-Z0-9-_!@#$%^&*(),.?":{}|<>]+$/.test(password);

  const passwordStrength = (password) => {
    if (!hasSpecialChar(password) || !isAlphanumericWithDashes(password)) return 'invalid';
    if (password.length > 17) return 'strong';
    if (password.length > 10) return 'moderate';
    return 'weak';
  };

  /** Reload User Info **/
  const reloadUserInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: token },
      });
      const data = await res.json();
      setUserInfo(data);
      setBio(data.bio || '');
    } catch {}
  };

  /** USERNAME **/
 const handleUpdateUsername = async () => {
  if (!isValidUsername(newUsername)) {
    setShakeUsername(true);
    setTimeout(() => setShakeUsername(false), 500);
    return setMessage('Username must be alphanumeric (dashes and underscores allowed).');
  }

  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const res = await fetch('http://localhost:5000/api/auth/username', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify({ username: newUsername }),
    });

    console.log(`Bearer token used: ${token}`);
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message || 'Username updated');
      setIsUsernameModalOpen(false);
      reloadUserInfo();
    } else {
      setMessage(data.message || 'Username update failed');
    }
  } catch (err) {
    setMessage('Username update failed');
  }
};


  /** EMAIL **/
const handleUpdateEmail = async (newEmail) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  console.log("TOKEN BEING SENT: Bearer " + token);

  if (!token) {
    console.error("❌ No token provided to handleUpdateEmail");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/email", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: newEmail }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ Email updated:", data.message);
    } else {
      console.error("❌ Error updating email:", data.message || data.error);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
  }
};



  /** PASSWORD **/
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword || passwordStrength(newPassword) === 'weak' || passwordStrength(newPassword) === 'invalid') {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
      return setMessage('Password must meet all requirements.');
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await fetch('http://localhost:5000/api/auth/password', {
        method: 'PATCH',
        headers: {
      'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      setMessage(data.message || 'Password updated');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage('Password update failed');
    }
  };

  /** BIO **/
  const handleUpdateBio = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await fetch('http://localhost:5000/api/auth/bio', {
        method: 'PATCH',
        headers: {
           'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ bio: newBio }),
      });
      const data = await res.json();
      setMessage(data.message || 'Bio updated');
      setIsBioModalOpen(false);
      reloadUserInfo();
    } catch {
      setMessage('Bio update failed');
    }
  };

  /** DELETE ACCOUNT **/
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
console.log("Loaded token:", localStorage.getItem("token") || sessionStorage.getItem("token"));

  return (
    <div className="drive-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <nav className="nav">
          <button onClick={() => (window.location.href = '/explorer')}>
            <HomeIcon /> My Drive
          </button>
          <button onClick={() => (window.location.href = '/recent')}>
            <AccessTimeIcon /> Recent
          </button>
          <button onClick={() => (window.location.href = '/shared')}>
            <PeopleAltIcon /> Shared with me
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="active">
            <DashboardIcon /> Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="content">
        <h2>Dashboard</h2>
        <p><strong>Username:</strong> {userInfo.username}</p>
        <p><strong>Email:</strong> {userInfo.email}</p>
        <p><strong>Bio:</strong> {bio || 'No bio set.'}</p>
        <p><strong>Storage Used:</strong> {storageUsed} bytes</p>

        {/* Horizontal Buttons */}
        <div className="button-row">
          <button className="primary-btn" onClick={() => setIsUsernameModalOpen(true)}>Edit Username</button>
          <button className="primary-btn" onClick={() => setIsEmailModalOpen(true)}>Edit Email</button>
          <button className="primary-btn" onClick={() => setIsPasswordModalOpen(true)}>Edit Password</button>
          <button className="primary-btn" onClick={() => setIsBioModalOpen(true)}>Edit Bio</button>
        </div>

        <div className="section danger-zone">
          <h3>Danger Zone</h3>
          <button onClick={handleDeleteAccount} className="danger-btn">
            Delete My Account
          </button>
        </div>

        {message && <p className="success-message">{message}</p>}
      </main>

      {/* MODALS */}
      {isUsernameModalOpen && (
        <Modal title="Edit Username" onClose={() => setIsUsernameModalOpen(false)}>
          <input
            type="text"
            className={shakeUsername ? 'shake' : ''}
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <small>Must be alphanumeric (dashes and underscores allowed).</small>
          <div className="modal-actions">
            <button onClick={handleUpdateUsername}>Save</button>
            <button className="cancel" onClick={() => setIsUsernameModalOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {isEmailModalOpen && (
        <Modal title="Edit Email" onClose={() => setIsEmailModalOpen(false)}>
          <input
            type="email"
            className={`${!isEmailValid ? 'invalid-input' : ''} ${shakeEmail ? 'shake' : ''}`}
            placeholder="Enter new email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          {!isEmailValid && <div className="error-message">Invalid email. Try again with a real email.</div>}
          <div className="modal-actions">
                <button onClick={() => handleUpdateEmail(newEmail)}>Save</button>

                   <button className="cancel" onClick={() => setIsEmailModalOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {isPasswordModalOpen && (
        <Modal title="Edit Password" onClose={() => setIsPasswordModalOpen(false)}>
          <ul className="password-instructions">
            <li>Password must be at least 11 characters (moderate).</li>
            <li>Above 17 characters is strong.</li>
            <li>Must be alphanumeric (dashes and underscores allowed).</li>
            <li>Password must include special characters.</li>
          </ul>
          <input
            type="password"
            className={shakePassword ? 'shake' : ''}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            className={shakePassword ? 'shake' : ''}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className={`password-strength ${passwordStrength(newPassword)}`}>
            Password strength: {passwordStrength(newPassword)}
          </div>
          <div className="modal-actions">
            <button onClick={handleUpdatePassword}>Save</button>
            <button className="cancel" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {isBioModalOpen && (
        <Modal title="Edit Bio" onClose={() => setIsBioModalOpen(false)}>
          <textarea
            placeholder="Write something about yourself..."
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            rows="4"
          />
          <div className="modal-actions">
            <button onClick={handleUpdateBio}>Save</button>
            <button className="cancel" onClick={() => setIsBioModalOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Dashboard;
