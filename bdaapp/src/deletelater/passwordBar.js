import React, { useState } from 'react';
import './styling.css';

function PasswordBar() {
  const [password, setPassword] = useState('');

  const calculateStrength = (pass) => {
    if (!pass) return 'empty';
    if (pass.length < 6) return 'weak';
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/) && pass.length >= 8) return 'strong';
    return 'medium';
  };

  const strength = calculateStrength(password);

  return (
    <div className='container'>
      <div className='input-wrapper'>
        <input
          className='input'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className={`strength-bar ${strength}`}></div>
      </div>
      {strength !== 'empty' && (
        <div className={`strength-text ${strength}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </div>
      )}
    </div>
  );
}

export default PasswordBar;
