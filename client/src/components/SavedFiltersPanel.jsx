import { GeoJSON } from "react-leaflet";

export default function SavedFiltersPanel({
  savedFilters,
  onApplyFilter,
  onDeleteFilter,
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-md font-semibold">Saved Filters</h3>
      <ul className="text-sm space-y-1">
        {savedFilters.map((f) => (
          <li
            key={f._id}
            className="flex justify-between items-center space-x-2"
          >
            <button
              onClick={() => onApplyFilter(f.geometry)}
              className="text-blue-600 underline"
            >
              {f.name}
            </button>
            <button
              onClick={() => onDeleteFilter(f._id)}
              className="text-red-500 text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {savedFilters.map((f) => (
        <GeoJSON key={f._id} data={f.geometry} style={{ color: "green" }} />
      ))}
    </div>
  );
}
