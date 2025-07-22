import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FAQ = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const userRoles = user?.publicMetadata?.roles || [];
  const isAdmin = userRoles.includes("admin");

  const [faqs, setFaqs] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
  });
  const [editTargetId, setEditTargetId] = useState(null);

  const limit = 10;

  // Fetch FAQs with search & pagination
  const fetchFaqs = async (search = "", pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/faqs?search=${encodeURIComponent(search)}&page=${pageNum}&limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      const data = await res.json();

      setFaqs(data.faqs || {});
      const cats = Object.keys(data.faqs || {});
      setCategories(cats);
      setSelectedCategory((prev) => (cats.includes(prev) ? prev : cats[0] || ""));
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs(searchQuery, page);
  }, [searchQuery, page]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const resetForm = () => {
    setFormData({ category: categories[0] || "", question: "", answer: "" });
    setEditTargetId(null);
    setShowForm(false);
    setFormMode("add");
  };

  // Admin: Submit add or edit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "jwt" });

      const method = formMode === "add" ? "POST" : "PUT";
      const url =
        formMode === "add" ? "/api/faqs" : `/api/faqs/${encodeURIComponent(editTargetId)}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save FAQ");
      }

      // Refresh FAQs after update
      fetchFaqs(searchQuery, page);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Delete FAQ
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "jwt" });
      const res = await fetch(`/api/faqs/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete FAQ");
      }
      fetchFaqs(searchQuery, page);
      setOpenIndex(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Start editing a FAQ
  const startEdit = (faq) => {
    setFormMode("edit");
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    });
    setEditTargetId(faq._id);
    setShowForm(true);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-6">Frequently Asked Questions</h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
              setOpenIndex(null);
              resetForm();
            }}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute top-2.5 right-3 text-gray-400" size={20} />
        </div>

        {/* Error and Loading */}
        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setOpenIndex(null);
                  resetForm();
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Admin: Add/Edit Form */}
        {isAdmin && (
          <div className="mb-8">
            {!showForm ? (
              <button
                onClick={() => {
                  setFormMode("add");
                  setFormData({ category: categories[0] || "", question: "", answer: "" });
                  setShowForm(true);
                  setOpenIndex(null);
                }}
                className="bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800"
              >
                + Add FAQ
              </button>
            ) : (
              <form
                onSubmit={handleFormSubmit}
                className="mt-4 p-4 bg-gray-100 rounded-xl space-y-4"
              >
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((fd) => ({ ...fd, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={formMode === "edit"}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Question"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((fd) => ({ ...fd, question: e.target.value }))
                  }
                  required
                />

                <textarea
                  placeholder="Answer"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData((fd) => ({ ...fd, answer: e.target.value }))
                  }
                  required
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    disabled={loading}
                  >
                    {formMode === "add" ? "Add FAQ" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="text-gray-600 hover:underline"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-4">
          {!loading &&
            (Object.keys(faqs).length === 0 ? (
              <p className="text-center text-gray-500">No FAQs found.</p>
            ) : (
              (searchQuery
                ? Object.values(faqs).flat()
                : faqs[selectedCategory] || []
              ).map((item, index) => (
                <div
                  key={item._id || index}
                  className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-white"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex justify-between items-center w-full text-left text-lg font-medium"
                  >
                    <span>
                      {item.question}
                      {searchQuery && item.category && (
                        <span className="text-sm text-gray-500 ml-2">
                          [{item.category}]
                        </span>
                      )}
                    </span>
                    {openIndex === index ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {openIndex === index && (
                    <div className="mt-3 text-gray-600">{item.answer}</div>
                  )}

                  {/* Admin Controls */}
                  {isAdmin && !searchQuery && (
                    <div className="mt-2 flex gap-3 text-sm text-blue-600">
                      <button onClick={() => startEdit(item)}>Edit</button>
                      <button
                        className="text-red-600"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ))}
        </div>

        {/* Pagination Controls */}
        {!searchQuery && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default FAQ;
