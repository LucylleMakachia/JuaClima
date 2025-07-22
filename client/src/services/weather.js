import axios from "axios";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export const getWeatherByCoords = async (lat, lng) => {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lng}`
    + `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,uv_index,cloud_cover`
    + `&hourly=precipitation&timezone=auto`;

  const res = await axios.get(url);
  const { current, hourly } = res.data;

  if (!hourly || !hourly.time || !hourly.precipitation) {
    // fallback if no hourly data
    return { ...current, precipitation: current.precipitation || 0 };
  }

  const now = new Date();
  now.setMinutes(0, 0, 0, 0); // Round down to start of current hour
  const nowHourISO = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

  const hourIndex = hourly.time.findIndex(t => t.startsWith(nowHourISO));
  const precipitation = hourIndex !== -1 ? hourly.precipitation[hourIndex] : 0;

  return { ...current, precipitation };
};
