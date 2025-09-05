import React, { useState } from "react";
import NewsSidebar from "../components/NewsSidebar";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {/* Mobile toggle button */}
        <button
          className="md:hidden fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle News Sidebar"
        >
          {sidebarOpen ? "Close News" : "Open News"}
        </button>

        {children}
      </div>

      {/* Sidebar */}
      {/* Desktop: visible, Mobile: toggle visibility */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-gray-50 border-l border-gray-300 overflow-auto
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          md:block
        `}
      >
        <NewsSidebar />
      </div>

      {/* Optional overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
