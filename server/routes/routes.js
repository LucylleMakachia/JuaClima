import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Overview from "./pages/Overview";
import Community from "./pages/Community";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/community" element={<Community />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}
