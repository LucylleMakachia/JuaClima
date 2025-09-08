import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaGlobe, FaExclamationTriangle, FaLightbulb, FaUsers, FaCloud, FaSun, FaLeaf } from "react-icons/fa";
import CountUp from "react-countup";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

const About = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const particlesInit = async (engine) => await loadFull(engine);

  const getParallaxStyle = (factor = 0.02) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const rotateY = (mousePos.x - centerX) * factor;
    const rotateX = -(mousePos.y - centerY) * factor;
    return { transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` };
  };

  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 overflow-hidden">
      {/* Hero Particles */}
      <Particles
        id="hero-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: "transparent" },
          fpsLimit: 60,
          interactivity: { events: { onHover: { enable: true, mode: "repulse" }, onClick: { enable: true, mode: "push" }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { quantity: 4 } }
          },
          particles: {
            number: { value: 50, density: { enable: true, area: 900 } },
            color: { value: ["#34D399", "#3B82F6", "#FBBF24"] },
            shape: { type: "circle" },
            opacity: { value: 0.2, random: { enable: true, minimumValue: 0.05 } },
            size: { value: { min: 1, max: 4 }, random: true },
            links: { enable: true, distance: 120, color: "#A3A3A3", opacity: 0.15, width: 1 },
            move: { enable: true, speed: 0.4, direction: "none", random: true, straight: false, outModes: { default: "out" } },
          },
          detectRetina: true,
        }}
      />

      {/* Floating Icons */}
      <FaCloud className="absolute text-blue-200 text-6xl opacity-20" style={{ top: 40 + scrollY * 0.2, left: 20 }} />
      <FaSun className="absolute text-yellow-200 text-8xl opacity-20" style={{ top: window.innerHeight * 0.25 + scrollY * 0.1, right: 40 }} />
      <FaLeaf className="absolute text-green-200 text-7xl opacity-15" style={{ bottom: 40 - scrollY * 0.15, left: "33%" }} />

      {/* Hero Section */}
      <section className="text-center mb-16 relative z-10" data-aos="fade-down" style={getParallaxStyle(0.015)}>
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">About JuaClima</h1>
        <p className="text-gray-700 text-lg md:text-xl">
          Turning climate data into actionable insights for communities, organizations, and decision-makers.
        </p>
      </section>

      {/* How We Came to Be */}
      <section className="mb-16 relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-blue-800 mb-6">How We Came to Be</h2>
        <p className="text-gray-700 text-lg leading-relaxed">
          JuaClima was born out of the urgent need for accessible, localized, and actionable climate information.
          Our founder noticed that while climate data exists in abundance, it is often fragmented, technical, and
          inaccessible to communities that need it most. Driven by the vision of empowering individuals, organizations,
          and governments in Kenya, we created a platform that bridges the gap between data and action.
        </p>
      </section>

      {/* Problem Section */}
      <section className="mb-16 relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-blue-800 mb-6">The Problem</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-red-100 p-6 rounded-lg shadow hover:shadow-xl transition-transform transform hover:-translate-y-2" data-aos="zoom-in">
            <FaExclamationTriangle className="text-red-600 text-4xl mb-4" />
            <p className="text-gray-800 text-lg leading-relaxed">
              Communities face increasing risks like floods, droughts, and extreme weather events, yet climate information is scattered, complex, and hard to act on. This leaves many unprepared for climate-related challenges.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section with slightly faster particle speed for cards */}
      <section className="mb-16 relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-blue-800 mb-6">Our Solution</h2>

        <Particles
          id="cards-particles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            background: { color: "transparent" },
            fpsLimit: 60,
            interactivity: { events: { onHover: { enable: true, mode: "repulse" }, onClick: { enable: true, mode: "push" }, resize: true },
              modes: { repulse: { distance: 80, duration: 0.3 }, push: { quantity: 3 } }
            },
            particles: {
              number: { value: 40, density: { enable: true, area: 700 } },
              color: { value: ["#34D399", "#3B82F6", "#FBBF24"] },
              shape: { type: "circle" },
              opacity: { value: 0.15, random: { enable: true, minimumValue: 0.05 } },
              size: { value: { min: 1, max: 3 }, random: true },
              links: { enable: true, distance: 100, color: "#A3A3A3", opacity: 0.1, width: 1 },
              move: { enable: true, speed: 0.6, direction: "none", random: true, straight: false, outModes: { default: "out" } },
            },
            detectRetina: true,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <FaGlobe className="text-green-600 text-4xl mb-4 mx-auto" />, title: "Real-Time & Historical Data", desc: "Interactive maps and charts providing insights to help you respond proactively." },
            { icon: <FaLightbulb className="text-yellow-600 text-4xl mb-4 mx-auto" />, title: "Actionable Insights", desc: "Simple, understandable data for both technical and non-technical users." },
            { icon: <FaUsers className="text-blue-600 text-4xl mb-4 mx-auto" />, title: "Collaborative Tools", desc: "Coordinate responses effectively with NGOs, government agencies, and communities." },
            { icon: <FaExclamationTriangle className="text-purple-600 text-4xl mb-4 mx-auto" />, title: "Localized Alerts", desc: "Stay informed of imminent climate risks in your area and prepare accordingly." },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-transform transform hover:-translate-y-2 cursor-pointer" data-aos="fade-up">
              {card.icon}
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-700">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section className="mb-16 relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-blue-800 mb-6">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: "Communities Helped", value: 500 },
            { label: "NGOs Supported", value: 120 },
            { label: "Projects Completed", value: 75 },
          ].map((item, i) => (
            <div key={i}>
              <h3 className="text-4xl font-bold text-green-600 mb-2">
                <CountUp end={item.value} duration={2} />
              </h3>
              <p className="text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center relative z-10" data-aos="zoom-in">
        <h2 className="text-3xl font-semibold text-blue-800 mb-6">Join Us</h2>
        <p className="text-gray-700 text-lg mb-6">
          Explore JuaClima, contribute data, and collaborate on building a climate-resilient future. Together, we can turn information into action.
        </p>
        <button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition">
          Get Started
        </button>
      </section>
    </div>
  );
};

export default About;
