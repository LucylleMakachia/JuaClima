import React, { useRef } from "react";
import { motion } from "framer-motion";

const partners = [
  {
    name: "Global Green Initiative",
    logo: "/logos/green-initiative.png",
    description:
      "Supporting sustainable development projects across Kenya and East Africa.",
  },
  {
    name: "SolarAid",
    logo: "/logos/solaraid.png",
    description:
      "Promoting clean energy access in rural communities.",
  },
  {
    name: "Water for All",
    logo: "/logos/water-for-all.png",
    description:
      "Improving access to clean water for isolated regions.",
  },
  {
    name: "Tech4Dev",
    logo: "/logos/tech4dev.png",
    description:
      "Leveraging technology to solve development challenges.",
  },
  {
    name: "EarthWatch",
    logo: "/logos/earthwatch.png",
    description:
      "Monitoring environmental changes to support conservation efforts.",
  },
  // Add more partners as needed
];

export default function PartnersDonorsCarousel() {
  const carouselRef = useRef();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-300 text-center mb-6">
        Partners & Donors
      </h1>
      <p className="text-center text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
        JuaClima collaborates with trusted partners and donors to implement
        impactful solutions in climate resilience, rural development, and
        sustainable technologies.
      </p>

      <motion.div
        ref={carouselRef}
        className="flex overflow-x-scroll scrollbar-hide space-x-6"
        whileTap={{ cursor: "grabbing" }}
        drag="x"
        dragConstraints={{ right: 0, left: -((partners.length - 3) * 250) }}
      >
        {partners.map((partner, index) => (
          <motion.div
            key={index}
            className="min-w-[250px] bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow flex-shrink-0"
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-24 w-24 object-contain mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {partner.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {partner.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
