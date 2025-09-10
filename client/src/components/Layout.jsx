import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-grow container mx-auto px-4 mb-12">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
