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
import NotAuthorized from "./pages/NotAuthorized";
import Profile from "./pages/Profile";
import Organization from "./pages/Organization";
import AdminPanel from "./pages/AdminPanel";
import About from "./pages/About";   // ✅ Added

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

// Automatic redirect for /community
function CommunityRedirect() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      const pkg = user?.publicMetadata?.package?.toLowerCase();
      if (pkg === "basic" || pkg === "premium") {
        navigate("/community/private");
      } else {
        navigate("/community/guest");
      }
    } else {
      navigate("/community/guest");
    }
  }, [isSignedIn, user, navigate]);

  return <div>Redirecting to Community...</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/news" element={<NewsEvents />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />   {/* ✅ Added route */}

      {/* Community routes */}
      <Route path="/community" element={<CommunityRedirect />} />
      <Route path="/community/guest" element={<Chat mode="guest" />} />
      <Route
        path="/community/private"
        element={
          <SignedIn>
            {({ user }) => {
              const pkg = user?.publicMetadata?.package?.toLowerCase() || "guest";
              return pkg === "basic" || pkg === "premium" ? (
                <Chat mode="private" />
              ) : (
                <NotAuthorized />
              );
            }}
          </SignedIn>
        }
      />

      {/* Profile & org routes */}
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/organization/:orgId" element={<Organization />} />

      {/* Admin panel */}
      <Route
        path="/admin"
        element={
          <SignedIn>
            <AdminPanel />
          </SignedIn>
        }
      />

      {/* Auth routes */}
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
      <Route path="/sign-in/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      <Route path="/post-sign-in" element={<PostSignInRedirect />} />

      {/* Protected dashboard routes */}
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

      {/* Protected datasets */}
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
