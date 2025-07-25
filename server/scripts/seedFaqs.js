import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedFaqsIfEmpty } from "../lib/seedFaqs.js";

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/juaclima");
    console.log("✅ Connected to MongoDB");

    await seedFaqsIfEmpty();

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0); // success
  } catch (err) {
    console.error("❌ MongoDB connection error or seeding error:", err);
    process.exit(1); // failure
  }
}

main();
