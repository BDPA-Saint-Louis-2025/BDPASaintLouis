// src/app.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Buffet from "./views/Buffet.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Buffet />} />
        {/* Q&A, Mail, Dashboard, Auth will come later */}
      </Routes>
    </BrowserRouter>
  );
}
