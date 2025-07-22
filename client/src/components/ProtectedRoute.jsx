import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-yellow-100 text-yellow-900">
    <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
    <p className="mb-6">You do not have permission to view this page.</p>
    <a href="/" className="text-blue-600 underline hover:text-blue-800">
      Go back home
    </a>
  </div>
);

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    // Redirect unauthenticated users to sign-in page
    return <Navigate to="/sign-in" replace />;
  }

  // Get roles from publicMetadata, adjust if you store roles elsewhere
  const userRoles = user?.publicMetadata?.roles || [];

  if (requiredRole && !userRoles.includes(requiredRole)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;
