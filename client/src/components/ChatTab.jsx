import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaReply, FaShare, FaBookmark, FaFlag } from "react-icons/fa";

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
  const [replyTo, setReplyTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReplies, setShowReplies] = useState({});
  const socketRef = useRef(null);

  const name = user?.fullName || "Anonymous";
  const avatarUrl = user?.profileImageUrl || "";

  useEffect(() => {
    if (!user) return;

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => [msg, ...prev]);
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
  }, [user, name]);

  useEffect(() => {
    if (text.trim() && socketRef.current) {
      socketRef.current.emit("typing", name);
    }
  }, [text, name]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!name || (!text.trim() && !imageFile)) return;

    let imageUrl = null;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "juaclima-chat");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dtuakmjnr/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await res.json();
        imageUrl = data.secure_url;
      } catch {
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

    socketRef.current.emit("send_message", message, (ack) => {
      if (ack?.status === "ok") {
        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message.");
      }
    });

    setText("");
    setImageFile(null);
    setReplyTo(null);
  };

  const toggleReplies = (msgId) => {
    setShowReplies((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
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
    setMessages((msgs) =>
      msgs.map((msg) =>
        msg._id === parentMsg._id
          ? { ...msg, replies: [...(msg.replies || []), reply] }
          : msg
      )
    );
    setShowReplies((prev) => ({ ...prev, [parentMsg._id]: true }));
  };

  const handleShare = (msg) => {
    navigator.clipboard.writeText(msg.text || "");
    toast.success("Message copied to clipboard!");
  };

  const handleBookmark = () => toast.info("Bookmark feature coming soon!");
  const handleReport = () => toast.info("Report feature coming soon!");

  const displayMessages = () => {
    if (!user) {
      return DUMMY_CHATS;
    }
    if (messages.length === 0) {
      return DUMMY_CHATS;
    }
    return messages;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
        <span>🗣️ Community Chat</span>
      </h2>
      <p className="text-sm text-green-600 mb-4">🟢 {onlineCount} users online</p>

      {typingUser && (
        <p className="text-sm italic text-gray-500 mb-2">{typingUser} is typing...</p>
      )}

      {replyTo && (
        <div className="bg-gray-100 p-2 rounded mb-2">
          Replying to: <strong>{replyTo.name}</strong> — {replyTo.text?.slice(0, 100)}
          <button
            onClick={() => setReplyTo(null)}
            className="ml-2 text-red-600 hover:underline"
          >
            ✖ Cancel
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 mb-8 w-full max-w-4xl mx-auto">
        {displayMessages().map((msg) => (
          <div
            key={msg._id}
            className={`p-4 bg-gray-50 rounded shadow-sm border ${
              msg.name === name ? "border-blue-400" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.avatarUrl && (
                <img
                  src={msg.avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <strong>{msg.name}</strong>
              <span className="text-xs text-gray-500 ml-auto">
                {format(msg.time)}
              </span>
            </div>
            {msg.tag && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-2">
                {msg.tag === "alert" && "🚨 Alert"}
                {msg.tag === "help" && "🆘 Help"}
                {msg.tag === "discussion" && "💬 Discussion"}
              </span>
            )}
            {msg.text && <p className="mt-1 text-base whitespace-pre-wrap">{msg.text}</p>}
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="attached"
                className="max-w-xs mt-2 rounded"
              />
            )}

            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <button
                onClick={() => setReplyTo(msg)}
                title="Reply"
                className="hover:text-blue-600"
              >
                <FaReply />
              </button>
              <button
                onClick={() => handleShare(msg)}
                title="Share"
                className="hover:text-green-600"
              >
                <FaShare />
              </button>
              <button
                onClick={handleBookmark}
                title="Bookmark"
                className="hover:text-yellow-600"
              >
                <FaBookmark />
              </button>
              <button
                onClick={handleReport}
                title="Report"
                className="hover:text-red-600"
              >
                <FaFlag />
              </button>
            </div>

            {/* Replies */}
            {msg.replies && msg.replies.length > 0 && (
              <div className="mt-4 ml-12 border-l-2 border-gray-300 pl-4">
                <button
                  onClick={() => toggleReplies(msg._id)}
                  className="text-blue-600 text-xs mb-2 hover:underline"
                >
                  {showReplies[msg._id] ? "Hide Replies" : `Show Replies (${msg.replies.length})`}
                </button>
                {showReplies[msg._id] &&
                  msg.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className="mb-3 p-2 bg-white rounded shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {reply.avatarUrl && (
                          <img
                            src={reply.avatarUrl}
                            alt="avatar"
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <strong>{reply.name}</strong>
                        <span className="text-xs text-gray-500 ml-auto">
                          {format(reply.time)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          rows={4}
          className="w-full border rounded p-3 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="text-2xl"
              title="Emoji Picker"
            >
              😊
            </button>
            {showEmoji && (
              <div className="absolute z-10">
                <EmojiPicker
                  onEmojiClick={(e, emojiObj) => {
                    setText((t) => t + emojiObj.emoji);
                    setShowEmoji(false);
                  }}
                  searchDisabled
                  skinTonesDisabled
                />
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={!text.trim() && !imageFile}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setText("")}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
