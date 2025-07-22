import mongoose from "mongoose";
import FAQ from "./models/faq.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const faqSeedData = [
  {
    category: "General",
    question: "What is JuaClima?",
    answer:
      "JuaClima is a climate risk platform that helps communities, researchers, and decision-makers visualize and analyze climate-related data in Kenya.",
  },
  {
    category: "Data",
    question: "How can I upload my own dataset?",
    answer:
      "You can upload datasets via the Datasets page. Supported formats include CSV, GeoJSON, SHP (zipped), and GeoTIFF. Ensure you’re logged in.",
  },
  {
    category: "Data",
    question: "What formats are supported?",
    answer: "We support CSV, GeoJSON, SHP (as ZIP), and GeoTIFF raster formats.",
  },
  {
    category: "Map Tools",
    question: "How do I filter data by location?",
    answer:
      "Use the map tools to draw a bounding box or polygon. This filters datasets by your selected area.",
  },
  {
    category: "Account",
    question: "Who can use the platform?",
    answer:
      "Both technical and non-technical users can access JuaClima, including NGOs, CSOs, farmers, and policy makers.",
  },
  {
    category: "Account",
    question: "Is there a premium version?",
    answer:
      "Yes, premium users access advanced features like saved filters, extended storage, and additional downloads.",
  },
];

async function seedFAQs() {
  try {
    await mongoose.connect("mongodb+srv://climauser:8hBd9UqugITrFBE6@juaclima.z6jxhbl.mongodb.net/?retryWrites=true&w=majority&appName=JuaClima", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log("Existing FAQs cleared");

    // Insert seed FAQs
    await FAQ.insertMany(faqSeedData);
    console.log("FAQs seeded successfully");

    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding FAQs:", error);
    mongoose.disconnect();
  }
}

seedFAQs();
