import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get("/api/faqs?page=1&limit=100");
        const grouped = groupAndSort(res.data.data);
        setFaqs(grouped);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };

    fetchFaqs();
  }, []);

  const groupAndSort = (data) => {
    const categoryOrder = ["General", "Data", "Map Tools", "Account"];
    const grouped = {};

    categoryOrder.forEach((category) => {
      const filtered = data.filter(
        (faq) => faq.category.toLowerCase() === category.toLowerCase()
      );
      if (filtered.length > 0) {
        grouped[category] = filtered;
      }
    });

    return grouped;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
            Frequently Asked Questions
          </h1>

          {Object.entries(faqs).map(([category, questions]) => (
            <div key={category} className="mb-10">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">{category}</h2>
              <div className="space-y-6">
                {questions.map((faq) => (
                  <div
                    key={faq._id}
                    className="bg-white shadow rounded-xl p-5 border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
