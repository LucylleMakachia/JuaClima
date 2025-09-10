import React, { useEffect, useState } from "react";
import { FaGlobe, FaExclamationTriangle, FaLightbulb, FaUsers } from "react-icons/fa";
import CountUp from "react-countup";

const About = () => {
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="flex-1 relative max-w-7xl mx-auto px-6 pt-20">
      {/* About Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3">About JuaClima</h1>
        <p className="text-gray-700 text-lg md:text-xl">
          Turning climate data into actionable insights for communities, organizations, and decision-makers.
        </p>
      </section>

      {/* How We Came to Be */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4">How We Came to Be</h2>
        <p className="text-gray-700 text-lg leading-relaxed">
          JuaClima was born out of the urgent need for accessible, localized, and actionable climate information.
          Our founder noticed that while climate data exists in abundance, it is often fragmented, technical, and
          inaccessible to communities that need it most. Driven by the vision of empowering individuals, organizations,
          and governments in Kenya, we created a platform that bridges the gap between data and action.
        </p>
      </section>

      {/* The Problem */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4">The Problem</h2>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-red-100 p-4 rounded-lg shadow hover:shadow-xl transition-transform transform hover:-translate-y-1">
            <FaExclamationTriangle className="text-red-600 text-3xl mb-2" />
            <p className="text-gray-800 text-base leading-relaxed">
              Communities face increasing risks like floods, droughts, and extreme weather events. Yet climate information is scattered, complex, and hard to act on, leaving many unprepared.
            </p>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4">Our Solution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <FaGlobe className="text-green-600 text-3xl mb-2 mx-auto" />, title: "Real-Time & Historical Data", desc: "Interactive maps and charts providing insights to help you respond proactively." },
            { icon: <FaLightbulb className="text-yellow-600 text-3xl mb-2 mx-auto" />, title: "Actionable Insights", desc: "Simple, understandable data for both technical and non-technical users." },
            { icon: <FaUsers className="text-blue-600 text-3xl mb-2 mx-auto" />, title: "Collaborative Tools", desc: "Coordinate responses effectively with NGOs, government agencies, and communities." },
            { icon: <FaExclamationTriangle className="text-purple-600 text-3xl mb-2 mx-auto" />, title: "Localized Alerts", desc: "Stay informed of imminent climate risks in your area and prepare accordingly." },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer">
              {card.icon}
              <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
              <p className="text-gray-700 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Impact */}
      <section className="mb-12 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { label: "Communities Helped", value: 500 },
            { label: "NGOs Supported", value: 120 },
            { label: "Projects Completed", value: 75 },
          ].map((item, i) => (
            <div key={i}>
              <h3 className="text-3xl md:text-4xl font-bold text-green-600 mb-1">
                <CountUp end={item.value} duration={2} />
              </h3>
              <p className="text-gray-700 text-base">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Join Us */}
      <section className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-3">Join Us</h2>
        <p className="text-gray-700 text-base mb-4">
          Explore JuaClima, contribute data, and collaborate on building a climate-resilient future.
        </p>
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">
          Get Started
        </button>
      </section>
    </main>
  );
};

export default About;
