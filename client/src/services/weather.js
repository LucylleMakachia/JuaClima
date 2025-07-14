import axios from "axios";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export const getWeatherByCoords = async (lat, lng) => {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m`;
  const res = await axios.get(url);
  return res.data.current;
};
