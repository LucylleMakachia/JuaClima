import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

export default function useMapBounds() {
  const map = useMap();
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const currentBounds = map.getBounds();
      setBounds(currentBounds.toBBoxString());  
    returns [west, south, east, north]
    };

    updateBounds(); // Initial

    map.on("moveend", updateBounds);
    return () => {
      map.off("moveend", updateBounds);
    };
  }, [map]);

  return bounds;
}
