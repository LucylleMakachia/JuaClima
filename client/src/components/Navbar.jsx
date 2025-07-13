import { useState } from "react";
import { Menu, X } from "lucide-react";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-green-700">
          ClimaWatch
        </div>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <li><a href="#features" className="hover:text-green-700">Features</a></li>
          <li><a href="#map" className="hover:text-green-700">Map</a></li>
          <li><a href="#community" className="hover:text-green-700">Community</a></li>
          <li><a href="#faq" className="hover:text-green-700">FAQ</a></li>
        </ul>

        {/* Auth */}
        <div className="hidden md:block">
          <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
            Login
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-green-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <ul className="md:hidden px-4 pb-4 space-y-2 bg-white border-t text-gray-700">
          <li><a href="#features" className="block">Features</a></li>
          <li><a href="#map" className="block">Map</a></li>
          <li><a href="#community" className="block">Community</a></li>
          <li><a href="#faq" className="block">FAQ</a></li>
          <li>
            <button className="mt-2 bg-green-700 w-full text-white py-2 rounded-lg">
              Login
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
