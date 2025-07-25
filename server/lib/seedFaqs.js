import FAQ from "../models/faq.js";

export const sampleFaqs = [
  {
    question: "What is JuaClima?",
    answer: "JuaClima is a climate risk platform designed to visualize and analyze weather and environmental data for Kenya and beyond.",
    category: "General"
  },
  {
    question: "How do I upload a dataset?",
    answer: "You can upload datasets via the Upload tab after signing in. Supported formats include CSV, GeoJSON, SHP (as .zip), and GeoTIFF.",
    category: "Data"
  },
  {
    question: "How can I preview my uploaded file?",
    answer: "Uploaded datasets are automatically previewed on the map or as charts depending on the format (spatial, tabular, or raster).",
    category: "Data"
  },
  {
    question: "Is JuaClima free to use?",
    answer: "JuaClima has both free and premium tiers. Most basic features are free; premium features include advanced analytics and more storage.",
    category: "Accounts"
  },
  {
    question: "Who can I contact for support?",
    answer: "Use the Contact page to reach out to our support team or send an email to support@juaclima.org.",
    category: "Support"
  }
];

export async function seedFaqsIfEmpty() {
  try {
    const count = await FAQ.countDocuments();
    if (count === 0) {
      await FAQ.insertMany(sampleFaqs);
      console.log("✅ Seeded FAQs: inserted", sampleFaqs.length, "items.");
    } else {
      console.log("✅ FAQs already exist. Skipping seeding.");
    }
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error);
  }
}
