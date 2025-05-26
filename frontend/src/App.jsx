import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginSignup from "./components/LoginSignup";
import Profile from "./components/Profile";

function App() {
  return (
  
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
   
  );
}

export default App;
