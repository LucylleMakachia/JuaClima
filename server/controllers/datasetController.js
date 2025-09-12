import Dataset from "../models/Dataset.js";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import * as turf from "@turf/turf";
import { fetchCombinedClimateData } from "../services/climateAggregatorService.js";

const getUsernameFromUserId = async (userId, fallback = "Unknown") => {
  if (!userId) return fallback;
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.firstName || user.lastName || user.username || fallback;
  } catch {
    return fallback;
  }
};

export const createDataset = async (req, res) => {
  try {
    const { title, category, description, fileUrl, userId, username, fileType, originalFilename, geoBounds } = req.body;

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

export const importClimate = async (req, res) => {
  try {
    const { lat, lon, startDate, endDate, title } = req.body;
    const { userId } = getAuth(req);
    const username = await getUsernameFromUserId(userId, "Unknown");

    const climateData = await fetchCombinedClimateData(lat, lon, startDate, endDate);

    const dataset = await Dataset.create({
      title,
      description: `Imported climate data from ${startDate} to ${endDate}`,
      category: "climate",
      fileUrl: "",
      fileType: "json",
      geoBounds: {},
      uploadedBy: { userId, username },
      username,
      data: climateData,
    });

    res.status(201).json({
      message: "Climate data imported successfully",
      dataset,
    });
  } catch (err) {
    console.error("Failed to import climate data", err);
    res.status(500).json({ error: "Failed to import climate data." });
  }
};

export const getAllDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    res.json(datasets);
  } catch (err) {
    console.error("Error fetching datasets:", err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};

export const getDatasets = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 6, 50);
  const skip = (page - 1) * limit;
  const { bbox, q } = req.query;

  const query = {};

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    if ([minLng, minLat, maxLng, maxLat].some(isNaN) || minLng >= maxLng || minLat >= maxLat) {
      return res.status(400).json({ error: "Invalid bbox parameter" });
    }
    query["geoBounds"] = {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat],
            ],
          ],
        },
      },
    };
  }

  try {
    const [datasets, total] = await Promise.all([
      Dataset.find(query).skip(skip).limit(limit),
      Dataset.countDocuments(query),
    ]);

    res.json({
      datasets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Failed to fetch datasets", err);
    res.status(500).json({ error: "Failed to fetch datasets." });
  }
};

export const getAreaDatasets = async (req, res) => {
  try {
    const { lat, lon, radius = 50 } = req.query;
    const { user } = req;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = Math.min(Math.max(parseFloat(radius) || 50, 1), 500);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }

    const radiusInRadians = radiusKm / 6378.1; // Earth radius in km

    const isPremiumUser = user?.publicMetadata?.roles?.includes("premium");

    const query = {
      geoBounds: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
      $or: [
        { isPrivate: { $ne: true } },
        ...(isPremiumUser ? [{}] : []), // Allow private non-public datasets for premium users
      ],
    };

    const datasets = await Dataset.find(query)
      .limit(100)
      .select("title description category fileType fileUrl geoBounds uploadedBy createdAt updatedAt isPrivate")
      .lean();

    const enhancedDatasets = datasets.map((d) => ({
      id: d._id,
      title: d.title,
      description: d.description || "",
      category: d.category || "other",
      fileType: d.fileType,
      fileUrl: d.fileUrl,
      geoBounds: d.geoBounds,
      uploadedByUser: d.uploadedBy?.username || "Unknown",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      isPrivate: d.isPrivate || false,
      centroid: d.geoBounds?.type === "Polygon" && d.geoBounds.coordinates.length
        ? turf.centroid({ type: "Feature", geometry: d.geoBounds }).geometry.coordinates
        : null,
    }));

    return res.json({
      datasets: enhancedDatasets,
      metadata: {
        center: [longitude, latitude],
        radius_km: radiusKm,
        count: enhancedDatasets.length,
      },
    });
  } catch (err) {
    console.error("Failed to fetch area datasets", err);
    return res.status(500).json({ error: "Failed to fetch datasets." });
  }
};

export const updateDataset = async (req, res) => {
  try {
    const updated = await Dataset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Failed to update dataset", err);
    res.status(500).json({ error: "Failed to update dataset." });
  }
};

export const deleteDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const { userId } = getAuth(req);
    if (dataset.uploadedBy.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this dataset" });
    }

    await dataset.deleteOne();
    res.json({ message: "Dataset deleted successfully." });
  } catch (err) {
    console.error("Failed to delete dataset", err);
    res.status(500).json({ error: "Failed to delete dataset." });
  }
};
