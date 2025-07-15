import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser, useAuth } from "@clerk/clerk-react";

export default function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      return toast.error("📂 File and title are required");
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "juaclima-chat");

    let fileUrl = "";
    let fileType = file.name.split(".").pop();

    try {
      const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dtuakmjnr/auto/upload", {
        method: "POST",
        body: formData,
      });

      const cloudData = await cloudRes.json();
      fileUrl = cloudData.secure_url;
    } catch (err) {
      console.error(err);
      toast.error("❌ File upload failed");
      setUploading(false);
      return;
    }

    const token = await getToken();

    try {
      const res = await fetch("http://localhost:5000/api/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          fileUrl,
          fileType,
          uploadedBy: user?.id,
          username: user?.fullName || "Anonymous",
        }),
      });

      if (res.ok) {
        toast.success("✅ Dataset uploaded successfully!");
        setFile(null);
        setTitle("");
        setCategory("");
        setDescription("");
      } else {
        toast.error("❌ Upload failed. Check server.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">📊 Upload Climate Dataset</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          accept=".csv, .xlsx, .xls, .geojson, .json"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Dataset Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          <option value="climate">Climate</option>
          <option value="disaster">Disaster Risk</option>
          <option value="vulnerability">Vulnerability</option>
        </select>

        <textarea
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Dataset"}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
