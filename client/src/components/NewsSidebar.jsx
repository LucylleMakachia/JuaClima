import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NewsSidebar() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/news");
        setNewsItems(res.data);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <aside className="w-full lg:w-[280px] bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Climate News
      </h3>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="space-y-3">
        {newsItems.map((item, index) => (
          <li key={index}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {item.title}
            </a>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(item.date).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
