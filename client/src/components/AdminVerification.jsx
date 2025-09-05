import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function AdminVerification({ user }) {
  const [requests, setRequests] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      query: { token: user ? "admin" : null },
    });

    socketRef.current.on("verification_requests", (data) => setRequests(data));

    socketRef.current.emit("get_verification_requests");

    return () => socketRef.current.disconnect();
  }, [user]);

  const handleApprove = (id) => {
    socketRef.current.emit("approve_verification", id);
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const handleReject = (id) => {
    socketRef.current.emit("reject_verification", id);
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Verification Requests</h2>
      <ul className="space-y-2">
        {requests.map((req) => (
          <li key={req.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <strong>{req.name}</strong> ({req.org || "Independent"} / {req.role || "-"})
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleApprove(req.id)}
                className="px-2 py-1 bg-green-500 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(req.id)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
