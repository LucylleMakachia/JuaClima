import axios from "axios";

export async function getAllDatasets() {
  try {
    const response = await axios.get("/api/datasets");
    return response.data;
  } catch (error) {
    console.error("Error fetching datasets:", error);
    throw error;
  }
}

// New function to get weather data for any location worldwide
export async function getLocationWeather(lat, lng) {
  try {
    const response = await axios.get(`/api/weather/location?lat=${lat}&lng=${lng}`);
    return response.data.weather;
  } catch (error) {
    console.error("Error fetching location weather:", error);
    throw error;
  }
}

// Get weather data for multiple global cities (for initial dataset population)
export async function getGlobalCitiesWeather() {
  try {
    const response = await axios.get("/api/weather/global-cities");
    return response.data;
  } catch (error) {
    console.error("Error fetching global cities weather:", error);
    throw error;
  }
}