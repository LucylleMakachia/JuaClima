import React, { useState } from "react";

export default function Tutorials() {
  const [activeTab, setActiveTab] = useState("datasets");

  const tabs = [
    { id: "datasets", label: "Uploading Datasets" },
    { id: "mapTools", label: "Using Map Tools" },
    { id: "community", label: "Community Features" },
    { id: "account", label: "Managing Your Account" },
  ];

  const mediaContent = {
    datasets: [
      {
        type: "video",
        title: "How to Upload Datasets",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        type: "gif",
        title: "Upload Preview GIF",
        src: "https://media.giphy.com/media/xT0BKqhdlKCxCNsVTq/giphy.gif",
      },
      {
        type: "slides",
        title: "Dataset Upload Slides",
        src: "https://docs.google.com/presentation/d/e/2PACX-1vQxX4w4SlSAMPLE/embed?start=false&loop=false&delayms=3000",
      },
    ],
    mapTools: [
      {
        type: "video",
        title: "Filtering & Visualizing Data",
        src: "https://www.youtube.com/embed/VIDEO_ID",
      },
      {
        type: "gif",
        title: "Map Filter Demo",
        src: "https://media.giphy.com/media/EXAMPLE/giphy.gif",
      },
    ],
    community: [
      {
        type: "video",
        title: "Posting in Community",
        src: "https://www.youtube.com/embed/VIDEO_ID",
      },
      {
        type: "slides",
        title: "Community Features Slides",
        src: "https://docs.google.com/presentation/d/e/2PACX-1vEXAMPLE/embed?start=false&loop=false&delayms=3000",
      },
    ],
    account: [
      {
        type: "video",
        title: "Managing Your Account",
        src: "https://www.youtube.com/embed/VIDEO_ID",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center md:text-left">
          Tutorials & Guides
        </h1>

        <p className="mb-8 text-gray-700 dark:text-gray-300">
          Explore our step-by-step tutorials to get the most out of JuaClima. Learn how to upload datasets, use map tools, participate in the community, and manage your account efficiently.
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? "bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Media Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mediaContent[activeTab].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 shadow rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold mb-2">{item.title}</h3>
              {item.type === "video" && (
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={item.src}
                    title={item.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-md"
                  ></iframe>
                </div>
              )}
              {item.type === "gif" && (
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-auto rounded-md"
                />
              )}
              {item.type === "slides" && (
                <iframe
                  src={item.src}
                  title={item.title}
                  frameBorder="0"
                  className="w-full h-64 rounded-md"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
