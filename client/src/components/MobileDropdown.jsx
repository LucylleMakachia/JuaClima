import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileDropdown({ section, handleMobileLinkClick }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition"
      >
        {section.label} 
        <span className={`transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
      </button>

      <AnimatePresence>
        {isOpen && section.children && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pl-4 mt-1 space-y-1 overflow-hidden"
          >
            {section.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  onClick={handleMobileLinkClick}
                  className="block px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition"
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
