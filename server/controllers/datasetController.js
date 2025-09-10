import Dataset from "../models/Dataset.js";

// Create a new dataset
export const createDataset = async (req, res) => {
  try {
    const { title, category, description, fileUrl, userId, username, fileType, originalFilename, geoBounds } = req.body;

    // Validate required fields (optional - could also use middleware or schema validation)
    if (!title || !fileUrl || !fileType) {
      return res.status(400).json({ error: "Title, File URL, and File Type are required." });
    }

    const newDataset = new Dataset({
      title,
      category,
      description,
      fileUrl,
      fileType,
      originalFilename,
      geoBounds,
      uploadedBy: { userId, username },
    });

    const saved = await newDataset.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating dataset:", err);
    res.status(500).json({ error: "Failed to create dataset" });
  }
};

// Retrieve all datasets, sorted by newest first
export const getAllDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    res.json(datasets);
  } catch (err) {
    console.error("Error fetching datasets:", err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};
