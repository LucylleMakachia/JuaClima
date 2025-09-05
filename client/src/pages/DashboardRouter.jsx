import React from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardGuest from "./DashboardGuest";
import DashboardBasic from "./DashboardBasic";       // your current Dashboard.jsx
import DashboardPremium from "./DashboardPremium";

export default function DashboardRouter() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    // Not signed in => guest view
    return <DashboardGuest />;
  }

  // Example: assuming you have a custom claim or public metadata to indicate user package
  // Adjust the path according to your auth setup
  const packageType =
    user?.publicMetadata?.packageType?.toLowerCase() || "basic";

  switch (packageType) {
    case "premium":
      return <DashboardPremium />;
    case "basic":
    default:
      return <DashboardBasic />;
  }
}
