import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Profile({ allMessages }) {
  const { username } = useParams();
  const { user, isSignedIn } = useUser();
  const [profileData, setProfileData] = useState({
    avatarUrl: "/default-avatar.png",
    verified: false,
    org: "Independent",
    role: "",
    bio: "",
  });

  useEffect(() => {
    if (isSignedIn && user.fullName === username) {
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: user.profileImageUrl,
        bio: user.bio || "",
      }));
    } else {
      // For other users, fetch data from messages or DB
      const msgs = allMessages.filter((m) => m.name === username);
      if (msgs.length) {
        const latest = msgs[0];
        setProfileData({
          avatarUrl: latest.avatarUrl || "/default-avatar.png",
          verified: latest.verified || false,
          org: latest.org || "Independent",
          role: latest.role || "",
          bio: latest.bio || "",
        });
      }
    }
  }, [username, user, isSignedIn, allMessages]);

  // Filter user messages for display
  const userMessages = allMessages.filter(
    (m) => m.name === username && (m.isPrivate ? m.isPrivate : true)
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 text-gray-800 p-6">
        <h1 className="text-3xl font-bold mb-4">
          {username} {profileData.verified && <span className="text-blue-500">✔️</span>}
        </h1>
        <div className="bg-white p-6 rounded shadow w-full max-w-md text-center mb-6">
          <img
            src={profileData.avatarUrl}
            alt="Profile Avatar"
            className="w-32 h-32 mx-auto rounded-full mb-4"
          />
          <p className="text-gray-600 mb-1">
            Organization:{" "}
            {profileData.org !== "Independent" ? (
              <Link to={`/organization/${profileData.org}`} className="text-blue-600 hover:underline">
                {profileData.org}
              </Link>
            ) : (
              "Independent"
            )}
          </p>
          {profileData.role && <p className="text-gray-600 mb-2">Role: {profileData.role}</p>}
          {isSignedIn && user.fullName === username && (
            <p className="text-gray-600 mb-2">Email: {user.primaryEmailAddress.emailAddress}</p>
          )}
          <p className="text-gray-600 mb-2">Bio: {profileData.bio || "No bio available"}</p>
        </div>

        {/* User Messages */}
        <div className="max-w-3xl w-full">
          <h2 className="text-xl font-semibold mb-2">Interactions</h2>
          {userMessages.length ? (
            userMessages.map((msg) => (
              <div key={msg._id} className="bg-white p-3 rounded shadow mb-2 border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                <span className="text-xs text-gray-500">
                  {msg.isPrivate ? "Private/Org" : "Public"} — {format(msg.time)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No messages yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
