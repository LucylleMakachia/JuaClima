import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: { lat: Number, lng: Number },
    imageUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
