import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: "General" },
    isPublic: { type: Boolean, default: true },        
    createdBy: { type: String, default: "anonymous" }, 
  },
  { timestamps: true }
);

export default mongoose.model("FAQ", faqSchema);
