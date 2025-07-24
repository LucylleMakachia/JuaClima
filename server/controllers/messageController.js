import Message from "../models/message.js";

// 🚀 GET recent messages (limit 100)
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

// 📩 POST a new message (with optional image and metadata)
export const postMessage = async (req, res) => {
  try {
    const {
      username,
      content,
      tag,
      emoji,
      parentId,
      lat,
      lng,
    } = req.body;

    if (!username || !content) {
      return res.status(400).json({ message: "Missing username or content" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newMessage = new Message({
      username,
      content,
      tag: tag || null,
      emoji: emoji || null,
      parentId: parentId || null,
      lat: lat || null,
      lng: lng || null,
      imageUrl,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ Error saving message:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 🔄 Save message (used in socket or internal calls)
export const saveMessage = async (data) => {
  try {
    const newMsg = new Message({
      username: data.username,
      content: data.content,
      tag: data.tag || null,
      emoji: data.emoji || null,
      parentId: data.parentId || null,
      lat: data.lat || null,
      lng: data.lng || null,
      imageUrl: data.imageUrl || null,
    });
    await newMsg.save();
  } catch (err) {
    console.error("❌ Error saving socket message:", err.message);
  }
};
