import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Datasets from "./pages/Datasets";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminFAQManager from "./components/AdminFAQManager";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";

import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <Routes>
        {/* Landing and auth routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/settings" element={<Settings />} />

        {/* Main app routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/community" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected admin FAQ manager route */}
        <Route
          path="/admin/faqs"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminFAQManager />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
