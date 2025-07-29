import React from 'react';
import { jwtDecode } from 'jwt-decode';
import ExplorerView from './ExplorerView';
import PublicExplorerView from './PublicExplorerView';

function MainExplorerView() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  let isValid = false;

  try {
    const decoded = jwtDecode(token);
    isValid = decoded && decoded.exp * 1000 > Date.now();
  } catch {
    isValid = false;
  }

  return isValid ? <ExplorerView /> : <PublicExplorerView />;
}

export default MainExplorerView;
