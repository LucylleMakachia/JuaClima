import React from "react";
import { Link } from "react-router-dom";

export default function DashboardGuest() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">👋 Welcome to JuaClima</h1>
      <p className="mb-4">
        You are currently browsing as a guest. To access the full climate dashboard and upload datasets, please sign in or sign up.
      </p>
      <div className="space-x-4">
        <Link
          to="/sign-in"
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign In
        </Link>
        <Link
          to="/sign-up"
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
