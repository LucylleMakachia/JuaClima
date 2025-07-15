import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    text: { type: String, required: true },
    emoji: String,
    tag: { type: String, enum: ["alert", "help", "discussion", ""], default: "" },
    location: { lat: Number, lng: Number },
    imageUrl: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
