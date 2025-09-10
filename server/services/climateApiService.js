import axios from "axios";

const TOMORROW_API_KEY = process.env.TOMORROW_IO_API_KEY;
const WEATHERBIT_API_KEY = process.env.WEATHERBIT_API_KEY;
const VISUAL_CROSSING_API_KEY = process.env.VISUAL_CROSSING_API_KEY;

const TOMORROW_BASE_URL = "https://api.tomorrow.io/v4";
const WEATHERBIT_BASE_URL = "https://api.weatherbit.io/v2.0";
const VISUAL_CROSSING_BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";


// Fetch weather timelines from Tomorrow.io (forecast/historical data)
export const fetchTomorrowTimelines = async (
  lat,
  lon,
  fields = ["temperature", "precipitationIntensity"],
  timesteps = ["1h"],
  units = "metric",
  startTime,
  endTime
) => {
  const url = startTime && endTime ? `${TOMORROW_BASE_URL}/historical` : `${TOMORROW_BASE_URL}/timelines`;
  const params = {
    location: `${lat},${lon}`,
    fields,
    timesteps,
    units,
    apikey: TOMORROW_API_KEY,
  };
  if (startTime && endTime) {
    params.startTime = startTime;
    params.endTime = endTime;
  }
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Tomorrow.io API error:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch historical climate data from Weatherbit API
export const fetchWeatherbitHistorical = async (lat, lon, startDate, endDate, units = "M") => {
  // units "M" metric, "I" imperial
  const url = `${WEATHERBIT_BASE_URL}/history/hourly`;
  const params = {
    lat,
    lon,
    start_date: startDate,
    end_date: endDate,
    units,
    key: WEATHERBIT_API_KEY,
  };
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Weatherbit API error:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch climate timeline data from Visual Crossing API
export const fetchVisualCrossingTimeline = async (location, startDate, endDate, unitGroup = "metric") => {
  const url = `${VISUAL_CROSSING_API_BASE_URL}/${encodeURIComponent(location)}/${startDate}/${endDate}`;
  const params = {
    unitGroup,
    key: VISUAL_CROSSING_API_KEY,
    include: "days,hours",
    contentType: "json",
  };
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Visual Crossing API error:", error.response?.data || error.message);
    throw error;
  }
};
