// src/app.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Buffet from "./views/Buffet.js";
import LoginScreen from './LoginScreen/LoginScreen';
import SignUpForm from './SignUpForm/SignUpForm';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/" element={<Buffet />} />
        {/* Q&A, Mail, Dashboard, Auth will come later */}
      </Routes>
    </BrowserRouter>
  );
}
