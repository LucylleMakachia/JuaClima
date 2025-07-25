import FAQ from '../models/faq.js';
import logger from '../utils/logger.js';

/**
 * @desc Get paginated list of FAQs
 * @route GET /api/faqs
 * @access Public or Protected (optional)
 */
export const getFaqs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { $or: [{ isPublic: true }, { isPublic: { $exists: false } }] };
    const total = await FAQ.countDocuments(query);
    const faqs = await FAQ.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: faqs,
    });
  } catch (error) {
    logger.error("Full FAQ fetch error:", error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

/**
 * @desc Get a single FAQ by ID
 * @route GET /api/faqs/:id
 * @access Public or Protected (optional)
 */
export const getFaqById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json(faq);
  } catch (error) {
    logger.error("Error fetching FAQ by ID:", error);
    res.status(500).json({ message: "Error retrieving FAQ" });
  }
};

/**
 * @desc Create a new FAQ
 * @route POST /api/faqs
 * @access Admin only
 */
export const createFaq = async (req, res) => {
  try {
    const { category, question, answer, isPublic } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newFaq = await FAQ.create({
      category,
      question,
      answer,
      isPublic: isPublic ?? true,
      createdBy: req.user?.id || 'anonymous',
    });

    res.status(201).json(newFaq);
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
};

/**
 * @desc Update a FAQ
 * @route PUT /api/faqs/:id
 * @access Admin only
 */
export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer, isPublic } = req.body;

    const faq = await FAQ.findById(id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    faq.category = category ?? faq.category;
    faq.question = question ?? faq.question;
    faq.answer = answer ?? faq.answer;
    faq.isPublic = isPublic ?? faq.isPublic;

    const updated = await faq.save();
    res.status(200).json(updated);
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
};

/**
 * @desc Delete a FAQ
 * @route DELETE /api/faqs/:id
 * @access Admin only
 */
export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
};
