import React from "react";
import ChatTab from "../components/ChatTab";
import { useUser } from "@clerk/clerk-react";

export default function Chat({ mode }) {
  const { isSignedIn } = useUser(); 

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-10">
      <div className="max-w-7xl mx-auto w-full">
        {/* Chat Section */}
        <ChatTab isSignedIn={isSignedIn} mode={mode} />
      </div>
    </div>
  );
}
