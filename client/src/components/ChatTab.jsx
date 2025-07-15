import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:5000");

export default function ChatTab() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [tag, setTag] = useState("");
  const [filter, setFilter] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const name = user?.fullName || "Anonymous";

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [data, ...prev]);
      toast.info(`${data.name}: ${data.text || "[image]"}`);
    });

    socket.on("user_typing", (username) => {
      if (username !== name) {
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    socket.on("online_users", (users) => {
      setOnlineCount(users.length);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("online_users");
    };
  }, [name]);

  useEffect(() => {
    if (text.trim()) {
      socket.emit("typing", name);
    }
  }, [text, name]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!name || (!text && !imageFile)) return;

    let imageUrl = null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", "juaclima-chat"); // Your Cloudinary preset
      const res = await fetch("https://api.cloudinary.com/v1_1/dtuakmjnr/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      imageUrl = data.secure_url;
    }

    const message = {
      name,
      text,
      imageUrl,
      tag,
      time: new Date().toISOString(),
      parentId: replyTo?._id || null,
    };

    socket.emit("send_message", message, (acknowledged) => {
      if (acknowledged?.status === "ok") {
        toast.success("✅ Message delivered");
      } else {
        toast.error("❌ Message not delivered");
      }
    });

    setText("");
    setImageFile(null);
    setReplyTo(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-2">🗣️ Community Chat</h2>
      <p className="text-sm text-green-600 mb-4">🟢 {onlineCount} users online</p>

      {/* Filter by Tag */}
      <div className="mb-4">
        <label htmlFor="filter" className="font-medium mr-2">Filter by Tag:</label>
        <select
          id="filter"
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
          className="border p-2 rounded"
        >
          <option value="">All</option>
          <option value="alert">🚨 Alert</option>
          <option value="help">🆘 Help</option>
          <option value="discussion">💬 Discussion</option>
        </select>
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <p className="text-sm italic text-gray-500 mb-2">
          {typingUser} is typing...
        </p>
      )}

      {/* Reply Mode */}
      {replyTo && (
        <div className="bg-gray-100 p-2 rounded mb-2">
          Replying to: <strong>{replyTo.name}</strong> — {replyTo.text?.slice(0, 100)}
          <button onClick={() => setReplyTo(null)} className="ml-2 text-red-600">✖ Cancel</button>
        </div>
      )}

      {/* Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto mb-4">
        {messages
          .filter((msg) => !filter || msg.tag === filter)
          .map((msg, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <strong>{msg.name}</strong>
                <span className="text-xs text-gray-500">{format(msg.time)}</span>
              </div>
              {msg.tag && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2 mt-1">
                  {msg.tag === "alert" && "🚨 Alert"}
                  {msg.tag === "help" && "🆘 Help"}
                  {msg.tag === "discussion" && "💬 Discussion"}
                </span>
              )}
              {msg.text && <p className="mt-1">{msg.text}</p>}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="mt-2 rounded w-full object-cover"
                />
              )}
              <button
                onClick={() => setReplyTo(msg)}
                className="text-sm text-blue-500 mt-2"
              >
                ↪️ Reply
              </button>
            </div>
          ))}
      </div>

      {/* Chat Form */}
      <form onSubmit={sendMessage} className="flex flex-col gap-2 md:flex-row md:items-center mb-4">
        <input
          type="text"
          placeholder="Type your message..."
          className="border p-2 rounded w-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          type="button"
          className="text-xl"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          😊
        </button>

        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">No Tag</option>
          <option value="alert">🚨 Alert</option>
          <option value="help">🆘 Help</option>
          <option value="discussion">💬 Discussion</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="mb-4">
          <EmojiPicker
            onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
          />
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}
