import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdminMemberList from "../components/AdminMemberList";
import AdminVerification from "../components/AdminVerification";
import AdminModeration from "../components/AdminModeration";
import AdminAnalytics from "../components/AdminAnalytics";

export default function AdminDashboard() {
  const [tab, setTab] = useState("members");

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="flex gap-4 mb-6">
          {["members", "verification", "moderation", "analytics"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded ${
                tab === t ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded shadow">
          {tab === "members" && <AdminMemberList />}
          {tab === "verification" && <AdminVerification />}
          {tab === "moderation" && <AdminModeration />}
          {tab === "analytics" && <AdminAnalytics />}
        </div>
      </div>
      <Footer />
    </>
  );
}
