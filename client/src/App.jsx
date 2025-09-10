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

import Layout from "./components/Layout";

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
import About from "./pages/About";

function PostSignInRedirect() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
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
  }, [user, navigate]);

  return <div>Redirecting...</div>;
}

function CommunityRedirect() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      const pkg = user?.publicMetadata?.package?.toLowerCase();
      navigate(
        pkg === "basic" || pkg === "premium"
          ? "/community/private"
          : "/community/guest"
      );
    } else {
      navigate("/community/guest");
    }
  }, [isSignedIn, user, navigate]);

  return <div>Redirecting to Community...</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Layout-wrapped routes */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/news" element={<NewsEvents />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />

        {/* Community */}
        <Route path="/community" element={<CommunityRedirect />} />
        <Route path="/community/guest" element={<Chat mode="guest" />} />
        <Route
          path="/community/private"
          element={
            <SignedIn>
              <Chat mode="private" />
            </SignedIn>
          }
        />

        {/* Profiles */}
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/organization/:orgId" element={<Organization />} />

        {/* Dashboards */}
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

        {/* Datasets – visible to all, download only for signed-in users */}
        <Route path="/datasets" element={<Datasets />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <SignedIn>
              <AdminPanel />
            </SignedIn>
          }
        />

        {/* Post sign-in redirect */}
        <Route path="/post-sign-in" element={<PostSignInRedirect />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth routes */}
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
      <Route
        path="/sign-in/sso-callback"
        element={<AuthenticateWithRedirectCallback />}
      />

      {/* Signed-out fallback for protected routes */}
      <Route
        path="/protected/*"
        element={
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        }
      />
    </Routes>
  );
}
