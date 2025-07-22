import express from "express";
import Contact from "../models/contact.js";

const router = express.Router();

// POST new contact message
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newMessage = new Contact({ name, email, subject, message });
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;
