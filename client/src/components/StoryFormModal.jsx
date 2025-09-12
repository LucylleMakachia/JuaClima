import React, { useState } from "react";
import axios from "axios";

const StoryFormModal = ({ isOpen, onClose, addToast }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    story: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value)
      );

      await axios.post("/api/stories", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      addToast("✅ Story submitted! Pending approval.", "success");
      setFormData({ name: "", email: "", story: "", image: null });
      onClose();
    } catch (error) {
      console.error(error);
      addToast("❌ Failed to submit story. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Share Your Story</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="w-full p-2 border rounded-lg"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="w-full p-2 border rounded-lg"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="story"
            placeholder="Your story..."
            rows="4"
            className="w-full p-2 border rounded-lg"
            value={formData.story}
            onChange={handleChange}
            required
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 dark:bg-gray-700 text-black dark:text-white py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StoryFormModal;
