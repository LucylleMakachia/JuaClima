import * as turf from '@turf/turf';

import {
  fetchTomorrowTimelines,
  fetchWeatherbitHistorical,
  fetchVisualCrossingTimeline,
} from "./climateApiService.js";

import {
  fetchOpenWeatherMapCurrent,
  fetchOpenMeteoForecast,
  fetchWeatherstackCurrent,
} from "./weatherApiService.js";

/**
 * Normalize an array of numeric values to [0, 1].
 * Returns an array of normalized values.
 */
function normalizeArray(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0.5); // Avoid divide by zero
  return arr.map(x => (x - min) / (max - min));
}

/**
 * Extracts a field array safely from data[itemPath], 
 * e.g. to get temperatures or precipitation arrays.
 */
function extractFieldArray(data, pathArray) {
  try {
    let arr = pathArray.reduce((acc, cur) => (acc && acc[cur] !== undefined) ? acc[cur] : null, data);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

/**
 * Filters point-like data within a radiusKm around (lat, lon) using Turf.js
 * Assumes each data point has latitude and longitude (adjust paths if needed)
 */
function filterDataByRadius(dataPoints, centerLat, centerLon, radiusKm, latField = 'latitude', lonField = 'longitude') {
  const centerPoint = turf.point([centerLon, centerLat]);
  const radiusPolygon = turf.circle(centerPoint, radiusKm, { units: 'kilometers' });

  return dataPoints.filter(point => {
    const lat = point[latField];
    const lon = point[lonField];
    if (lat === undefined || lon === undefined) return false;
    const pt = turf.point([lon, lat]);
    return turf.booleanPointInPolygon(pt, radiusPolygon);
  });
}

/**
 * Aggregates and normalizes multiple weather parameters from various APIs.
 * Adds spatial filtering of data points within 50km radius around lat-lon.
 */
export const fetchCombinedClimateData = async (lat, lon, startDate, endDate, radiusKm = 50) => {
  try {
    const [
      tomorrowData,
      weatherbitData,
      visualCrossingData,
      openWeatherMapCurrent,
      openMeteoForecast,
      weatherstackCurrent
    ] = await Promise.all([
      fetchTomorrowTimelines(lat, lon, ["temperature", "precipitationIntensity", "windSpeed", "humidity"], ["1h"], "metric", startDate, endDate),
      fetchWeatherbitHistorical(lat, lon, startDate, endDate, "M"),
      fetchVisualCrossingTimeline(`${lat},${lon}`, startDate, endDate, "metric"),
      fetchOpenWeatherMapCurrent(lat, lon),
      fetchOpenMeteoForecast(lat, lon),
      fetchWeatherstackCurrent(`${lat},${lon}`)
    ]);

    // Spatial filter tomorrowData intervals with lat/lon if present
    // Adjust these field paths to actual data structure: assuming each interval has values.latitude and values.longitude
    let intervals = extractFieldArray(tomorrowData, ["timelines", "0", "intervals"]);
    
    // Add lat/lon to each interval if not present or adjust accordingly
    // Example: here we pretend intervals have lat/lon in values; this may need adjustment per your real data
    const intervalsWithCoords = intervals.map(i => ({
      ...i.values,
      latitude: i.values.latitude || lat, // fallback to query lat if not present
      longitude: i.values.longitude || lon // fallback to query lon if not present
    }));

    const filteredIntervals = filterDataByRadius(intervalsWithCoords, lat, lon, radiusKm);

    // Extract normalized temperatures from filtered intervals
    const tomorrowTemps = filteredIntervals.map(i => i.temperature || null).filter(Boolean);
    const weatherbitTemps = weatherbitData?.data?.map(h => h.temp) || [];
    const visualCrossingTemps = visualCrossingData?.days?.map(d => d.temp) || [];

    const normTomorrowTemps = normalizeArray(tomorrowTemps);
    const normWeatherbitTemps = normalizeArray(weatherbitTemps);
    const normVisualCrossingTemps = normalizeArray(visualCrossingTemps);

    const maxLen = Math.max(normTomorrowTemps.length, normWeatherbitTemps.length, normVisualCrossingTemps.length);
    const combinedNormalizedTemps = [];
    for (let i = 0; i < maxLen; i++) {
      const vals = [];
      if (normTomorrowTemps[i] !== undefined) vals.push(normTomorrowTemps[i]);
      if (normWeatherbitTemps[i] !== undefined) vals.push(normWeatherbitTemps[i]);
      if (normVisualCrossingTemps[i] !== undefined) vals.push(normVisualCrossingTemps[i]);
      combinedNormalizedTemps.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
    }

    // Similarly normalize precipitation from filtered intervals
    const tomorrowPrecip = filteredIntervals.map(i => i.precipitationIntensity || 0);
    const weatherbitPrecip = weatherbitData?.data?.map(h => h.precip || 0) || [];
    const visualCrossingPrecip = visualCrossingData?.days?.map(d => d.precip) || [];

    const normTomorrowPrecip = normalizeArray(tomorrowPrecip);
    const normWeatherbitPrecip = normalizeArray(weatherbitPrecip);
    const normVisualCrossingPrecip = normalizeArray(visualCrossingPrecip);

    const maxPrecipLen = Math.max(normTomorrowPrecip.length, normWeatherbitPrecip.length, normVisualCrossingPrecip.length);
    const combinedNormalizedPrecip = [];
    for (let i = 0; i < maxPrecipLen; i++) {
      const vals = [];
      if (normTomorrowPrecip[i] !== undefined) vals.push(normTomorrowPrecip[i]);
      if (normWeatherbitPrecip[i] !== undefined) vals.push(normWeatherbitPrecip[i]);
      if (normVisualCrossingPrecip[i] !== undefined) vals.push(normVisualCrossingPrecip[i]);
      combinedNormalizedPrecip.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
    }

    // Current weather from OpenWeatherMap: get humidity and windspeed (example)
    const currentHumidity = openWeatherMapCurrent?.main?.humidity || null;
    const currentWindSpeed = openWeatherMapCurrent?.wind?.speed || null;

    return {
      combinedNormalizedTemperatures: combinedNormalizedTemps,
      combinedNormalizedPrecipitation: combinedNormalizedPrecip,
      currentWeather: {
        temperature: openWeatherMapCurrent?.main?.temp || null,
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        source: "OpenWeatherMap",
      },
      raw: {
        tomorrow: tomorrowData,
        weatherbit: weatherbitData,
        visualCrossing: visualCrossingData,
        openWeatherMap: openWeatherMapCurrent,
        openMeteo: openMeteoForecast,
        weatherstack: weatherstackCurrent,
      },
    };
  } catch (error) {
    console.error("Error fetching combined climate and weather data:", error);
    throw error;
  }
};
