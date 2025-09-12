import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUser, useClerk, UserButton, SignedOut, SignedIn } from "@clerk/clerk-react";
import { navLinks } from "../config/navLinks";
import MobileDropdown from "./MobileDropdown";
import DesktopDropdown from "./DesktopDropdown";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    const userTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(userTheme === "dark" || (!userTheme && systemPrefersDark));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleMode = () => setDarkMode(!darkMode);
  const handleMobileLinkClick = () => setIsOpen(false);

  const userPackage = user?.publicMetadata?.package?.toLowerCase() || "";
  const userStatus = isSignedIn
    ? ["basic", "premium"].includes(userPackage)
      ? "Member"
      : "Guest"
    : "Guest";

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <NavLink to="/" className="text-2xl font-bold text-green-700 dark:text-green-300">
          JuaClima
        </NavLink>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-6 text-gray-700 dark:text-gray-200 font-medium items-center justify-center flex-1">
          {navLinks
            .filter(section => section.label !== "Admin")
            .map((section) =>
              section.children ? (
                <DesktopDropdown key={section.label} section={section} />
              ) : (
                <li key={section.to}>
                  <NavLink
                    to={section.to}
                    className={({ isActive }) =>
                      `hover:text-green-700 dark:hover:text-green-300 ${isActive ? "font-semibold underline" : ""}`
                    }
                  >
                    {section.label}
                  </NavLink>
                </li>
              )
            )}
        </ul>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <SignedOut>
            <NavLink
              to="/sign-in"
              className="bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-600 font-medium"
            >
              Login
            </NavLink>
            <NavLink
              to="/sign-up"
              className="text-green-700 dark:text-green-300 px-3 py-1 font-medium hover:underline"
            >
              Sign Up
            </NavLink>
          </SignedOut>
          <SignedIn>
            <UserButton />
            <span className="text-gray-700 dark:text-gray-200 font-medium">{userStatus}</span>
            <button
              onClick={() => signOut()}
              className="bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-600"
            >
              Logout
            </button>
          </SignedIn>

          {/* Dark Mode */}
          <button
            onClick={toggleMode}
            className="text-xl hover:text-green-700 dark:hover:text-green-300"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-green-700 dark:text-green-300"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <ul className="md:hidden px-4 pb-4 space-y-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 border-t">
          {navLinks
            .filter(section => section.label !== "Admin")
            .map((section) =>
              section.children ? (
                <MobileDropdown
                  key={section.label}
                  section={section}
                  handleMobileLinkClick={handleMobileLinkClick}
                />
              ) : (
                <li key={section.to}>
                  <NavLink
                    to={section.to}
                    onClick={handleMobileLinkClick}
                    className="block px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition"
                  >
                    {section.label}
                  </NavLink>
                </li>
              )
            )}

          {/* Dark Mode */}
          <li>
            <button
              onClick={toggleMode}
              className="flex items-center space-x-1 text-green-700 dark:text-green-300"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? "Light" : "Dark"} Mode</span>
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
