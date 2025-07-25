import React, { useEffect, useState } from "react";
import ChatTab from "../components/ChatTab";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";

export default function Chat() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/news"); // Adjust this URL if needed
        setNews(res.data.data || []);
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };
    fetchNews();
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 px-4 py-10">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto w-full gap-6">
          <div className="flex-1">
            <ChatTab />
          </div>
          <aside className="w-full lg:w-1/4 bg-white border border-gray-200 rounded-xl shadow p-4 max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Latest Climate News</h2>
            {news.length === 0 ? (
              <p className="text-gray-500">No news available.</p>
            ) : (
              <ul className="space-y-4">
                {news.map((item) => (
                  <li key={item._id} className="border-b border-gray-100 pb-2">
                    <a
                      href={item.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      {item.title}
                    </a>
                    <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
