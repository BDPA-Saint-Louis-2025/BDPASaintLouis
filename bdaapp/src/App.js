import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginScreen from './LoginScreen/LoginScreen';
import SignUpForm from './SignUpForm/SignUpForm';
import Dashboard from './Dashboard/Dashboard';
import ExplorerView from './Explorer/ExplorerView';
import EditorView from './Editor/EditorView';
import RecoverPassword from './RecoverPasswrod/RecoverPassword';
import ResetPassword from './ResetPassword/ResetPassword';
import Navbar from './Navbar/Navbar Guest'; 
//For now, you'll have to change this between Navbar Guests vs Navbar Authed for the view you want 

const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const PrivateRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/explorer" element={<PrivateRoute><ExplorerView /></PrivateRoute>} />
        <Route path="/editor/:fileId" element={<PrivateRoute><EditorView /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
