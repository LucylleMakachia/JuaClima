import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { useLocation } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const images = [
  "/images/climate1.jpg",
  "/images/climate2.jpg",
  "/images/climate3.jpg",
];

const sliderSettings = {
  autoplay: true,
  autoplaySpeed: 5000,
  infinite: true,
  speed: 1000,
  fade: true,
  arrows: false,
  pauseOnHover: false,
};

function HeroSection() {
  const location = useLocation();
  const showSlideshow = location.pathname === "/";

  // Stars state
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 25 }).map(() => ({
      top: Math.random() * 80 + 10 + "%",
      left: Math.random() * 90 + 5 + "%",
      size: Math.random() * 3 + 2,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.5 + 0.5,
    }));
    setStars(generatedStars);
  }, []);

  if (!showSlideshow) return null;

  return (
    <section className="relative h-[90vh] text-white overflow-hidden">
      {/* Slideshow background */}
      <div className="absolute inset-0 z-0">
        <Slider {...sliderSettings}>
          {images.map((src, i) => (
            <div key={i}>
              <div
                className="h-[90vh] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            </div>
          ))}
        </Slider>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Twinkling stars */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Empowering Climate Response
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-6 max-w-3xl">
          JuaClima helps local communities, researchers, and decision-makers monitor climate risks, share insights, and respond effectively.
        </p>
        <a
          href="#overview"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition transform hover:scale-105"
          style={{ color: "white" }}
        >
          Explore Dashboard
        </a>
      </div>
    </section>
  );
}

export default HeroSection;
