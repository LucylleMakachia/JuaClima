import { useState } from "react";
import { postZone } from "../services/api";

const RiskZoneForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    riskLevel: "Low",
    location: { lat: "", lng: "" },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "lat" || name === "lng") {
      setForm({
        ...form,
        location: { ...form.location, [name]: value },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...form,
        location: {
          lat: parseFloat(form.location.lat),
          lng: parseFloat(form.location.lng),
        },
      };
      const res = await postZone(formatted);
      onAdd(res.data);
      setForm({ name: "", riskLevel: "Low", location: { lat: "", lng: "" } });
    } catch (err) {
      console.error("Failed to submit zone:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Zone Name"
        value={form.name}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />
      <select
        name="riskLevel"
        value={form.riskLevel}
        onChange={handleChange}
        className="border p-2 w-full"
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <input
        type="number"
        name="lat"
        placeholder="Latitude"
        value={form.location.lat}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />
      <input
        type="number"
        name="lng"
        placeholder="Longitude"
        value={form.location.lng}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Zone
      </button>
    </form>
  );
};

export default RiskZoneForm;
