import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";

const AdminFAQManager = () => {
  const { user } = useUser();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ category: "", question: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/faqs");
      setFaqs(res.data);
    } catch (err) {
      setError("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "/api/faqs",
        form,
        {
          headers: {
            "x-user-id": user.id, // Clerk user ID
          },
        }
      );
      setFaqs((prev) => [...prev, res.data]);
      setForm({ category: "", question: "", answer: "" });
    } catch (err) {
      setError("Failed to add FAQ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/faqs/${id}`, {
        headers: {
          "x-user-id": user.id,
        },
      });
      setFaqs((prev) => prev.filter((faq) => faq._id !== id));
    } catch (err) {
      setError("Failed to delete FAQ");
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Admin FAQ Manager</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <form onSubmit={handleAdd} className="space-y-4 mb-8">
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full"
        />
        <input
          type="text"
          name="question"
          placeholder="Question"
          value={form.question}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full"
        />
        <textarea
          name="answer"
          placeholder="Answer"
          value={form.answer}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add FAQ
        </button>
      </form>

      {loading ? (
        <p>Loading FAQs...</p>
      ) : (
        <ul className="space-y-4">
          {faqs.map((faq) => (
            <li key={faq._id} className="border p-4 rounded shadow">
              <div className="font-semibold">{faq.category}</div>
              <div className="text-gray-800">{faq.question}</div>
              <div className="text-gray-600">{faq.answer}</div>
              <button
                onClick={() => handleDelete(faq._id)}
                className="mt-2 text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminFAQManager;
