import React, { useState, useEffect } from "react";

const FAQForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [category, setCategory] = useState(initialData.category || "");
  const [question, setQuestion] = useState(initialData.question || "");
  const [answer, setAnswer] = useState(initialData.answer || "");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategory(initialData.category || "");
    setQuestion(initialData.question || "");
    setAnswer(initialData.answer || "");
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category.trim() || !question.trim() || !answer.trim()) {
      setError("All fields are required");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        category: category.trim(),
        question: question.trim(),
        answer: answer.trim(),
      });

      // Reset form after successful submit (optional)
      setCategory("");
      setQuestion("");
      setAnswer("");
    } catch (err) {
      setError("Failed to save FAQ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow" noValidate>
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label htmlFor="faq-category" className="block font-semibold mb-1">
          Category
        </label>
        <input
          id="faq-category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="e.g. General, Data, Account"
          disabled={submitting}
          required
        />
      </div>
      <div>
        <label htmlFor="faq-question" className="block font-semibold mb-1">
          Question
        </label>
        <input
          id="faq-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter question"
          disabled={submitting}
          required
        />
      </div>
      <div>
        <label htmlFor="faq-answer" className="block font-semibold mb-1">
          Answer
        </label>
        <textarea
          id="faq-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows={4}
          placeholder="Enter answer"
          disabled={submitting}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default FAQForm;
