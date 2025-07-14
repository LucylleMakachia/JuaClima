import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";

const socket = io("http://localhost:5000");

export default function ChatTab() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [location, setLocation] = useState(null);
  const chatBoxRef = useRef(null);
  const [image, setImage] = useState(null);


  useEffect(() => {
  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch old messages:", err);
    }
  };

  fetchMessages();
}, []);

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocation(null);
      }
    );
  }, []);

  // Handle receiving messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  const sendMessage = async (e) => {
  e.preventDefault();
  if (!name || (!text && !image)) return;

  let imageUrl = "";

  if (image) {
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      imageUrl = data.url;
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }

      const message = {
          name,
          text,
          time: new Date().toLocaleTimeString(),
          imageUrl
       };

  socket.emit("send_message", message);
  setText("");
  setImage(null);
};

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-4">🗣️ Community Chat</h2>

      <div
        ref={chatBoxRef}
        className="h-64 overflow-y-scroll border p-2 rounded bg-gray-50 mb-4"
      >
    {messages.map((msg, i) => (
        <div key={i} className="mb-2">
            <strong>{msg.name}</strong>{" "}
            <span className="text-xs text-gray-500">({msg.time})</span>
            <p className="ml-2">{msg.text}</p>

            {msg.imageUrl && (
            <img
                src={msg.imageUrl}
                alt="upload"
                className="max-w-xs mt-2 rounded ml-2"
            />
            )}
        </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex flex-col md:flex-row gap-2">
        {!user && (
          <input
            type="text"
            placeholder="Your name"
            className="border p-2 rounded flex-1"
            disabled
          />
        )}
        <input
          type="text"
          placeholder="Type a message..."
          className="border p-2 rounded flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="border p-2 rounded"
        />
      </form>
    </div>
  );
}
