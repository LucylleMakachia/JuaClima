import Message from "../models/Message.js";

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

export const postMessage = async (req, res) => {
  const { username, content, tag, emoji } = req.body;

  if (!username || !content) {
    return res.status(400).json({ message: "Missing username or content" });
  }

  try {
    const newMessage = new Message({
      username,
      content,
      tag: tag || null,
      emoji: emoji || null
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveMessage = async (data) => {
  try {
    const newMsg = new Message(data);
    await newMsg.save();
  } catch (err) {
    console.error("❌ Error saving socket message:", err.message);
  }
};
