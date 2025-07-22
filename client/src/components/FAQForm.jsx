import React, { useState, useEffect } from "react";

const FAQForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [category, setCategory] = useState(initialData.category || "");
  const [question, setQuestion] = useState(initialData.question || "");
  const [answer, setAnswer] = useState(initialData.answer || "");
  const [error, setError] = useState(null);

  useEffect(() => {
    setCategory(initialData.category || "");
    setQuestion(initialData.question || "");
    setAnswer(initialData.answer || "");
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !question || !answer) {
      setError("All fields are required");
      return;
    }
    setError(null);
    onSubmit({ category, question, answer });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block font-semibold mb-1">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="e.g. General, Data, Account"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter question"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows={4}
          placeholder="Enter answer"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save
        </button>
      </div>
    </form>
  );
};

export default FAQForm;
