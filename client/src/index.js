import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";

// Clerk Frontend API key from your .env file
const clerkFrontendApi = process.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkFrontendApi) {
  console.error("Missing Clerk publishable key in environment variables.");
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkFrontendApi}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
