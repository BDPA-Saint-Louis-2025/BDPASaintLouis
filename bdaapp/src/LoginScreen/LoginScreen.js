import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen() {

//Variables to make check box work (visually)
  const [isChecked, setIsChecked] = useState(false);
  const handleOnChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className='container'>
      <h1 className='header'>Welcome Back!</h1>

      {/*Makes the text input boxes */}
      <div className='inputs'>
        <input
         className='input'
         type='email' 
         placeholder='Email'
         style={{border: '2px solid black', fontSize: 20}}
        /> 
        <input 
         className='input' 
         type='password' 
         placeholder='Password'
         style={{border: '2px solid black', fontSize: 20}}
        />
      </div>

      {/*Makes remember me text and its check box */}
      <div className='rememberMe'> 
        <input 
         type='checkbox'
         checked={isChecked}
         onChange={handleOnChange}
        />
        Remember me
      </div>

      {/*Right now this button is just decoration */}
      <div className='Login' style={{border: '2px solid black'}}> Login </div>

    </div>
  );
};

export default LoginScreen;