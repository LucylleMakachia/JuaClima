import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`text-gray-700 dark:text-gray-200 ${className}`}>{children}</div>;
}
