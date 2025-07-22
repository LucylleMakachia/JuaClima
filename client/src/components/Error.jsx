import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const Error = ({ 
  message = "Something went wrong", 
  details = null, 
  onRetry = null, 
  showHomeButton = false,
  type = "error" // "error", "warning", "network", "notfound"
}) => {
  const getIcon = () => {
    switch (type) {
      case "network":
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "notfound":
        return <AlertTriangle className="w-12 h-12 text-gray-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "notfound":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "warning":
        return "text-yellow-800";
      case "notfound":
        return "text-gray-800";
      default:
        return "text-red-800";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <div className={`max-w-md w-full ${getBackgroundColor()} border rounded-lg p-6 text-center`}>
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        
        <h3 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
          {type === "notfound" ? "Not Found" : "Error Occurred"}
        </h3>
        
        <p className={`mb-4 ${getTextColor()}`}>
          {message}
        </p>
        
        {details && (
          <div className="mb-4 p-3 bg-white rounded border text-left">
            <p className="text-sm text-gray-600 font-medium mb-1">Details:</p>
            <p className="text-xs text-gray-500 font-mono break-words">
              {details}
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
          
          {showHomeButton && (
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized error components
export const NetworkError = ({ onRetry }) => (
  <Error
    type="network"
    message="Unable to connect to the server"
    details="Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const NotFoundError = ({ message = "The requested resource was not found" }) => (
  <Error
    type="notfound"
    message={message}
    showHomeButton={true}
  />
);

export const APIError = ({ error, onRetry }) => (
  <Error
    message="Failed to load data"
    details={error?.message || error?.toString()}
    onRetry={onRetry}
  />
);

export default Error;