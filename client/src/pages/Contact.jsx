import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // 'success', 'error', or null
  const [errorMsg, setErrorMsg] = useState("");
  const [news, setNews] = useState([]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setErrorMsg("");

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await response.json();
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again later.");
      setStatus("error");
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/news");
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
      <main className="max-w-7xl mx-auto px-4 py-12 flex gap-8">
        <section className="flex-grow max-w-3xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
            <div>
              <label htmlFor="name" className="block font-medium mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-medium mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block font-medium mb-1">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block font-medium mb-1">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              ></textarea>
            </div>

            {status === "success" && (
              <p className="text-green-600 font-semibold">Your message has been sent successfully!</p>
            )}
            {status === "error" && (
              <p className="text-red-600 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </form>
        </section>

        <aside className="w-1/4 bg-white border border-gray-200 rounded-xl shadow p-4 max-h-[85vh] overflow-y-auto">
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
      </main>
      <Footer />
    </>
  );
};

export default Contact;
