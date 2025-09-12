import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Help() {
  const [faqs, setFaqs] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/faqs?page=1&limit=100"
        );
        const grouped = groupAndSort(res.data.data);
        setFaqs(grouped);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };

    fetchFaqs();
  }, []);

  const groupAndSort = (data) => {
    const categoryOrder = ["General", "Data", "Map Tools", "Account", "Community"];
    const grouped = {};
    categoryOrder.forEach((category) => {
      const filtered = data.filter(
        (faq) => faq.category.toLowerCase() === category.toLowerCase()
      );
      if (filtered.length > 0) grouped[category] = filtered;
    });
    return grouped;
  };

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
    } catch {
      setErrorMsg("Network error. Please try again later.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
          Help & Support
        </h1>

        {/* Getting Started */}
        <section id="getting-started" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Getting Started
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Create an account by signing up or logging in.</li>
            <li>Choose your package (Guest, Basic, Premium).</li>
            <li>Explore dashboards, datasets, and map tools.</li>
            <li>Visit the community chat to connect with other users.</li>
          </ul>
        </section>

        {/* Account Management */}
        <section id="account" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Account Management
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Update profile info and password.</li>
            <li>Manage your subscription/package.</li>
            <li>Set preferences for notifications and dashboards.</li>
            <li>Recover your password if forgotten.</li>
          </ul>
        </section>

        {/* Using Map & Tools */}
        <section id="map-tools" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Map & Tools
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>View datasets and climate risk zones on the map.</li>
            <li>Draw shapes to filter datasets.</li>
            <li>Search locations using the search bar above the map.</li>
            <li>Preview datasets in CSV, chart, or raster formats.</li>
            <li>Download datasets if signed in.</li>
          </ul>
        </section>

        {/* Community & Chat */}
        <section id="community" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Community & Chat
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Join public or private community chat based on package.</li>
            <li>Share insights, reports, or questions with other members.</li>
            <li>Rate posts for accuracy and relevance.</li>
            <li>Moderators ensure a safe and productive environment.</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Frequently Asked Questions
          </h2>
          {Object.entries(faqs).map(([category, questions]) => (
            <div key={category} className="mb-10">
              <h3 className="text-xl font-semibold text-green-700 mb-4">{category}</h3>
              <div className="space-y-6">
                {questions.map((faq) => (
                  <div
                    key={faq._id}
                    className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Contact Form */}
        <section id="contact" className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Contact Us
          </h2>
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

            {status === "success" && <p className="text-green-600 font-semibold">Your message has been sent successfully!</p>}
            {status === "error" && <p className="text-red-600 font-semibold">{errorMsg}</p>}

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
