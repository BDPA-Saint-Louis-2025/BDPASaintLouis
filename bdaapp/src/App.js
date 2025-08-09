import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginScreen from './LoginScreen/LoginScreen';
import SignUpForm from './SignUpForm/SignUpForm';
import Dashboard from './Dashboard/Dashboard';
import ExplorerView from './Explorer/ExplorerView';
import EditorView from './Editor/EditorView';
import RecoverPassword from './RecoverPasswrod/RecoverPassword';
import ResetPassword from './ResetPassword/ResetPassword';
import ForgotPasswordForm from './ForgotPassword/ForgotPasswordForm';
import MainExplorerView from './Explorer/MainExplorerView';
import PublicExplorerView from './Explorer/PublicExplorerView';
import ForgotPassword from './ForgotPassword/ForgotPasswordForm';

const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const PrivateRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/explorer" element={<PrivateRoute><ExplorerView /></PrivateRoute>} />
        <Route path="/editor/:fileId" element={<PrivateRoute><EditorView /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/explorer" element={<PrivateRoute><ExplorerView /></PrivateRoute>} />
        <Route path="/public-explorer" element={<PublicExplorerView />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
