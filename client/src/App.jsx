import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  AuthenticateWithRedirectCallback,
} from "@clerk/clerk-react";

// Pages
import Home from "./pages/Home";
import DashboardBasic from "./pages/DashboardBasic";
import DashboardPremium from "./pages/DashboardPremium";
import DashboardGuest from "./pages/DashboardGuest";
import Chat from "./pages/Chat";
import NewsEvents from "./pages/NewsEvents";
import FAQ from "./pages/FAQ";
import Datasets from "./pages/Datasets";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Profile from "./pages/profile";
import Organization from "./pages/Organization";
import AdminPanel from "./pages/AdminPanel";

function PostSignInRedirect() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const pkg = user.publicMetadata?.package?.toLowerCase() || "guest";

      switch (pkg) {
        case "premium":
          navigate("/dashboard/premium");
          break;
        case "basic":
          navigate("/dashboard/basic");
          break;
        default:
          navigate("/dashboard/guest");
      }
    }
  }, [user, navigate]);

  return <div>Redirecting...</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/news-events" element={<NewsEvents />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/community" element={<Chat />} /> {/* Public chat/community */}

      {/* Profile & org routes */}
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/organization/:orgId" element={<Organization />} />

      {/* Admin panel */}
      <Route path="/admin" element={
        <SignedIn>
          <AdminPanel />
        </SignedIn>
      } />

      {/* Auth routes */}
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
      <Route path="/sign-in/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      <Route path="/post-sign-in" element={<PostSignInRedirect />} />

      {/* Protected dashboard routes by package */}
      <Route
        path="/dashboard/basic"
        element={
          <SignedIn>
            <DashboardBasic />
          </SignedIn>
        }
      />
      <Route
        path="/dashboard/premium"
        element={
          <SignedIn>
            <DashboardPremium />
          </SignedIn>
        }
      />
      <Route
        path="/dashboard/guest"
        element={
          <SignedIn>
            <DashboardGuest />
          </SignedIn>
        }
      />

      {/* Protected datasets route */}
      <Route
        path="/datasets"
        element={
          <SignedIn>
            <Datasets />
          </SignedIn>
        }
      />

      {/* Redirect signed-out users for other protected paths */}
      <Route
        path="/protected/*"
        element={
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        }
      />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
