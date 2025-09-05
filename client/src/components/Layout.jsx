import React from "react";
import NewsSidebar from "./NewsSidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <NewsSidebar />
      <main style={{ flexGrow: 1 }}>{children}</main>
    </div>
  );
}
