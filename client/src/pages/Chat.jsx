import React from "react";
import ChatTab from "../components/ChatTab";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; 
import { useUser } from "@clerk/clerk-react";

export default function Chat() {
  const { isSignedIn } = useUser(); 

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 px-4 py-10">
        <div className="max-w-7xl mx-auto w-full">
          {/* Chat Section */}
          <ChatTab isSignedIn={isSignedIn} />
        </div>
      </div>
      <Footer />
    </>
  );
}
