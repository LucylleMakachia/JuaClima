import React from "react";
import { FaLinkedin, FaTwitter } from "react-icons/fa";

// Example team data
const teamMembers = [
  {
    name: "Lucy Makachia",
    role: "Founder & Project Lead",
    bio: "Driving climate resilience innovation and partnerships through JuaClima.",
    image: "/images/team/lucy.jpg",
    social: {
      linkedin: "https://www.linkedin.com/in/lucylle-makachia",
      twitter: "https://twitter.com/yourhandle",
    },
  },
  {
    name: "John Doe",
    role: "GIS & Data Specialist",
    bio: "Expert in GIS mapping, remote sensing, and geospatial analytics.",
    image: "/images/team/john.jpg",
    social: {
      linkedin: "https://linkedin.com/in/johndoe",
    },
  },
  {
    name: "Jane Smith",
    role: "Community Outreach",
    bio: "Connecting grassroots organizations and amplifying local climate voices.",
    image: "/images/team/jane.jpg",
    social: {
      twitter: "https://twitter.com/janesmith",
    },
  },
];

export default function Team() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
        Meet Our Team
      </h1>

      <p className="max-w-2xl mx-auto text-center mb-12 text-gray-600 dark:text-gray-400">
        Our dedicated team is committed to building climate resilience and
        empowering communities through data, technology, and collaboration.
      </p>

      {/* Vertical stack of horizontal cards */}
      <div className="flex flex-col gap-8 items-center">
        {teamMembers.map((member, idx) => (
          <div
            key={idx}
            className="w-full max-w-3xl flex flex-col md:flex-row items-center md:items-start gap-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            {/* Photo */}
            <img
              src={member.image}
              alt={member.name}
              className="w-40 h-40 object-cover rounded-lg flex-shrink-0"
            />

            {/* Text content */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {member.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
              <p className="mt-2 text-gray-500 dark:text-gray-300 text-sm">
                {member.bio}
              </p>

              {/* Socials */}
              <div className="flex gap-4 mt-3">
                {member.social?.linkedin && (
                  <a
                    href={member.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-green-500 text-xl"
                  >
                    <FaLinkedin />
                  </a>
                )}
                {member.social?.twitter && (
                  <a
                    href={member.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-green-500 text-xl"
                  >
                    <FaTwitter />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
