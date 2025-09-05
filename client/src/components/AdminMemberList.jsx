import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminMemberList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Placeholder API call
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">All Members</h2>
      <table className="w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Avatar</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Org / Role</th>
            <th className="border px-2 py-1">Verified</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1">
                <Link to={`/profile/${user.name}`}>
                  <img
                    src={user.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                </Link>
              </td>
              <td className="border px-2 py-1">{user.name}</td>
              <td className="border px-2 py-1">{user.org || "Independent"} / {user.role || "-"}</td>
              <td className="border px-2 py-1">{user.verified ? "✅" : "❌"}</td>
              <td className="border px-2 py-1 space-x-2">
                <button className="px-2 py-1 bg-blue-500 text-white rounded">View</button>
                <button className="px-2 py-1 bg-red-500 text-white rounded">Deactivate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
