import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function DesktopDropdown({ section }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1">
        {section.label} ▼
      </button>

      <AnimatePresence>
        {isOpen && section.children && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-50"
          >
            {section.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-green-100 dark:hover:bg-gray-700 ${
                      isActive ? "font-semibold underline" : ""
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
