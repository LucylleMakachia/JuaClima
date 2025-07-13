// src/pages/LandingPage.jsx
import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import WeatherCards from "../components/WeatherCards";
import MapView from "../components/MapView";
import DashboardPreview from "../components/DashboardPreview";
import KnowledgeSection from "../components/KnowledgeSection";
import CommunityPreview from "../components/CommunityPreview";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WeatherCards />
        <section className="p-4 md:p-8">
          <MapView />
        </section>
        <DashboardPreview />
        <KnowledgeSection />
        <CommunityPreview />
      </main>
      <Footer />
    </div>
  );
}
