import React from "react";
import { Tooltip } from "react-tooltip";

const DatasetCard = ({ dataset, canDownload }) => {
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Handle download
  const handleDownload = () => {
    if (!canDownload) return;

    if (dataset.downloadUrl) {
      window.open(dataset.downloadUrl, "_blank", "noopener,noreferrer");
    } else if (dataset.fileUrl) {
      window.open(dataset.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      alert("Download not available for this dataset");
    }
  };

  // Handle view details (can be extended for navigation or modal)
  const handleViewDetails = () => {
    console.log("View details for dataset:", dataset._id);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 relative"
      role="region"
      aria-label={`Dataset card for ${dataset.name || dataset.title || "Untitled Dataset"}`}
    >
      {/* Header */}
      <div className="mb-3">
        <h3
          className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1"
          title={dataset.name || dataset.title}
        >
          {dataset.name || dataset.title || "Untitled Dataset"}
        </h3>

        {dataset.category && (
          <span
            className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full"
            title={`Category: ${dataset.category}`}
          >
            {dataset.category}
          </span>
        )}
      </div>

      {/* Description */}
      {dataset.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3" title={dataset.description}>
          {dataset.description}
        </p>
      )}

      {/* Metadata */}
      <div className="space-y-2 mb-4 text-sm text-gray-500">
        {dataset.source && (
          <div className="flex items-center" title={`Source: ${dataset.source}`}>
            <span className="font-medium">Source:</span>
            <span className="ml-1">{dataset.source}</span>
          </div>
        )}

        {dataset.uploadedAt && (
          <div className="flex items-center" title={`Uploaded: ${formatDate(dataset.uploadedAt)}`}>
            <span className="font-medium">Uploaded:</span>
            <span className="ml-1">{formatDate(dataset.uploadedAt)}</span>
          </div>
        )}

        {dataset.fileSize && (
          <div className="flex items-center" title={`File Size: ${formatFileSize(dataset.fileSize)}`}>
            <span className="font-medium">Size:</span>
            <span className="ml-1">{formatFileSize(dataset.fileSize)}</span>
          </div>
        )}

        {dataset.format && (
          <div className="flex items-center" title={`Format: ${dataset.format.toUpperCase()}`}>
            <span className="font-medium">Format:</span>
            <span className="ml-1 uppercase">{dataset.format}</span>
          </div>
        )}
      </div>

      {/* Geospatial indicator */}
      {dataset.geojson && (
        <div className="flex items-center mb-3" title="Contains geographic data" aria-label="Contains geographic data">
          <span className="text-green-600 text-sm" role="img" aria-label="location pin">
            📍 Contains geographic data
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
          aria-label={`View details for dataset ${dataset.name || dataset.title || "Untitled Dataset"}`}
        >
          View Details
        </button>

        <button
          onClick={handleDownload}
          data-tooltip-id={!canDownload ? `tooltip-${dataset._id}` : undefined}
          data-tooltip-content={!canDownload ? "You must be logged in to download datasets" : ""}
          className={`flex-1 ${
            canDownload
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          } text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200`}
          aria-disabled={!canDownload}
          aria-label={
            canDownload
              ? `Download dataset ${dataset.name || dataset.title || "Untitled Dataset"}`
              : "Login required to download datasets"
          }
          disabled={!canDownload}
        >
          {canDownload ? "Download" : "Login to Download"}
        </button>
      </div>

      {/* Tooltip */}
      {!canDownload && <Tooltip id={`tooltip-${dataset._id}`} />}

      {/* Tags */}
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {dataset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
                title={`Tag: ${tag}`}
              >
                {tag}
              </span>
            ))}
            {dataset.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500" title={`${dataset.tags.length - 3} more tags`}>
                +{dataset.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DatasetCard);
