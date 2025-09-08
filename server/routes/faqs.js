import express from "express";
import FAQ from "../models/faq.js";
import { withAuthMiddleware, requireAdmin } from "../middleware/auth.js";
import { getFaqs } from "../controllers/faqController.js";

const router = express.Router();

// -------------------
// Public GET routes
// -------------------

// GET all FAQs (paginated)
router.get("/", getFaqs);

// GET single FAQ by ID
router.get("/:id", async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving FAQ", error: err.message });
  }
});

// -------------------
// Protected Admin routes
// -------------------

// Apply auth middleware to admin routes
router.use(withAuthMiddleware);

// CREATE new FAQ (Admins only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    const newFAQ = await FAQ.create({
      question,
      answer,
      category,
      createdBy: req.user.id,
    });
    res.status(201).json(newFAQ);
  } catch (err) {
    res.status(400).json({ message: "Failed to create FAQ", error: err.message });
  }
});

// UPDATE FAQ (Admins only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "FAQ not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update FAQ", error: err.message });
  }
});

// DELETE FAQ (Admins only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await FAQ.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "FAQ not found" });
    res.json({ message: "FAQ deleted" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete FAQ", error: err.message });
  }
});

export default router;
