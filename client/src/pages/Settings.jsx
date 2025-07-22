// src/pages/Settings.jsx
import { useUser, useClerk } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("light");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isSignedIn) return navigate("/sign-in");

    // Load metadata if available
    const meta = user?.publicMetadata || {};
    setDisplayName(user?.username || "");
    setLocation(meta.location || "");
    setTheme(meta.theme || "light");
  }, [user, isSignedIn, navigate]);

  const handleSave = async () => {
    try {
      await user.update({
        username: displayName,
        publicMetadata: {
          location,
          theme,
        },
      });
      setStatus("✅ Settings saved!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error saving settings");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-6 text-green-700">Profile Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="light">🌞 Light</option>
            <option value="dark">🌚 Dark</option>
          </select>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            onClick={handleSave}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800"
          >
            Save Settings
          </button>

          <button
            onClick={() => signOut()}
            className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Logout
          </button>
        </div>

        {status && <p className="mt-2 text-sm text-green-600">{status}</p>}
      </div>
    </div>
  );
}
