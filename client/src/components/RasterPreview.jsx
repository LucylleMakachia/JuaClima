import RasterExport from "./RasterExport";

export default function RasterPreview({ previewUrl, meta, datasetId }) {
  if (!previewUrl || !meta) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">🖼️ Raster Preview</h3>
      <img src={previewUrl} alt="GeoTIFF Preview" className="border rounded" />
      <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
        {JSON.stringify(meta, null, 2)}
      </pre>
      {/* Move RasterExport INSIDE the component and pass datasetId as prop */}
      {datasetId && <RasterExport datasetId={datasetId} />}
    </div>
  );
}