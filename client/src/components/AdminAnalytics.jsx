import React from "react";

export default function AdminAnalytics() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Analytics</h2>
      <p>📊 Messages, reactions, and user activity charts go here (use Chart.js / Recharts).</p>
      <ul className="list-disc pl-6 mt-2">
        <li>Messages per day/week/month</li>
        <li>Top reactors (like/love/laugh/angry)</li>
        <li>Active users online</li>
      </ul>
    </div>
  );
}
