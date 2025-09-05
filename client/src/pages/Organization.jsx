import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { format } from "timeago.js";

export default function Organization({ allUsers, allMessages }) {
  const { orgName } = useParams();
  const [orgMembers, setOrgMembers] = useState([]);

  useEffect(() => {
    // Filter users who belong to this organization
    const members = allUsers.filter((u) => u.org === orgName);
    setOrgMembers(members);
  }, [orgName, allUsers]);

  // Optionally, get all org public messages
  const orgMessages = allMessages.filter(
    (msg) => msg.org === orgName && !msg.isPrivate
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
        <h1 className="text-3xl font-bold mb-4">{orgName} Organization</h1>

        {/* Members Section */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-3">Members</h2>
          {orgMembers.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {orgMembers.map((member) => (
                <Link
                  key={member.name}
                  to={`/profile/${member.name}`}
                  className="flex flex-col items-center p-3 bg-gray-100 rounded hover:shadow"
                >
                  <img
                    src={member.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="w-20 h-20 rounded-full mb-2"
                  />
                  <strong>{member.name}</strong>
                  {member.role && <span className="text-sm text-gray-500">{member.role}</span>}
                  {member.verified && <span className="text-blue-500 text-sm">✔️ Verified</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No members found.</p>
          )}
        </div>

        {/* Organization Public Messages */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">Public Interactions</h2>
          {orgMessages.length ? (
            orgMessages.map((msg) => (
              <div key={msg._id} className="p-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={msg.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <strong>{msg.name}</strong>
                  <span className="text-xs text-gray-500 ml-auto">{format(msg.time)}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No public messages yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
