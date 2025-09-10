import axios from "axios";

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHERSTACK_API_KEY = process.env.WEATHERSTACK_API_KEY;
const WEATHERSTACK_BASE_URL = "http://api.weatherstack.com/current";

// OpenWeatherMap current weather fetch
export const fetchOpenWeatherMapCurrent = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("OpenWeatherMap fetch error", err);
    throw err;
  }
};

// Open-Meteo forecast fetch
export const fetchOpenMeteoForecast = async (lat, lon) => {
  // Example: hourly temperature and precipitation
  const url = `${OPEN_METEO_BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation`;
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("OpenMeteo fetch error", err);
    throw err;
  }
};

// Weatherstack current weather fetch
export const fetchWeatherstackCurrent = async (query) => {
  const url = `${WEATHERSTACK_BASE_URL}?access_key=${WEATHERSTACK_API_KEY}&query=${query}`;
  try {
    const res = await axios.get(url);
    if (res.data.success === false) {
      throw new Error(res.data.error.info);
    }
    return res.data;
  } catch (err) {
    console.error("Weatherstack fetch error", err);
    throw err;
  }
};
