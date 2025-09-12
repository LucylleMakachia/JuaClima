import React from "react";
import TeamCard from "../components/TeamCard"; // adjust path if needed

// Example team data
const teamMembers = [
  {
    name: "Lucylle Makachia",
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

      {/* Vertical full-width stack of cards */}
      <div className="flex flex-col gap-8 items-stretch">
        {teamMembers.map((member, idx) => (
          <div key={idx} className="w-full">
            <TeamCard member={member} />
          </div>
        ))}
      </div>
    </div>
  );
}
