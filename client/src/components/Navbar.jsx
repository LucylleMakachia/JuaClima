import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import {
  useUser,
  useClerk,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { NavLink, useLocation } from "react-router-dom";
import { toggleDarkMode } from "../utils/theme";

export function ThemeToggle() {
  return (
    <button
      onClick={toggleDarkMode}
      className="text-sm p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      Toggle Theme
    </button>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const userRoles = user?.publicMetadata?.roles || [];
  const isAdmin = isSignedIn && userRoles.includes("admin");

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const userTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (userTheme === "dark" || (!userTheme && systemPrefersDark)) {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
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

  const location = useLocation();

  const handleMobileLinkClick = () => setIsOpen(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Community", to: "/community" },
    { label: "News & Events", to: "/news" },   // <-- linked to NewsEvents page
    { label: "Datasets", to: "/datasets" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <NavLink
          to="/"
          className="text-2xl font-bold text-green-700 dark:text-green-300"
        >
          JuaClima
        </NavLink>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-6 text-gray-700 dark:text-gray-200 font-medium items-center">
          {navLinks.map(({ label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `hover:text-green-700 dark:hover:text-green-300 ${
                    isActive ? "font-semibold underline" : ""
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink
                to="/admin/faqs"
                className="font-semibold hover:text-green-700 dark:hover:text-green-300"
              >
                Admin FAQ
              </NavLink>
            </li>
          )}
          <li>
            <button
              onClick={toggleMode}
              className="text-xl hover:text-green-700 dark:hover:text-green-300"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </li>
          {isSignedIn && (
            <li className="flex items-center space-x-2">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
              )}
              <UserButton afterSignOutUrl="/" />
            </li>
          )}
        </ul>

        {/* Desktop Auth */}
        <div className="hidden md:block">
          <SignedOut>
            <NavLink
              to="/sign-in"
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
            >
              Login
            </NavLink>
            <NavLink
              to="/sign-up"
              className="ml-2 text-green-700 dark:text-green-300 font-medium hover:underline"
            >
              Sign Up
            </NavLink>
          </SignedOut>
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
          {navLinks.map(({ label, to }) => (
            <li key={to}>
              <NavLink to={to} onClick={handleMobileLinkClick} className="block">
                {label}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink
                to="/admin/faqs"
                className="font-semibold"
                onClick={handleMobileLinkClick}
              >
                Admin FAQ
              </NavLink>
            </li>
          )}
          <li>
            <button
              onClick={toggleMode}
              className="flex items-center space-x-1 text-green-700 dark:text-green-300"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? "Light" : "Dark"} Mode</span>
            </button>
          </li>
          <SignedOut>
            <li>
              <NavLink
                to="/sign-in"
                className="block bg-green-700 text-white text-center py-2 rounded-lg"
                onClick={handleMobileLinkClick}
              >
                Login
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/sign-up"
                className="block text-center text-green-700 dark:text-green-300 font-medium hover:underline"
                onClick={handleMobileLinkClick}
              >
                Sign Up
              </NavLink>
            </li>
          </SignedOut>
          <SignedIn>
            <li>
              <button
                onClick={() => signOut()}
                className="bg-green-700 text-white w-full py-2 rounded-lg"
              >
                Logout
              </button>
            </li>
            <li className="flex justify-center">
              <UserButton />
            </li>
          </SignedIn>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
