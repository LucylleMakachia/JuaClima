// src/components/ParticlesBackground.jsx
import React from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

const ParticlesBackground = () => {
  const particlesInit = async (engine) => {
    await loadFull(engine); // Loads the full tsparticles package
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false }, // stays within parent div
        background: { color: "transparent" },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" }, // hover effect
            onClick: { enable: true, mode: "push" }, // click to add particles
            resize: true,
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { quantity: 4 },
          },
        },
        particles: {
          number: { value: 60, density: { enable: true, area: 800 } },
          color: { value: ["#34D399", "#3B82F6", "#FBBF24"] },
          shape: { type: "circle" },
          opacity: { value: 0.3, random: { enable: true, minimumValue: 0.1 } },
          size: { value: { min: 1, max: 4 }, random: true },
          links: {
            enable: true,
            distance: 120,
            color: "#A3A3A3",
            opacity: 0.15,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.6,
            direction: "none",
            random: true,
            straight: false,
            outModes: { default: "out" },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticlesBackground;
