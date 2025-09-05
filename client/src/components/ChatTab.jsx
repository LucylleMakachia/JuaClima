import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaReply,
  FaShare,
  FaFlag,
  FaCamera,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const DUMMY_PUBLIC_CHATS = [
  {
    _id: "pub-1",
    name: "Community Alert",
    org: "Weather Org",
    role: "System",
    text: "Heavy rains expected this weekend in Nairobi. Stay safe!",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    replies: [],
    reactions: {
      like: { count: 2, users: ["Jane Doe", "John Smith"] },
      love: { count: 1, users: ["Alice"] },
      laugh: { count: 0, users: [] },
      angry: { count: 0, users: [] },
    },
    isPrivate: false,
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=communityAlert",
    reviewed: false,
    tag: "alert",
    lat: null,
    lng: null,
  },
  {
    _id: "pub-2",
    name: "Jane Doe",
    org: "Solar Initiative",
    role: "Engineer",
    text: "Solar panel installation tips for your home.",
    time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    replies: [],
    reactions: {
      like: { count: 1, users: ["John Smith"] },
      love: { count: 0, users: [] },
      laugh: { count: 1, users: ["Alice"] },
      angry: { count: 0, users: [] },
    },
    isPrivate: false,
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=janedoe",
    reviewed: false,
    tag: "discussion",
    lat: null,
    lng: null,
  },
];

const DUMMY_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=default";

export default function ChatTab({ isSignedIn }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editText, setEditText] = useState(null);
  const [editMsgId, setEditMsgId] = useState(null);
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReplies, setShowReplies] = useState({});
  const [viewPrivate, setViewPrivate] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [tag, setTag] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const name = user?.fullName || "Guest";
  const avatarUrl = user?.profileImageUrl || DUMMY_AVATAR;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        toast.success("Location attached for next message.");
      },
      (err) => {
        toast.error("Failed to retrieve location: " + err.message);
      }
    );
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      query: { token: user ? (user.isAdmin ? "admin" : "signed-in") : null },
    });

    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [msg, ...prev];
      });
      scrollToBottom();
    });

    socketRef.current.on("user_typing", (username) => {
      if (username !== name) {
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    socketRef.current.on("online_users", (users) => setOnlineCount(users.length));

    socketRef.current.on("initial_messages", (msgs) => setMessages(msgs.reverse()));

    socketRef.current.on("message_edited", (editedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === editedMsg._id ? editedMsg : msg))
      );
    });

    socketRef.current.on("message_deleted", (msgId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
    });

    socketRef.current.on("reaction_updated", (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === data.messageId) {
            return {
              ...msg,
              reactions: {
                ...msg.reactions,
                [data.type]: {
                  count: data.count,
                  users: data.users,
                },
              },
            };
          }
          return msg;
        })
      );
    });

    socketRef.current.emit("get_messages");

    return () => socketRef.current.disconnect();
  }, [user, name]);

  useEffect(() => {
    if (text.trim() && socketRef.current) socketRef.current.emit("typing", name);
  }, [text, name]);

  function onEmojiClick(emojiData) {
    const emoji = emojiData.emoji;
    if (!inputRef.current) {
      setText((t) => t + emoji);
      return;
    }
    const el = inputRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setShowEmoji(false);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file && location.lat === null) return;

    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB.");
      return;
    }

    const tempId = Date.now().toString();

    let uploadedUrl = null;
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "juaclima-chat");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dtuakmjnr/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await res.json();
        uploadedUrl = data.secure_url;
      } catch {
        toast.error("File upload failed.");
        setFile(null);
        return;
      }
    }

    const optimisticMsg = {
      _id: tempId,
      name,
      avatarUrl,
      text,
      fileUrl: uploadedUrl,
      imageUrl: uploadedUrl && file?.type.startsWith("image/") ? uploadedUrl : null,
      tag,
      time: new Date().toISOString(),
      parentId: replyTo?._id || null,
      lat: location.lat,
      lng: location.lng,
      replies: [],
      reactions: {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        angry: { count: 0, users: [] },
      },
      isPrivate: !!user,
      reviewed: false,
      org: user?.organizationName || null,
      role: user?.role || null,
      pending: true,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);
    scrollToBottom();

    socketRef.current.emit("send_message", optimisticMsg, (ack) => {
      if (ack?.status === "ok") {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...m, pending: false, _id: ack.id || tempId } : m
          )
        );
        toast.success("Message sent!");
        setTag("");
        setLocation({ lat: null, lng: null });
      } else {
        toast.error("Failed to send message.");
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    });

    setText("");
    setFile(null);
    setReplyTo(null);
  };

  const editMessage = (msgId) => {
    const editingMsg = messages.find((msg) => msg._id === msgId);
    if (editingMsg) {
      setEditText(editingMsg.text);
      setEditMsgId(msgId);
    }
  };

  const submitEdit = () => {
    if (!editText.trim() || !editMsgId) return;
    const updatedMsg = messages.find((msg) => msg._id === editMsgId);
    if (!updatedMsg) return;

    const editedMessage = { ...updatedMsg, text: editText };
    socketRef.current.emit("edit_message", editedMessage, (ack) => {
      if (ack?.status === "ok") {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === editMsgId ? editedMessage : msg))
        );
        toast.success("Message edited!");
        setEditMsgId(null);
        setEditText(null);
      } else {
        toast.error("Failed to edit message.");
      }
    });
  };

  const cancelEdit = () => {
    setEditMsgId(null);
    setEditText(null);
  };

  const deleteMessage = (msgId) => {
    socketRef.current.emit("delete_message", msgId, (ack) => {
      if (ack?.status === "ok") {
        setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
        toast.success("Message deleted!");
      } else {
        toast.error("Failed to delete message.");
      }
    });
  };

  const toggleReplies = (msgId) =>
    setShowReplies((prev) => ({ ...prev, [msgId]: !prev[msgId] }));

  const reactToMessage = async (msgId, type) => {
    if (!isSignedIn || reacting) {
      if (!isSignedIn) toast.info("Please sign in to react to messages");
      return;
    }

    setReacting(true);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id === msgId) {
          const currentReaction = msg.reactions[type];
          const userAlreadyReacted = currentReaction.users.includes(name);

          let newUsers;
          let newCount;

          if (userAlreadyReacted) {
            newUsers = currentReaction.users.filter((u) => u !== name);
            newCount = Math.max(0, currentReaction.count - 1);
          } else {
            newUsers = [...currentReaction.users, name];
            newCount = currentReaction.count + 1;
          }

          socketRef.current.emit("reaction_update", {
            messageId: msgId,
            type,
            add: !userAlreadyReacted,
            user: name,
          });

          return {
            ...msg,
            reactions: {
              ...msg.reactions,
              [type]: {
                count: newCount,
                users: newUsers,
              },
            },
          };
        }
        return msg;
      })
    );

    setTimeout(() => setReacting(false), 300);
  };

  // Helper function to check if current user has reacted with type
  const hasUserReacted = (msg, type) => {
    return msg.reactions[type]?.users.includes(name);
  };

  const displayMessages = () => {
    let msgs = messages.length ? messages : DUMMY_PUBLIC_CHATS;
    if (!isSignedIn) return msgs.filter((m) => !m.isPrivate);
    return msgs.filter((m) => (viewPrivate ? m.isPrivate : !m.isPrivate));
  };

  // Rest of utility functions uploadProfilePicture, shareMessage, flagMessage unchanged

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
        <span>🗣️ Community Chat</span>
        {isSignedIn && (
          <label className="flex items-center space-x-2 text-sm">
            <span>Public</span>
            <input
              type="checkbox"
              checked={viewPrivate}
              onChange={() => setViewPrivate((v) => !v)}
              className="toggle-checkbox"
            />
            <span>Private</span>
          </label>
        )}
      </h2>

      <p className="text-sm text-green-600 mb-4">🟢 {onlineCount} users online</p>
      {typingUser && (
        <p className="text-sm italic text-gray-500 mb-2">{typingUser} is typing...</p>
      )}
      {replyTo && (
        <div className="bg-gray-100 p-2 rounded mb-2">
          Replying to: <strong>{replyTo.name}</strong> —{" "}
          {replyTo.text?.slice(0, 100)}
          <button
            onClick={() => setReplyTo(null)}
            className="ml-2 text-red-600 hover:underline"
          >
            ✖ Cancel
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 mb-8 w-full max-w-4xl mx-auto">
        {displayMessages().map((msg, index) => (
          <div
            key={msg._id + index}
            className={`p-4 rounded shadow-sm border ${
              msg.tag === "alert"
                ? "border-red-500 bg-red-50"
                : msg.tag === "help"
                ? "border-yellow-500 bg-yellow-50"
                : msg.tag === "discussion"
                ? "border-blue-500 bg-blue-50"
                : msg.name === name
                ? "border-blue-400 bg-white"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {msg.tag && (
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 mb-1">
                {msg.tag.toUpperCase()}
              </span>
            )}
            <div className="flex items-center gap-2 mb-1 relative">
              {(msg.avatarUrl || DUMMY_AVATAR) && (
                <Link
                  to={isSignedIn ? `/profile/${msg.name}` : "#"}
                  title={msg.name}
                  className={isSignedIn ? "hover:ring-2 hover:ring-blue-400 rounded-full" : ""}
                >
                  <img
                    src={msg.avatarUrl || DUMMY_AVATAR}
                    alt="avatar"
                    className="w-10 h-10 rounded-full cursor-pointer"
                  />
                </Link>
              )}
              <div className="flex flex-col">
                <strong>{msg.name}</strong>
                {msg.org && (
                  <span className="text-xs text-gray-500">
                    {msg.org} / {msg.role || "Member"}
                  </span>
                )}
                {msg.reviewed && (
                  <span className="text-xs text-green-600 ml-1">✔ Reviewed</span>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-auto">{format(msg.time)}</span>
              <div className="absolute top-5 right-0 flex gap-3 mt-1 mr-1 text-xs text-gray-500 items-center">
                <button disabled={!isSignedIn} onClick={() => setReplyTo(msg)} title="Reply">
                  <FaReply />
                </button>
                <button disabled={!isSignedIn} onClick={() => shareMessage(msg)} title="Share">
                  <FaShare />
                </button>
                <button disabled={!isSignedIn} onClick={() => flagMessage(msg)} title="Flag">
                  <FaFlag />
                </button>
                {msg.name === name && (
                  <>
                    {editMsgId === msg._id ? (
                      <>
                        <button onClick={submitEdit} title="Save" className="text-green-600">
                          <FaCheck />
                        </button>
                        <button onClick={cancelEdit} title="Cancel" className="text-red-600">
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => editMessage(msg._id)} title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => deleteMessage(msg._id)} title="Delete">
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            {editMsgId === msg._id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full border rounded p-2 resize-none mt-2"
                maxLength={500}
              />
            ) : (
              <>
                <p className="mt-1 text-base whitespace-pre-wrap">{msg.text}</p>
                {msg.imageUrl &&
                  (msg.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video controls className="max-w-xs mt-2 rounded">
                      <source src={msg.imageUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={msg.imageUrl} alt="attached" className="max-w-xs mt-2 rounded" />
                  ))}
                {msg.fileUrl &&
                  (!msg.fileUrl.match(/\.(mp4|webm|ogg|png|jpg|jpeg)$/i) ? (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline mt-2 block"
                    >
                      Download file
                    </a>
                  ) : null)}
                {msg.lat !== null && msg.lng !== null && (
                  <div
                    className="flex items-center gap-1 mt-2 text-sm text-blue-600 cursor-pointer"
                    onClick={() =>
                      window.open(`https://maps.google.com/?q=${msg.lat},${msg.lng}`, "_blank")
                    }
                    title="Open location in Google Maps"
                  >
                    <FaMapMarkerAlt />
                    <span>Shared location</span>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 mt-2 text-sm">
              {["like", "love", "laugh", "angry"].map((type) => {
                const emoji =
                  type === "like"
                    ? "👍"
                    : type === "love"
                    ? "❤️"
                    : type === "laugh"
                    ? "😀"
                    : "😡";

                const { count, users } = msg.reactions[type];
                const userReacted = hasUserReacted(msg, type);

                return (
                  <button
                    key={type}
                    onClick={() => reactToMessage(msg._id, type)}
                    disabled={!isSignedIn || reacting}
                    className={`px-2 py-1 rounded transition-all duration-200 ${
                      userReacted
                        ? type === "like"
                          ? "bg-blue-100 text-blue-600"
                          : type === "love"
                          ? "bg-pink-100 text-pink-600"
                          : type === "laugh"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    title={`${count} ${type}${count !== 1 ? "s" : ""}${
                      users.length > 0 ? ` (${users.join(", ")})` : ""
                    }`}
                    aria-label={`${userReacted ? "Remove" : "Add"} ${type} reaction`}
                  >
                    {reacting ? "⏳" : emoji}{" "}
                    {count > 0 && <span className="ml-1">{count}</span>}
                  </button>
                );
              })}
            </div>
            {msg.replies && msg.replies.length > 0 && (
              <div className="mt-4 ml-12 border-l-2 border-gray-300 pl-4">
                <button
                  onClick={() => toggleReplies(msg._id)}
                  className="text-blue-600 text-xs mb-2 hover:underline"
                  key={`showReplies-${msg._id}`}
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
                        {(reply.avatarUrl || DUMMY_AVATAR) && (
                          <Link to={isSignedIn ? `/profile/${reply.name}` : "#"}>
                            <img
                              src={reply.avatarUrl || DUMMY_AVATAR}
                              alt="avatar"
                              className="w-8 h-8 rounded-full cursor-pointer"
                            />
                          </Link>
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative">
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          disabled={!isSignedIn}
          className="mb-2 border rounded px-2 py-1"
          title="Select message category"
        >
          <option value="">Select category</option>
          <option value="alert">Alert</option>
          <option value="help">Help</option>
          <option value="discussion">Discussion</option>
          <option value="news">News</option>
          <option value="update">Update</option>
          {/* add other relevant categories */}
        </select>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          rows={4}
          maxLength={500}
          className="w-full border rounded p-3 resize-none"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 relative">
            {/* Accept images, videos, docs -- capture environment triggers camera on mobile */}
            <label htmlFor="fileupload" className="cursor-pointer text-gray-500" title="Upload file">
              <FaCamera />
            </label>
            <input
              id="fileupload"
              type="file"
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              capture="environment"
              className="hidden"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              disabled={!isSignedIn}
            />
            {file && (
              <span className="ml-2 text-sm text-gray-600">
                {file.name}
                <button
                  className="ml-1 text-red-600"
                  type="button"
                  onClick={() => setFile(null)}
                  title="Remove file"
                >
                  ✖
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={requestLocation}
              disabled={!isSignedIn}
              title="Attach current location"
              className="ml-4 p-1 rounded hover:bg-gray-200"
            >
              <FaMapMarkerAlt size={20} className="text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="text-2xl ml-4"
              title="Emoji Picker"
            >
              😊
            </button>

            {showEmoji && (
              <div className="absolute bottom-full mb-2 z-10">
                <EmojiPicker onEmojiClick={onEmojiClick} searchDisabled skinTonesDisabled />
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={!text.trim() && !file && location.lat === null}
              className="bg-blue-600 text-black px-4 py-2 rounded disabled:opacity-50"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => {
                setText("");
                setTag("");
                setFile(null);
                setLocation({ lat: null, lng: null });
              }}
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
