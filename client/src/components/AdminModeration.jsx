import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function AdminModeration({ user }) {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      query: { token: user ? "admin" : null },
    });

    socketRef.current.on("flagged_messages", (msgs) => setFlaggedMessages(msgs));

    socketRef.current.on("message_deleted", (msgId) => {
      setFlaggedMessages((prev) => prev.filter((msg) => msg._id !== msgId));
    });

    socketRef.current.emit("get_flagged_messages");

    return () => socketRef.current.disconnect();
  }, [user]);

  const handleDelete = (id) => {
    socketRef.current.emit("delete_message", id);
  };

  const handleMarkReviewed = (id) => {
    socketRef.current.emit("mark_reviewed", id);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Flagged Messages</h2>
      <ul className="space-y-2">
        {flaggedMessages.map((msg) => (
          <li key={msg._id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <strong>{msg.name}</strong>: {msg.text.slice(0, 50)}...
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleDelete(msg._id)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={() => handleMarkReviewed(msg._id)}
                className="px-2 py-1 bg-gray-500 text-white rounded"
              >
                Reviewed
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
