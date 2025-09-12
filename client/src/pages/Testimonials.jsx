import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import StoryFormModal from "../components/StoryFormModal";

export default function Testimonials() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const placeholderPosts = [
    {
      id: 1,
      title: "Building Climate Resilience",
      excerpt: "JuaClima early-warning systems helped our village prepare for floods.",
      author: "Daniel O.",
      location: "Mombasa",
      date: "2025-06-01",
      avatar: "https://i.pravatar.cc/150?img=3",
      type: "image",
      media: "https://source.unsplash.com/800x600/?flood,community",
    },
    {
      id: 2,
      title: "Youth in Action",
      excerpt: "Through JuaClima training, our youth planted 2,000 trees.",
      author: "Grace K.",
      location: "Kisumu",
      date: "2025-07-15",
      avatar: "https://i.pravatar.cc/150?img=5",
      type: "image",
      media: "https://source.unsplash.com/800x600/?forest,tree",
    },
    {
      id: 3,
      title: "Farmers Fighting Drought",
      excerpt: "The data tools helped us adapt crops to survive prolonged drought.",
      author: "Ahmed L.",
      location: "Garissa",
      date: "2025-05-20",
      avatar: "https://i.pravatar.cc/150?img=6",
      type: "image",
      media: "https://source.unsplash.com/800x600/?farm,drought",
    },
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/api/blog");
        setPosts(response.data.length ? response.data : placeholderPosts);
      } catch (err) {
        console.error(err);
        setPosts(placeholderPosts);
        setError("Showing sample stories due to loading issues.");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrentIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700 dark:text-gray-300">
        Loading stories...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-green-600 dark:text-green-400">
          Community Stories & Testimonials
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
          Real stories from communities impacted by climate events and how
          <span className="font-semibold"> JuaClima </span> has supported them.
        </p>

        {/* Stats */}
        <div className="mt-6 flex justify-center space-x-8 text-green-700 dark:text-green-300 font-medium">
          <div>🌍 120+ Communities Reached</div>
          <div>📊 500+ Farmers Trained</div>
          <div>🌱 10k+ Trees Planted</div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md px-6"
          >
            Share Your Story
          </Button>
          <Link to="/blog">
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md px-6">
              Read More Stories
            </Button>
          </Link>
        </div>
      </header>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Carousel */}
      <div className="relative max-w-3xl mx-auto">
        {posts.length > 0 && (
          <Card className="rounded-2xl shadow-lg overflow-hidden transition-all hover:scale-105 duration-300 relative">
            <div className="relative">
              <img
                src={posts[currentIndex].media}
                alt={posts[currentIndex].title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

              {/* Carousel Arrows inside image container */}
              <button
                onClick={handlePrev}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-green-600/80 text-white p-2 rounded-full shadow-md hover:bg-green-700/90 z-10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-green-600/80 text-white p-2 rounded-full shadow-md hover:bg-green-700/90 z-10"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <CardContent className="p-6 relative">
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                {posts[currentIndex].title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {posts[currentIndex].excerpt}
              </p>

              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <img
                  src={posts[currentIndex].avatar}
                  alt={posts[currentIndex].author}
                  className="w-10 h-10 rounded-full border"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <User size={14} /> <span>{posts[currentIndex].author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} /> <span>{posts[currentIndex].location}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(posts[currentIndex].date).toDateString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {posts.map((_, index) => (
            <span
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full cursor-pointer ${
                index === currentIndex
                  ? "bg-green-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            ></span>
          ))}
        </div>
      </div>

      {/* Story Modal */}
      <StoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addToast={addToast}
      />

      {/* Toast Stack */}
      <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer select-none rounded-lg p-3 shadow-md border ${
              toast.type === "success"
                ? "bg-green-600 text-white border-green-700"
                : "bg-red-600 text-white border-red-700"
            }`}
            style={{ animation: "toastSlideIn 0.6s forwards", touchAction: "pan-y" }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
