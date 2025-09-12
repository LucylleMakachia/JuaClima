import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: String, default: "Anonymous" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String },
  content: { type: String, required: true },
  media: { type: String },
  type: { type: String, enum: ["image", "video"], default: "image" },
  author: { type: String },
  location: { type: String },
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
});

export default mongoose.model("BlogPost", blogPostSchema);
