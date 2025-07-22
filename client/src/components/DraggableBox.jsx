import { useEffect, useRef } from "react";
import { Rectangle, useMap } from "react-leaflet";
import L from "leaflet";

export default function DraggableBBox({ bounds, onChange }) {
  const map = useMap();
  const rectRef = useRef();

  useEffect(() => {
    const rect = rectRef.current;

    if (!rect) return;
    const leafletElem = rect._path ? rect : rect.leafletElement;

    // Convert bounds to LatLngBounds
    const leafletBounds = L.latLngBounds(bounds);

    // Create rectangle with draggable behavior
    const draggableRect = L.rectangle(leafletBounds, {
      color: "blue",
      weight: 1,
      draggable: true,
    }).addTo(map);

    draggableRect.dragging?.enable?.();

    draggableRect.on("dragend", () => {
      const newBounds = draggableRect.getBounds();
      onChange([
        [newBounds.getSouthWest().lat, newBounds.getSouthWest().lng],
        [newBounds.getNorthEast().lat, newBounds.getNorthEast().lng],
      ]);
    });

    return () => {
      draggableRect.remove();
    };
  }, [map, bounds, onChange]);

  return null; // Rectangle is handled manually
}
