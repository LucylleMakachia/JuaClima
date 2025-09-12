import React from "react";

const policySections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `Your privacy is important to us. We collect personal data only to provide services, improve the platform, and communicate with users. Data is securely stored and not shared without consent.`
  },
  {
    id: "terms",
    title: "Terms of Service",
    content: `By using JuaClima, you agree to our terms and conditions. Users are expected to act responsibly, respect other users, and comply with local laws. We reserve the right to suspend accounts for violations.`
  },
  {
    id: "dataUsage",
    title: "Data Usage Policy",
    content: `Datasets uploaded to JuaClima may be used to provide insights, visualizations, and analytics. Sensitive data must comply with our ethical guidelines. Users retain ownership but grant permission for platform use.`
  },
  {
    id: "communityGuidelines",
    title: "Community Guidelines",
    content: `JuaClima fosters a positive and collaborative environment. Users must respect others, avoid spam, misinformation, or offensive content. Reports of misconduct are reviewed by moderators.`
  },
  {
    id: "cookiePolicy",
    title: "Cookie Policy",
    content: `We use cookies to improve site functionality, track usage, and enhance user experience. Users can manage cookie preferences in their browser settings.`
  },
];

export default function Policies() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center md:text-left">
          Platform Policies
        </h1>
        <p className="mb-8 text-gray-700 dark:text-gray-300">
          At JuaClima, we prioritize transparency, user safety, and data integrity. 
          Please review our policies below to understand your rights, responsibilities, and how we manage data.
        </p>

        {/* Full Content Sections */}
        <div className="space-y-6">
          {policySections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
              <p className="text-gray-700 dark:text-gray-300">{section.content}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-gray-500 dark:text-gray-400 text-sm">
          Last updated: September 2025
        </p>
      </div>
    </div>
  );
}
