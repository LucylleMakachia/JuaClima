import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import Message from "./models/message.js";
import leoProfanity from "leo-profanity";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// MongoDB connection with better error handling
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Track connected users with more details
const onlineUsers = new Map();

// Weather/Climate Data Configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

if (!OPENWEATHER_API_KEY) {
  console.warn('⚠️ OpenWeather API key not configured');
}

// Define key locations in Kenya with their coordinates
const kenyaLocations = [
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219, region: 'Central Kenya' },
  { name: 'Mombasa', lat: -4.0435, lon: 39.6682, region: 'Coastal Kenya' },
  { name: 'Kisumu', lat: -0.1022, lon: 34.7617, region: 'Western Kenya' },
  { name: 'Nakuru', lat: -0.3031, lon: 36.0800, region: 'Rift Valley' },
  { name: 'Eldoret', lat: 0.5143, lon: 35.2698, region: 'Western Highlands' },
  { name: 'Meru', lat: 0.0467, lon: 37.6500, region: 'Mt. Kenya Region' },
  { name: 'Garissa', lat: -0.4537, lon: 39.6461, region: 'Northern Kenya' },
  { name: 'Malindi', lat: -3.2194, lon: 40.1169, region: 'Coastal Kenya' },
  { name: 'Kitale', lat: 1.0157, lon: 35.0062, region: 'Western Highlands' },
  { name: 'Machakos', lat: -1.5177, lon: 37.2634, region: 'Eastern Kenya' }
];

// Global cities for initial dataset population
const globalCities = [
  // Africa
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, region: 'East Africa' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, region: 'North Africa' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792, region: 'West Africa' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, region: 'Southern Africa' },
  
  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, region: 'East Asia' },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, region: 'South Asia' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018, region: 'Southeast Asia' },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074, region: 'East Asia' },
  
  // Europe
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, region: 'Western Europe' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, region: 'Western Europe' },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050, region: 'Central Europe' },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173, region: 'Eastern Europe' },
  
  // Americas
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, region: 'North America' },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, region: 'North America' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, region: 'North America' },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333, region: 'South America' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6118, lon: -58.3960, region: 'South America' },
  
  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, region: 'Oceania' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, region: 'Oceania' }
];

// Cache for weather data to reduce API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Utility functions
const formatDate = (date) => {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

const createBoundingBox = (lon, lat, buffer = 0.1) => ({
  coordinates: [[
    [lon - buffer, lat - buffer],
    [lon + buffer, lat - buffer],
    [lon + buffer, lat + buffer],
    [lon - buffer, lat + buffer],
    [lon - buffer, lat - buffer]
  ]]
});

const isValidCacheEntry = (entry) => {
  return entry && (Date.now() - entry.timestamp < CACHE_DURATION);
};

// Enhanced weather data fetching with caching and rate limiting
async function fetchWeatherData() {
  if (!OPENWEATHER_API_KEY) {
    console.warn('⚠️ OpenWeather API key not available');
    return [];
  }

  try {
    const weatherPromises = kenyaLocations.map(async (location) => {
      const cacheKey = `weather_${location.name.toLowerCase()}`;
      
      // Check cache first
      const cachedData = weatherCache.get(cacheKey);
      if (isValidCacheEntry(cachedData)) {
        return cachedData.data;
      }

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather`,
          {
            params: {
              lat: location.lat,
              lon: location.lon,
              appid: OPENWEATHER_API_KEY,
              units: 'metric'
            },
            timeout: 8000
          }
        );
        
        const data = response.data;
        const weatherData = {
          _id: cacheKey,
          name: `${location.name} Weather Data`,
          description: `Real-time weather for ${location.name}, ${location.region}. ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`,
          location: location.name,
          region: location.region,
          coordinates: [location.lon, location.lat],
          bbox: createBoundingBox(location.lon, location.lat),
          weather: {
            temperature: Math.round(data.main.temp * 10) / 10,
            feels_like: Math.round(data.main.feels_like * 10) / 10,
            temp_min: Math.round(data.main.temp_min * 10) / 10,
            temp_max: Math.round(data.main.temp_max * 10) / 10,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            sea_level: data.main.sea_level,
            description: data.weather[0].description,
            main: data.weather[0].main,
            icon: data.weather[0].icon,
            wind_speed: Math.round((data.wind?.speed || 0) * 10) / 10,
            wind_deg: data.wind?.deg,
            wind_gust: data.wind?.gust ? Math.round(data.wind.gust * 10) / 10 : null,
            visibility: Math.round((data.visibility || 0) / 1000), // Convert to km
            cloudiness: data.clouds?.all || 0,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
            timezone: data.timezone,
            uv_index: data.uvi || null
          },
          tags: ['weather', 'climate', 'real-time', location.region.toLowerCase().replace(/\s+/g, '-')],
          data_source: 'OpenWeatherMap API',
          api_version: '2.5',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString().split('T')[0]
        };

        // Cache the result
        weatherCache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        });

        return weatherData;
      } catch (error) {
        console.error(`❌ Error fetching weather for ${location.name}:`, error.message);
        
        // Return cached data if available, even if expired
        const cachedData = weatherCache.get(cacheKey);
        if (cachedData) {
          console.log(`🔄 Using cached data for ${location.name}`);
          return cachedData.data;
        }
        
        return null;
      }
    });

    const results = await Promise.all(weatherPromises);
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('❌ Error in fetchWeatherData:', error.message);
    throw error;
  }
}

// Enhanced climate data fetching from NASA Power API
async function fetchClimateData() {
  const cacheKey = 'climate_kenya_nasa';
  const cachedData = weatherCache.get(cacheKey);
  
  if (isValidCacheEntry(cachedData)) {
    return cachedData.data;
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days for better data
    
    const params = {
      parameters: 'T2M,PRECTOTCORR,WS2M,RH2M,ALLSKY_SFC_SW_DWN',
      community: 'AG',
      longitude: 37.9,
      latitude: -0.8,
      start: formatDate(startDate),
      end: formatDate(endDate),
      format: 'JSON'
    };

    const response = await axios.get(NASA_POWER_BASE_URL, {
      params,
      timeout: 15000
    });
    
    const data = response.data.properties.parameter;
    
    // Calculate statistics
    const tempValues = Object.values(data.T2M || {});
    const precipValues = Object.values(data.PRECTOTCORR || {});
    const windValues = Object.values(data.WS2M || {});
    const humidityValues = Object.values(data.RH2M || {});
    const solarValues = Object.values(data.ALLSKY_SFC_SW_DWN || {});
    
    const avgTemp = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;
    const totalPrecip = precipValues.reduce((a, b) => a + b, 0);
    const avgWindSpeed = windValues.reduce((a, b) => a + b, 0) / windValues.length;
    const avgHumidity = humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length;
    const avgSolarRadiation = solarValues.reduce((a, b) => a + b, 0) / solarValues.length;
    
    const climateData = {
      _id: cacheKey,
      name: 'Kenya Climate Data (NASA POWER)',
      description: `Satellite climate data for central Kenya. 30-day avg: ${Math.round(avgTemp)}°C, Total precipitation: ${Math.round(totalPrecip)}mm`,
      bbox: createBoundingBox(37.9, -0.8, 2.0), // Larger bounding box for Kenya
      coordinates: [37.9, -0.8],
      climate_data: {
        avg_temperature: Math.round(avgTemp * 10) / 10,
        total_precipitation: Math.round(totalPrecip * 10) / 10,
        avg_wind_speed: Math.round(avgWindSpeed * 10) / 10,
        avg_humidity: Math.round(avgHumidity * 10) / 10,
        avg_solar_radiation: Math.round(avgSolarRadiation * 10) / 10,
        period: `${formatDate(startDate)} to ${formatDate(endDate)}`,
        days_of_data: tempValues.length,
        data_quality: {
          temperature: tempValues.length > 20 ? 'good' : 'limited',
          precipitation: precipValues.length > 20 ? 'good' : 'limited',
          wind: windValues.length > 20 ? 'good' : 'limited'
        }
      },
      tags: ['climate', 'satellite', 'nasa', 'historical', 'kenya', 'power-api'],
      data_source: 'NASA POWER API',
      api_version: '2.1',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString().split('T')[0]
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: climateData,
      timestamp: Date.now()
    });

    return climateData;
  } catch (error) {
    console.error('❌ Error fetching NASA climate data:', error.message);
    
    // Return cached data if available
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
      console.log('🔄 Using cached NASA climate data');
      return cachedData.data;
    }
    
    return null;
  }
}

// Enhanced Socket.IO logic
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Store user info
  onlineUsers.set(socket.id, {
    socketId: socket.id,
    connectedAt: new Date(),
    lastActivity: new Date()
  });

  // Emit updated user count
  io.emit("online-users", {
    count: onlineUsers.size,
    timestamp: new Date().toISOString()
  });

  // Enhanced typing indicator with timeout
  let typingTimeout;
  socket.on("typing", (data) => {
    // Update last activity
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.lastActivity = new Date();
    }

    socket.broadcast.emit("user-typing", {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Auto-stop typing after 3 seconds
    typingTimeout = setTimeout(() => {
      socket.broadcast.emit("user-stopped-typing", {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    }, 3000);
  });

  socket.on("stop-typing", () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    socket.broadcast.emit("user-stopped-typing", {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Enhanced message handling
  socket.on("send-message", async (data) => {
    try {
      // Validate required fields
      if (!data.senderId || !data.senderName || !data.text?.trim()) {
        socket.emit("message-error", {
          error: "Missing required fields",
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Clean the text with leo-profanity
      const cleanText = leoProfanity.clean(data.text.trim());

      // Create new message
      const newMessage = new Message({
        senderId: data.senderId,
        senderName: data.senderName.trim(),
        text: cleanText,
        imageUrl: data.imageUrl || "",
        tag: data.tag || "",
        replyTo: data.replyTo || null,
        timestamp: new Date(),
      });

      const saved = await newMessage.save();
      const populated = await saved.populate("replyTo");

      const msgToSend = {
        ...populated.toObject(),
        time: populated.timestamp, // alias for frontend
        socketId: socket.id
      };

      // Emit to all clients
      io.emit("receive-message", msgToSend);

      // Update user activity
      const user = onlineUsers.get(socket.id);
      if (user) {
        user.lastActivity = new Date();
      }

    } catch (err) {
      console.error("❌ Error saving message:", err.message);
      socket.emit("message-error", {
        error: "Failed to save message",
        details: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
    
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Remove user
    onlineUsers.delete(socket.id);
    
    // Emit updated count
    io.emit("online-users", {
      count: onlineUsers.size,
      timestamp: new Date().toISOString()
    });

    // Notify others that user stopped typing
    socket.broadcast.emit("user-stopped-typing", {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
});

// Clean up inactive connections periodically
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 60 * 60 * 1000; // 1 hour

  for (const [socketId, user] of onlineUsers.entries()) {
    if (now - user.lastActivity > inactiveThreshold) {
      console.log(`🧹 Cleaning up inactive user: ${socketId}`);
      onlineUsers.delete(socketId);
    }
  }
}, 15 * 60 * 1000); // Check every 15 minutes

// API Routes

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "JuaClima Chat Server",
    status: "running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      datasets: "/api/datasets",
      single_dataset: "/api/datasets/:id",
      weather_location: "/api/weather/location",
      global_cities: "/api/weather/global-cities",
      stats: "/api/stats"
    }
  });
});

// Get weather data for global cities
async function fetchGlobalCitiesWeather() {
  if (!OPENWEATHER_API_KEY) {
    console.warn('⚠️ OpenWeather API key not available for global cities');
    return [];
  }

  try {
    const weatherPromises = globalCities.map(async (city) => {
      const cacheKey = `global_${city.name.toLowerCase().replace(' ', '_')}_${city.country.toLowerCase().replace(' ', '_')}`;
      
      // Check cache first
      const cachedData = weatherCache.get(cacheKey);
      if (isValidCacheEntry(cachedData)) {
        return cachedData.data;
      }

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather`,
          {
            params: {
              lat: city.lat,
              lon: city.lon,
              appid: OPENWEATHER_API_KEY,
              units: 'metric'
            },
            timeout: 8000
          }
        );
        
        const data = response.data;
        const weatherData = {
          _id: cacheKey,
          name: `${city.name} Weather Data`,
          description: `Real-time weather data for ${city.name}, ${city.country}. Current: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`,
          location: city.name,
          country: city.country,
          region: city.region,
          coordinates: [city.lon, city.lat],
          bbox: createBoundingBox(city.lon, city.lat, 0.5),
          weather: {
            temperature: Math.round(data.main.temp * 10) / 10,
            feels_like: Math.round(data.main.feels_like * 10) / 10,
            temp_min: Math.round(data.main.temp_min * 10) / 10,
            temp_max: Math.round(data.main.temp_max * 10) / 10,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            sea_level: data.main.sea_level,
            description: data.weather[0].description,
            main: data.weather[0].main,
            icon: data.weather[0].icon,
            wind_speed: Math.round((data.wind?.speed || 0) * 10) / 10,
            wind_deg: data.wind?.deg,
            wind_gust: data.wind?.gust ? Math.round(data.wind.gust * 10) / 10 : null,
            visibility: Math.round((data.visibility || 0) / 1000),
            cloudiness: data.clouds?.all || 0,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
            timezone: data.timezone
          },
          tags: ['weather', 'global', 'real-time', city.region.toLowerCase().replace(/\s+/g, '-')],
          data_source: 'OpenWeatherMap API',
          api_version: '2.5',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString().split('T')[0]
        };

        // Cache the result
        weatherCache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        });

        return weatherData;
      } catch (error) {
        console.error(`❌ Error fetching weather for ${city.name}, ${city.country}:`, error.message);
        
        // Return cached data if available, even if expired
        const cachedData = weatherCache.get(cacheKey);
        if (cachedData) {
          console.log(`🔄 Using cached data for ${city.name}, ${city.country}`);
          return cachedData.data;
        }
        
        return null;
      }
    });

    const results = await Promise.all(weatherPromises);
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('❌ Error in fetchGlobalCitiesWeather:', error.message);
    throw error;
  }
}

// Get weather data for any location (for pin-clicked locations)
app.get("/api/weather/location", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Weather service unavailable - API key not configured"
      });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat: lat,
          lon: lng,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 8000
      }
    );
    
    const data = response.data;
    
    // Get location name using reverse geocoding
    let locationName = "Unknown Location";
    try {
      const geoResponse = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse`,
        {
          params: {
            lat: lat,
            lon: lng,
            limit: 1,
            appid: OPENWEATHER_API_KEY
          },
          timeout: 5000
        }
      );
      
      if (geoResponse.data && geoResponse.data[0]) {
        const geo = geoResponse.data[0];
        locationName = geo.name;
        if (geo.country) {
          locationName += `, ${geo.country}`;
        }
      }
    } catch (geoError) {
      console.warn("Could not get location name:", geoError.message);
    }

    const weather = {
      location: locationName,
      temperature: Math.round(data.main.temp * 10) / 10,
      feels_like: Math.round(data.main.feels_like * 10) / 10,
      temp_min: Math.round(data.main.temp_min * 10) / 10,
      temp_max: Math.round(data.main.temp_max * 10) / 10,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      main: data.weather[0].main,
      icon: data.weather[0].icon,
      wind_speed: Math.round((data.wind?.speed || 0) * 10) / 10,
      wind_deg: data.wind?.deg,
      visibility: Math.round((data.visibility || 0) / 1000),
      cloudiness: data.clouds?.all || 0,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    res.json({
      success: true,
      weather: weather,
      location: locationName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching location weather:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching weather data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather data for major global cities
app.get("/api/weather/global-cities", async (req, res) => {
  try {
    console.log("📡 Fetching global cities weather data...");
    const startTime = Date.now();
    
    const globalWeatherData = await fetchGlobalCitiesWeather();
    console.log(`✅ Fetched weather data for ${globalWeatherData.length} global cities`);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      datasets: globalWeatherData,
      metadata: {
        count: globalWeatherData.length,
        response_time_ms: responseTime,
        cache_info: {
          weather_cache_size: weatherCache.size,
          cache_duration_minutes: CACHE_DURATION / (60 * 1000)
        }
      },
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching global cities weather:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching global weather data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced datasets endpoint with global cities
app.get("/api/datasets", async (req, res) => {
  try {
    console.log("📡 Fetching weather and climate data...");
    const startTime = Date.now();
    
    // Fetch Kenya weather data
    const kenyaWeather = await fetchWeatherData();
    console.log(`✅ Fetched weather data for ${kenyaWeather.length} Kenya locations`);
    
    // Fetch global cities weather data
    const globalWeather = await fetchGlobalCitiesWeather();
    console.log(`✅ Fetched weather data for ${globalWeather.length} global cities`);
    
    // Fetch climate data (optional)
    const climateData = await fetchClimateData();
    const climateStatus = climateData ? "✅ Fetched NASA climate data" : "⚠️ NASA climate data unavailable";
    console.log(climateStatus);
    
    // Combine all datasets
    const allDatasets = [
      ...kenyaWeather,
      ...globalWeather,
      ...(climateData ? [climateData] : [])
    ];

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      datasets: allDatasets,
      metadata: {
        total_count: allDatasets.length,
        kenya_locations: kenyaWeather.length,
        global_cities: globalWeather.length,
        has_climate_data: !!climateData,
        response_time_ms: responseTime,
        cache_info: {
          weather_cache_size: weatherCache.size,
          cache_duration_minutes: CACHE_DURATION / (60 * 1000)
        }
      },
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/datasets:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching datasets",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced single dataset endpoint
app.get("/api/datasets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id.startsWith('weather_')) {
      const locationName = id.replace('weather_', '');
      const location = kenyaLocations.find(loc => 
        loc.name.toLowerCase() === locationName.toLowerCase()
      );
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: "Weather location not found",
          available_locations: kenyaLocations.map(loc => loc.name.toLowerCase())
        });
      }
      
      // Check cache first
      const cachedData = weatherCache.get(id);
      if (isValidCacheEntry(cachedData)) {
        return res.json({
          success: true,
          dataset: cachedData.data,
          cached: true,
          cache_age_minutes: Math.round((Date.now() - cachedData.timestamp) / (60 * 1000))
        });
      }

      // Fetch fresh data
      if (!OPENWEATHER_API_KEY) {
        return res.status(503).json({
          success: false,
          message: "Weather service unavailable - API key not configured"
        });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: OPENWEATHER_API_KEY,
            units: 'metric'
          },
          timeout: 8000
        }
      );
      
      const data = response.data;
      const dataset = {
        _id: id,
        name: `${location.name} Weather Data`,
        description: `Detailed weather information for ${location.name}, ${location.region}`,
        location: location.name,
        region: location.region,
        coordinates: [location.lon, location.lat],
        weather: {
          temperature: Math.round(data.main.temp * 10) / 10,
          feels_like: Math.round(data.main.feels_like * 10) / 10,
          temp_min: Math.round(data.main.temp_min * 10) / 10,
          temp_max: Math.round(data.main.temp_max * 10) / 10,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          description: data.weather[0].description,
          main: data.weather[0].main,
          icon: data.weather[0].icon,
          wind_speed: Math.round((data.wind?.speed || 0) * 10) / 10,
          wind_deg: data.wind?.deg,
          visibility: Math.round((data.visibility || 0) / 1000),
          cloudiness: data.clouds?.all || 0,
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset
        },
        last_updated: new Date().toISOString(),
        cached: false
      };
      
      // Cache the result
      weatherCache.set(id, {
        data: dataset,
        timestamp: Date.now()
      });
      
      return res.json({
        success: true,
        dataset
      });
    }
    
    if (id === 'climate_kenya_nasa') {
      const climateData = await fetchClimateData();
      if (!climateData) {
        return res.status(503).json({
          success: false,
          message: "Climate data service temporarily unavailable"
        });
      }
      
      return res.json({
        success: true,
        dataset: climateData
      });
    }
    
    res.status(404).json({
      success: false,
      message: "Dataset not found",
      available_prefixes: ["weather_", "climate_kenya_nasa"]
    });
  } catch (error) {
    console.error('❌ Error fetching single dataset:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching dataset",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server statistics endpoint
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      online_users: onlineUsers.size,
      cache_entries: weatherCache.size,
      server_uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      locations_available: kenyaLocations.length,
      global_cities_available: globalCities.length,
      services: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        openweather: !!OPENWEATHER_API_KEY ? 'configured' : 'not_configured'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    service: "JuaClima API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    checks: {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      weather_api: OPENWEATHER_API_KEY ? 'configured' : 'not_configured',
      memory: process.memoryUsage().heapUsed < 1000000000 ? 'healthy' : 'high', // 1GB threshold
      uptime: process.uptime()
    }
  };

  const isHealthy = health.checks.database === 'healthy' && 
                   health.checks.memory === 'healthy';

  res.status(isHealthy ? 200 : 503).json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    available_endpoints: [
      "/", 
      "/api/health", 
      "/api/datasets", 
      "/api/datasets/:id", 
      "/api/weather/location", 
      "/api/weather/global-cities", 
      "/api/stats"
    ],
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 JuaClima server running on port ${PORT}`);
  console.log(`📡 Weather API: ${OPENWEATHER_API_KEY ? '✅ Configured' : '❌ Missing API key'}`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️ Connecting...'}`);
  console.log(`👥 Socket.IO: ✅ Ready for connections`);
  console.log('📊 Available endpoints:');
  console.log('   - GET  /                        - Service info');  
  console.log('   - GET  /api/health              - Health check');
  console.log('   - GET  /api/datasets            - All weather/climate data');
  console.log('   - GET  /api/datasets/:id        - Single dataset');
  console.log('   - GET  /api/weather/location    - Weather by coordinates');
  console.log('   - GET  /api/weather/global-cities - Global cities weather');
  console.log('   - GET  /api/stats               - Server statistics');
});