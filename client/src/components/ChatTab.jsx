import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaHeart, FaThumbsUp, FaThumbsDown, FaReply, FaShare, FaBookmark, FaFlag } from "react-icons/fa";

const DUMMY_CHATS = [
  {
    _id: "1",
    name: "Amina Njeri",
    avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "The heatwave this week is intense! How is everyone coping?",
    tag: "alert",
    time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    replies: [
      {
        _id: "1-1",
        name: "Kwame Boateng",
        avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg",
        text: "Staying hydrated and indoors as much as possible.",
        time: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      },
      {
        _id: "1-2",
        name: "Fatou Diallo",
        avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
        text: "We need more trees in the city for shade!",
        time: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
    ],
  },
  {
    _id: "2",
    name: "Samuel Okoro",
    avatarUrl: "https://randomuser.me/api/portraits/men/66.jpg",
    text: "Heavy rains flooded my street last night. Anyone else affected?",
    tag: "alert",
    time: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    replies: [
      {
        _id: "2-1",
        name: "Zuri Moyo",
        avatarUrl: "https://randomuser.me/api/portraits/women/69.jpg",
        text: "Yes, the drainage system needs urgent repairs.",
        time: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
      },
    ],
  },
  {
    _id: "3",
    name: "Chinedu Eze",
    avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
    text: "Let’s organize a community clean-up this weekend to reduce plastic waste.",
    tag: "discussion",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    replies: [
      {
        _id: "3-1",
        name: "Amina Njeri",
        avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg",
        text: "Great idea! Count me in.",
        time: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      },
      {
        _id: "3-2",
        name: "Kwame Boateng",
        avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg",
        text: "I’ll bring gloves and bags.",
        time: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
      },
    ],
  },
  {
    _id: "4",
    name: "Fatou Diallo",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    text: "Does anyone have tips for starting a home garden in a small space?",
    tag: "help",
    time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    replies: [
      {
        _id: "4-1",
        name: "Samuel Okoro",
        avatarUrl: "https://randomuser.me/api/portraits/men/66.jpg",
        text: "Try using vertical planters or recycled containers!",
        time: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ],
  },
  {
    _id: "5",
    name: "Zuri Moyo",
    avatarUrl: "https://randomuser.me/api/portraits/women/69.jpg",
    text: "Solar panels have really reduced my electricity bills. Highly recommend!",
    tag: "discussion",
    time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    replies: [
      {
        _id: "5-1",
        name: "Chinedu Eze",
        avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
        text: "How much did installation cost you?",
        time: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
      {
        _id: "5-2",
        name: "Fatou Diallo",
        avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
        text: "Did you get any government support for it?",
        time: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      },
    ],
  },
];

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
  const [reactions, setReactions] = useState({});
  const [showReplies, setShowReplies] = useState({});

  const socketRef = useRef(null);
  const name = user?.fullName || "Anonymous";
  const avatarUrl = user?.profileImageUrl || null;

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [data, ...prev]);
      toast.info(`${data.name}: ${data.text || "[image]"}`);
    });

    socketRef.current.on("user_typing", (username) => {
      if (username !== name) {
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineCount(users.length);
    });

    socketRef.current.on("initial_messages", (msgs) => {
      setMessages(msgs.reverse());
    });

    socketRef.current.emit("get_messages");

    return () => {
      socketRef.current.disconnect();
    };
  }, [name]);

  useEffect(() => {
    if (text.trim() && socketRef.current) {
      socketRef.current.emit("typing", name);
    }
  }, [text, name]);

  // Show dummy chats if no real messages
  const displayMessages = messages.length === 0 ? DUMMY_CHATS : messages;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!name || (!text && !imageFile)) return;

    let imageUrl = null;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "juaclima-chat");
        const res = await fetch("https://api.cloudinary.com/v1_1/dtuakmjnr/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        imageUrl = data.secure_url;
      } catch (err) {
        toast.error("Image upload failed.");
        return;
      }
    }

    const message = {
      _id: Date.now().toString(),
      name,
      avatarUrl,
      text,
      imageUrl,
      tag,
      time: new Date().toISOString(),
      parentId: replyTo?._id || null,
      replies: [],
    };

    socketRef.current.emit("send_message", message, (acknowledged) => {
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

  // Local reaction handler (for demo, backend support recommended)
  const handleReaction = (msgId, type) => {
    setReactions(prev => ({
      ...prev,
      [msgId]: {
        ...prev[msgId],
        [type]: (prev[msgId]?.[type] || 0) + 1
      }
    }));
  };

  const toggleReplies = (msgId) => {
    setShowReplies(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleReplySubmit = (parentMsg, replyText) => {
    if (!replyText.trim()) return;
    const reply = {
      _id: Date.now().toString(),
      name,
      avatarUrl,
      text: replyText,
      time: new Date().toISOString(),
    };
    setMessages(msgs =>
      msgs.map(msg =>
        msg._id === parentMsg._id
          ? { ...msg, replies: [...(msg.replies || []), reply] }
          : msg
      )
    );
    setShowReplies(prev => ({ ...prev, [parentMsg._id]: true }));
  };

  const handleShare = (msg) => {
    navigator.clipboard.writeText(msg.text || "");
    toast.success("Message copied to clipboard!");
  };

  // Placeholder for bookmark/report
  const handleBookmark = () => toast.info("Bookmark feature coming soon!");
  const handleReport = () => toast.info("Report feature coming soon!");

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
        <span>🗣️ Community Chat</span>
        {/* Global Actions Upper Right */}
        <div className="flex gap-2">
          <button
            onClick={() => toast.info("Share feature coming soon!")}
            className="flex items-center gap-1 text-purple-600 border px-2 py-1 rounded hover:bg-purple-50"
            title="Share"
          >
            <FaShare /> Share
          </button>
          <button
            onClick={() => toast.info("Bookmark feature coming soon!")}
            className="flex items-center gap-1 text-yellow-600 border px-2 py-1 rounded hover:bg-yellow-50"
            title="Bookmark"
          >
            <FaBookmark /> Bookmark
          </button>
          <button
            onClick={() => toast.info("Report feature coming soon!")}
            className="flex items-center gap-1 text-gray-600 border px-2 py-1 rounded hover:bg-gray-100"
            title="Report"
          >
            <FaFlag /> Report
          </button>
        </div>
      </h2>
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
      <div className="flex flex-col gap-6 mb-8 w-full max-w-4xl mx-auto">
        {displayMessages
          .filter((msg) => !filter || msg.tag === filter)
          .map((msg, i) => (
            <div
              key={msg._id || i}
              className={`p-4 bg-gray-50 rounded shadow-sm border transition hover:shadow-lg w-full ${
                msg.name === name ? "border-blue-400" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.avatarUrl && (
                  <img src={msg.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
                )}
                <strong>{msg.name}</strong>
                <span className="text-xs text-gray-500">{format(msg.time)}</span>
                {msg.tag && (
                  <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">
                    {msg.tag === "alert" && "🚨 Alert"}
                    {msg.tag === "help" && "🆘 Help"}
                    {msg.tag === "discussion" && "💬 Discussion"}
                  </span>
                )}
              </div>
              {msg.text && <p className="mt-1 text-base">{msg.text}</p>}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="mt-2 rounded w-full object-cover max-h-72"
                />
              )}
              {/* Action Buttons under message */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={() => handleReaction(msg._id, "heart")} className="flex items-center gap-1 text-red-500 border px-2 py-1 rounded hover:bg-red-50">
                  <FaHeart /> Heart {reactions[msg._id]?.heart || 0}
                </button>
                <button onClick={() => handleReaction(msg._id, "up")} className="flex items-center gap-1 text-green-600 border px-2 py-1 rounded hover:bg-green-50">
                  <FaThumbsUp /> Like {reactions[msg._id]?.up || 0}
                </button>
                <button onClick={() => handleReaction(msg._id, "down")} className="flex items-center gap-1 text-gray-600 border px-2 py-1 rounded hover:bg-gray-100">
                  <FaThumbsDown /> Dislike {reactions[msg._id]?.down || 0}
                </button>
                <button onClick={() => setReplyTo(msg)} className="flex items-center gap-1 text-blue-500 border px-2 py-1 rounded hover:bg-blue-50">
                  <FaReply /> Reply
                </button>
                <button onClick={() => handleShare(msg)} className="flex items-center gap-1 text-purple-500 border px-2 py-1 rounded hover:bg-purple-50">
                  <FaShare /> Share
                </button>
                <button onClick={handleBookmark} className="flex items-center gap-1 text-yellow-500 border px-2 py-1 rounded hover:bg-yellow-50">
                  <FaBookmark /> Bookmark
                </button>
                <button onClick={handleReport} className="flex items-center gap-1 text-gray-400 border px-2 py-1 rounded hover:bg-gray-100">
                  <FaFlag /> Report
                </button>
              </div>
              {/* Replies */}
              {msg.replies && msg.replies.length > 0 && (
                <button onClick={() => toggleReplies(msg._id)} className="text-xs text-blue-600 mt-2">
                  {showReplies[msg._id] ? "Hide Replies" : `View Replies (${msg.replies.length})`}
                </button>
              )}
              {showReplies[msg._id] && msg.replies && (
                <div className="ml-4 mt-2 border-l pl-2">
                  {msg.replies.map((reply, idx) => (
                    <div key={reply._id || idx} className="mb-2 flex items-center gap-2">
                      {reply.avatarUrl && (
                        <img src={reply.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />
                      )}
                      <strong>{reply.name}</strong>: {reply.text}
                      <span className="text-xs text-gray-400">{format(reply.time)}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Reply input */}
              {replyTo && replyTo._id === msg._id && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleReplySubmit(msg, text);
                    setText("");
                    setReplyTo(null);
                  }}
                  className="flex gap-2 mt-2"
                >
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    className="border p-2 rounded w-full"
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                  <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Send</button>
                </form>
              )}
            </div>
          ))}
      </div>

      {/* Chat Form */}
      <form onSubmit={sendMessage} className="flex flex-col gap-2 md:flex-row md:items-center mb-8 w-full max-w-4xl mx-auto">
        <input
          type="text"
          placeholder="Type your message..."
          className="border p-2 rounded w-full text-base"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Emoji picker button */}
        <button
          type="button"
          className="text-xl px-2"
          title="Add emoji"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          😊
        </button>

        {/* Attach image */}
        <label className="flex items-center cursor-pointer px-2" title="Attach image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="hidden"
          />
          <span role="img" aria-label="Attach">📎</span>
        </label>

        {/* Tag selector */}
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="border p-2 rounded"
          title="Select tag"
        >
          <option value="">No Tag</option>
          <option value="alert">🚨 Alert</option>
          <option value="help">🆘 Help</option>
          <option value="discussion">💬 Discussion</option>
        </select>

        {/* Send button */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          title="Send"
        >
          Send
        </button>

        {/* Edit button (placeholder, only enabled if editing) */}
        <button
          type="button"
          className="bg-yellow-400 text-white px-3 py-2 rounded disabled:opacity-50"
          title="Edit (coming soon)"
          disabled
        >
          Edit
        </button>

        {/* Clear/reset button */}
        <button
          type="button"
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded"
          title="Clear"
          onClick={() => {
            setText("");
            setImageFile(null);
            setTag("");
            setReplyTo(null);
          }}
        >
          Clear
        </button>

        {/* Preview button (placeholder) */}
        <button
          type="button"
          className="bg-green-400 text-white px-3 py-2 rounded"
          title="Preview (coming soon)"
          disabled
        >
          Preview
        </button>
      </form>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="mb-4 z-50">
          <EmojiPicker
            onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
            width={350}
            height={400}
            theme="light"
            searchDisabled={false}
            emojiStyle="native"
          />
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}