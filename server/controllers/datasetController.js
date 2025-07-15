import Dataset from "../models/Dataset.js";

export const createDataset = async (req, res) => {
  try {
    const { title, category, description, fileUrl, userId, username } = req.body;

    const newDataset = new Dataset({
      title,
      category,
      description,
      fileUrl,
      uploadedBy: { userId, username },
    });

    const saved = await newDataset.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};
