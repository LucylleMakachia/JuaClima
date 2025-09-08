import React from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function NotAuthorized() {
  const { user } = useUser();
  const navigate = useNavigate();

  const pkg = user?.publicMetadata?.package?.toLowerCase() || "guest";
  const isGuestSignedIn = user && pkg === "guest";

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Not Authorized</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-lg">
        You don’t have access to this community.  
        {isGuestSignedIn
          ? " Upgrade your account to Basic or Premium to unlock access."
          : " Please sign in with an account that has the right permissions."}
      </p>

      {/* Show upgrade only if signed-in guest */}
      {isGuestSignedIn && (
        <button
          onClick={() => navigate("/pricing")}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Upgrade Now
        </button>
      )}
    </div>
  );
}
