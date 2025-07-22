import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto min-h-[160px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between gap-8">
          {/* Each column: width responsive, minimum width to prevent full stacking */}
          <div className="flex-1 min-w-[180px] max-w-[300px]">
            <h3 className="text-lg font-semibold mb-4">JuaClima</h3>
            <p className="text-gray-400">
              Your trusted source for climate data and weather information.
            </p>
          </div>

          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/datasets"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Datasets
                </a>
              </li>
              <li>
                <a
                  href="/visualizations"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Visualizations
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Help
                </a>
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <h4 className="text-md font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

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
