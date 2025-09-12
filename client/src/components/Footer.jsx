import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto min-h-[160px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between gap-8">
          {/* Brand Section */}
          <div className="flex-1 min-w-[180px] max-w-[300px]">
            <h3 className="text-lg font-semibold mb-4">JuaClima</h3>
            <p className="text-gray-400">
              Your trusted source for climate data, weather information, and actionable insights.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/datasets"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Datasets
                </Link>
              </li>
              <li>
                <Link
                  to="/visualizations"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Visualizations
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help#faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/help#contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Help
                </Link>
              </li>
              <li>
                <Link
                  to="/tutorials"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Tutorials
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Connect */}
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/yourhandle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yourhandle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/yourhandle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} JuaClima. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
