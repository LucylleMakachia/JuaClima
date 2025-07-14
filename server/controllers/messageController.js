import Message from "../models/Message.js";

// GET all messages (latest 100)
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

// POST a message via HTTP (optional if using Socket.io)
export const postMessage = async (req, res) => {
  const { username, content } = req.body;

  if (!username || !content) {
    return res.status(400).json({ message: "Missing username or content" });
  }

  try {
    const newMessage = new Message({ name: username, text: content, time: new Date().toLocaleTimeString() });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SAVE message via socket.io
export const saveMessage = async (data) => {
  try {
    const message = new Message(data);
    await message.save();
  } catch (err) {
    console.error("❌ Failed to save message to DB:", err.message);
  }
};
