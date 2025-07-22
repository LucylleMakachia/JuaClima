import express from "express";
import FAQ from "../models/faq.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET FAQs with optional search & pagination, grouped by category
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { question: { $regex: search, $options: "i" } },
            { answer: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const faqs = await FAQ.find(query)
      .sort({ category: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
      .exec();

    const total = await FAQ.countDocuments(query);

    // Group by category
    const grouped = faqs.reduce((acc, faq) => {
      acc[faq.category] = acc[faq.category] || [];
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.json({
      faqs: grouped,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Failed to fetch FAQs:", err);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// POST new FAQ (admin-only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { category, question, answer } = req.body;
  try {
    const newFaq = new FAQ({ category, question, answer });
    await newFaq.save();
    res.status(201).json(newFaq);
  } catch (err) {
    res.status(400).json({ error: "Failed to add FAQ" });
  }
});

// PUT update FAQ by ID (admin-only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { category, question, answer } = req.body;
  try {
    const updatedFaq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { category, question, answer },
      { new: true, runValidators: true }
    );
    if (!updatedFaq) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    res.json(updatedFaq);
  } catch (err) {
    res.status(400).json({ error: "Failed to update FAQ" });
  }
});

// DELETE FAQ by ID (admin-only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deletedFaq = await FAQ.findByIdAndDelete(req.params.id);
    if (!deletedFaq) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    res.json({ message: "FAQ deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});

export default router;
