import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // Use consistent sender naming
    username: { type: String, required: true },

    // Main message content
    content: { type: String, required: true },

    // Emoji string (optional)
    emoji: { type: String, default: "" },

    // Tag enum
    tag: {
      type: String,
      enum: ["alert", "help", "discussion", ""],
      default: "",
    },

    // Location object (optional)
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // Image URL (optional)
    imageUrl: { type: String, default: "" },

    // Reference to parent message if this is a reply
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true,
    strictPopulate: false 
   }
);

export default mongoose.model("Message", MessageSchema);
