import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { createZone } from "../services/api";
import L from 'leaflet';

function FitBounds({ zones }) {
  const map = useMap();

  useEffect(() => {
    if (zones.length === 0) return;

    const bounds = L.latLngBounds(
      zones.map((zone) => [zone.location.lat, zone.location.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [zones, map]);

  return null;
}
