import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState({ type: "all", location: "all", author: "all" });

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/api/blog");
        const sortedPosts = response.data.sort((a, b) => b.date - a.date);
        setPosts(sortedPosts);
        setFilteredPosts(sortedPosts);
      } catch (err) {
        console.error(err);
        setError("Failed to load posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    let updated = [...posts];
    if (activeFilter.type !== "all") updated = updated.filter((p) => p.type === activeFilter.type);
    if (activeFilter.location !== "all") updated = updated.filter((p) => p.location === activeFilter.location);
    if (activeFilter.author !== "all") updated = updated.filter((p) => p.author === activeFilter.author);
    setFilteredPosts(updated);
  }, [activeFilter, posts]);

  const renderMedia = (post) => {
    if (!post.media) return null;
    const commonClasses = "w-full h-40 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105";
    if (post.type === "image")
      return <img src={post.media} alt={post.title} className={commonClasses} />;
    return <video src={post.media} className={commonClasses} muted loop />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading posts...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  const locations = ["all", ...Array.from(new Set(posts.map(p => p.location)))];
  const authors = ["all", ...Array.from(new Set(posts.map(p => p.author)))];

  const renderTabs = (options, key) => (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setActiveFilter({ ...activeFilter, [key]: opt })}
          className={`px-4 py-2 rounded-xl transition relative ${
            activeFilter[key] === opt
              ? "text-green-700 dark:text-green-400 font-bold"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  // Sparkle trail component
  const SparkleTrail = ({ parentRef }) => {
    const [particles, setParticles] = useState([]);
    const requestRef = useRef();

    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y - p.vy, opacity: p.opacity - 0.02 }))
          .filter((p) => p.opacity > 0)
      );
      requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const handleMouseMove = (e) => {
      if (!parentRef.current) return;
      const rect = parentRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newParticle = {
        id: Date.now() + Math.random(),
        x,
        y,
        size: Math.random() * 4 + 2,
        color: ["#FFD700", "#FF69B4", "#00FFFF"][Math.floor(Math.random() * 3)],
        vy: Math.random() * 1 + 0.5,
        opacity: 1,
      };
      setParticles((prev) => [...prev.slice(-20), newParticle]);
    };

    return (
      <div
        ref={parentRef}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      >
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
            }}
            className="absolute rounded-full transition-opacity duration-100"
          />
        ))}
      </div>
    );
  };

  const CardWithTrail = ({ post }) => {
    const parentRef = useRef();
    return (
      <Link
        to={`/blog/${post.id}`}
        className="group relative block rounded-2xl transition-transform duration-300 transform hover:scale-105 hover:shadow-2xl"
      >
        <Card className="rounded-2xl overflow-hidden relative">
          <CardContent className="p-0 relative">
            {renderMedia(post)}

            {/* Sparkle trail */}
            <SparkleTrail parentRef={parentRef} />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/20 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl z-10 p-4">
              <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="font-bold text-lg text-white mb-1">{post.title}</h3>
                <p className="text-sm text-gray-200 mb-2">{post.excerpt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-6 text-center">Stories & Testimonials</h1>

      {/* Filter Tabs */}
      {renderTabs(["all", "image", "video"], "type")}
      {renderTabs(locations, "location")}
      {renderTabs(authors, "author")}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <CardWithTrail key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No posts match the selected filters.</div>
      )}
    </div>
  );
}
