import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import validator from "validator";
import Message from "./models/message.js";
import newsRouter from "./routes/news.js";
import faqRoutes from "./routes/faqs.js";
import datasetsRouter from "./routes/datasets.js";
import leoProfanity from "leo-profanity";
import winston from "winston";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Winston logger setup for structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
      return `${timestamp} ${level}: ${message} ${metaString}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/faqs", faqRoutes);
app.use("/api/news", newsRouter);
app.use("/api/datasets", datasetsRouter);

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

// MongoDB connection - modernized without deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    // Set strictPopulate globally to fix populate errors
    mongoose.set('strictPopulate', false);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Track connected users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  onlineUsers.set(socket.id, { socketId: socket.id, connectedAt: new Date() });

  io.emit("online_users", Array.from(onlineUsers.keys()));

  // Updated initial messages with proper field mapping for your schema
  Message.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .then((msgs) => {
      const frontendMessages = msgs.map(msg => ({
        _id: msg._id,
        name: msg.username,
        text: msg.content,
        avatarUrl: "",
        imageUrl: msg.imageUrl,
        time: msg.createdAt,
        parentId: msg.parentId,
        replies: [],
        reactions: {
          like: { count: 0, users: [] },
          love: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          angry: { count: 0, users: [] }
        },
        isPrivate: false,
        reviewed: false,
        org: null,
        role: null,
        socketId: socket.id
      }));
      socket.emit("initial_messages", frontendMessages);
    })
    .catch((err) => {
      console.error("Error fetching messages:", err);
      socket.emit("initial_messages", []);
    });

  // send_message handler
  socket.on("send_message", async (message, callback) => {
    console.log("📨 Received message from client:", JSON.stringify(message, null, 2));
    
    try {
      const messageText = message.text || message.content;
      const senderName = message.name || message.username;
      
      if (
        !messageText || typeof messageText !== "string" ||
        !senderName || typeof senderName !== "string" ||
        validator.isEmpty(messageText.trim()) ||
        !validator.isLength(messageText.trim(), { min: 1, max: 1000 })
      ) {
        throw new Error("Invalid message text or sender name");
      }

      let cleanText = validator.escape(messageText.trim());
      cleanText = leoProfanity.clean(cleanText);

      if (message.parentId) {
        const parentMessage = await Message.findById(message.parentId);
        if (!parentMessage) {
          throw new Error("Parent message not found");
        }
      }

      const msgRecord = new Message({
        content: cleanText,
        username: senderName,
        emoji: message.emoji || "",
        tag: message.tag || "",
        lat: message.lat || null,
        lng: message.lng || null,
        imageUrl: message.imageUrl || "",
        parentId: message.parentId || null,
        avatarUrl: message.avatarUrl || "",
        senderId: message.senderId || socket.id,
      });

      const saved = await msgRecord.save();

      const responseMessage = {
        _id: saved._id,
        name: saved.username,
        text: saved.content,
        avatarUrl: message.avatarUrl || "",
        imageUrl: saved.imageUrl,
        time: saved.createdAt,
        parentId: saved.parentId,
        replies: [],
        reactions: message.reactions || {
          like: { count: 0, users: [] },
          love: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          angry: { count: 0, users: [] }
        },
        isPrivate: message.isPrivate || false,
        reviewed: message.reviewed || false,
        org: message.org || null,
        role: message.role || null,
        socketId: socket.id
      };

      io.emit("receive_message", responseMessage);
      callback && callback({ status: "ok", id: saved._id });
    } catch (err) {
      console.error("❌ Failed to save message:", err);
      callback && callback({ status: "error", error: err.message });
    }
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("user_typing", username);
  });

  socket.on("edit_message", async (editedMessage, callback) => {
    try {
      const messageText = editedMessage.text || editedMessage.content;
      
      if (
        !messageText || typeof messageText !== "string" ||
        validator.isEmpty(messageText.trim()) ||
        !validator.isLength(messageText.trim(), { min: 1, max: 1000 })
      ) {
        throw new Error("Invalid edited message text");
      }

      const msg = await Message.findById(editedMessage._id);
      if (!msg) throw new Error("Message not found");

      let cleanText = validator.escape(messageText.trim());
      cleanText = leoProfanity.clean(cleanText);
      msg.content = cleanText;

      await msg.save();

      io.emit("message_edited", {
        _id: msg._id,
        name: msg.username,
        text: msg.content,
        avatarUrl: "",
        imageUrl: msg.imageUrl,
        time: msg.createdAt,
        parentId: msg.parentId,
        replies: [],
        reactions: {
          like: { count: 0, users: [] },
          love: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          angry: { count: 0, users: [] }
        },
        isPrivate: false,
        reviewed: false,
        org: null,
        role: null
      });
      
      callback && callback({ status: "ok" });
    } catch (err) {
      console.error("Error editing message:", err);
      callback && callback({ status: "error", error: err.message });
    }
  });

  socket.on("delete_message", async (msgId, callback) => {
    try {
      await Message.findByIdAndDelete(msgId);
      io.emit("message_deleted", msgId);
      callback && callback({ status: "ok" });
    } catch (err) {
      console.error("Error deleting message:", err);
      callback && callback({ status: "error", error: err.message });
    }
  });

  socket.on("reaction_update", async ({ messageId, type, add, user }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) throw new Error("Message not found");

      if (!msg.reactions) {
        msg.reactions = {
          like: { count: 0, users: [] },
          love: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          angry: { count: 0, users: [] }
        };
      }

      if (!msg.reactions[type]) {
        msg.reactions[type] = { count: 0, users: [] };
      }

      const usersSet = new Set(msg.reactions[type].users || []);
      if (add) {
        usersSet.add(user);
      } else {
        usersSet.delete(user);
      }
      msg.reactions[type].users = Array.from(usersSet);
      msg.reactions[type].count = usersSet.size;

      await msg.save();
      
      io.emit("message_edited", {
        _id: msg._id,
        name: msg.username,
        text: msg.content,
        avatarUrl: "",
        imageUrl: msg.imageUrl,
        time: msg.createdAt,
        parentId: msg.parentId,
        replies: [],
        reactions: msg.reactions,
        isPrivate: false,
        reviewed: false,
        org: null,
        role: null
      });
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`, err.stack || "");
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      code: statusCode,
    },
  });
});

// Global error event listeners
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});


// Weather/Climate Data Configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

if (!OPENWEATHER_API_KEY) {
  console.warn('⚠️ OpenWeather API key not configured');
}

// Cache for weather data to reduce API calls
const weatherCache = new Map();
const locationCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for location names

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

const isValidCacheEntry = (entry, duration = CACHE_DURATION) => {
  return entry && (Date.now() - entry.timestamp < duration);
};

// Enhanced coordinate validation
const isValidCoordinates = (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  return !isNaN(latitude) && !isNaN(longitude) &&
         latitude >= -90 && latitude <= 90 &&
         longitude >= -180 && longitude <= 180;
};

// Generate cache key for coordinates
const generateCoordinateKey = (lat, lon) => {
  const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
  const roundedLon = Math.round(parseFloat(lon) * 100) / 100;
  return `coord_${roundedLat}_${roundedLon}`;
};

// Enhanced location name fetching with caching
async function getLocationName(lat, lon) {
  const cacheKey = `location_${Math.round(lat * 100)}_${Math.round(lon * 100)}`;
  
  // Check cache first
  const cachedLocation = locationCache.get(cacheKey);
  if (isValidCacheEntry(cachedLocation, LOCATION_CACHE_DURATION)) {
    return cachedLocation.data;
  }

  try {
    if (!OPENWEATHER_API_KEY) {
      return "Unknown Location";
    }

    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse`,
      {
        params: {
          lat: lat,
          lon: lon,
          limit: 1,
          appid: OPENWEATHER_API_KEY
        },
        timeout: 5000
      }
    );
    
    let locationName = "Unknown Location";
    if (response.data && response.data[0]) {
      const geo = response.data[0];
      locationName = geo.name || "Unknown Location";
      
      if (geo.state && geo.country) {
        locationName += `, ${geo.state}, ${geo.country}`;
      } else if (geo.country) {
        locationName += `, ${geo.country}`;
      }
    }

    // Cache the result
    locationCache.set(cacheKey, {
      data: locationName,
      timestamp: Date.now()
    });

    return locationName;
  } catch (error) {
    console.warn("Could not get location name:", error.message);
    return "Unknown Location";
  }
}

// Enhanced weather data fetching for any coordinates
async function fetchWeatherForCoordinates(lat, lon, locationName = null) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not configured');
  }

  if (!isValidCoordinates(lat, lon)) {
    throw new Error('Invalid coordinates provided');
  }

  const cacheKey = generateCoordinateKey(lat, lon);
  
  // Check cache first
  const cachedData = weatherCache.get(cacheKey);
  if (isValidCacheEntry(cachedData)) {
    return cachedData.data;
  }

  try {
    // Fetch current weather
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 10000
      }
    );

    // Get location name if not provided
    if (!locationName) {
      locationName = await getLocationName(lat, lon);
    }

    const data = weatherResponse.data;
    const weatherData = {
      _id: cacheKey,
      name: `${locationName} Weather Data`,
      description: `Real-time weather for ${locationName}. ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`,
      location: locationName,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      bbox: createBoundingBox(parseFloat(lon), parseFloat(lat)),
      weather: {
        temperature: Math.round(data.main.temp * 10) / 10,
        feels_like: Math.round(data.main.feels_like * 10) / 10,
        temp_min: Math.round(data.main.temp_min * 10) / 10,
        temp_max: Math.round(data.main.temp_max * 10) / 10,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        sea_level: data.main.sea_level || null,
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: data.weather[0].icon,
        wind_speed: Math.round((data.wind?.speed || 0) * 10) / 10,
        wind_deg: data.wind?.deg || null,
        wind_gust: data.wind?.gust ? Math.round(data.wind.gust * 10) / 10 : null,
        visibility: Math.round((data.visibility || 0) / 1000), // Convert to km
        cloudiness: data.clouds?.all || 0,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        timezone: data.timezone,
        uv_index: null // Will be fetched separately if needed
      },
      tags: ['weather', 'real-time', 'global'],
      data_source: 'OpenWeatherMap API',
      api_version: '2.5',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString().split('T')[0]
    };

    // Try to get UV index from One Call API (if available)
    try {
      const uvResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/uvi`,
        {
          params: {
            lat: lat,
            lon: lon,
            appid: OPENWEATHER_API_KEY
          },
          timeout: 5000
        }
      );
      weatherData.weather.uv_index = Math.round(uvResponse.data.value * 10) / 10;
    } catch (uvError) {
      // UV index not critical, continue without it
      console.warn("Could not fetch UV index:", uvError.message);
    }

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;
  } catch (error) {
    console.error(`❌ Error fetching weather for coordinates ${lat}, ${lon}:`, error.message);
    
    // Return cached data if available, even if expired
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
      console.log(`🔄 Using cached data for coordinates ${lat}, ${lon}`);
      return cachedData.data;
    }
    
    throw error;
  }
}

// Enhanced forecast data fetching
async function fetchForecastForCoordinates(lat, lon, days = 5) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not configured');
  }

  if (!isValidCoordinates(lat, lon)) {
    throw new Error('Invalid coordinates provided');
  }

  const cacheKey = `forecast_${generateCoordinateKey(lat, lon)}_${days}d`;
  
  // Check cache first
  const cachedData = weatherCache.get(cacheKey);
  if (isValidCacheEntry(cachedData)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        },
        timeout: 10000
      }
    );

    const locationName = await getLocationName(lat, lon);
    const data = response.data;

    const forecastData = {
      _id: cacheKey,
      name: `${locationName} ${days}-Day Forecast`,
      description: `${days}-day weather forecast for ${locationName}`,
      location: locationName,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      bbox: createBoundingBox(parseFloat(lon), parseFloat(lat)),
      forecast: {
        list: data.list.map(item => ({
          dt: item.dt,
          datetime: new Date(item.dt * 1000).toISOString(),
          temperature: Math.round(item.main.temp * 10) / 10,
          feels_like: Math.round(item.main.feels_like * 10) / 10,
          temp_min: Math.round(item.main.temp_min * 10) / 10,
          temp_max: Math.round(item.main.temp_max * 10) / 10,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          description: item.weather[0].description,
          main: item.weather[0].main,
          icon: item.weather[0].icon,
          wind_speed: Math.round((item.wind?.speed || 0) * 10) / 10,
          wind_deg: item.wind?.deg || null,
          cloudiness: item.clouds?.all || 0,
          precipitation: {
            rain_3h: item.rain?.['3h'] || 0,
            snow_3h: item.snow?.['3h'] || 0
          },
          visibility: Math.round((item.visibility || 0) / 1000),
          pop: Math.round((item.pop || 0) * 100) // Probability of precipitation as percentage
        })),
        city: {
          name: data.city.name,
          country: data.city.country,
          coordinates: [data.city.coord.lon, data.city.coord.lat],
          timezone: data.city.timezone,
          sunrise: data.city.sunrise,
          sunset: data.city.sunset
        }
      },
      tags: ['forecast', 'multi-day', 'global'],
      data_source: 'OpenWeatherMap API',
      api_version: '2.5',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString().split('T')[0]
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now()
    });

    return forecastData;
  } catch (error) {
    console.error(`❌ Error fetching forecast for coordinates ${lat}, ${lon}:`, error.message);
    throw error;
  }
}

// Enhanced climate data fetching from NASA Power API for any location
async function fetchClimateDataForCoordinates(lat, lon, days = 30) {
  if (!isValidCoordinates(lat, lon)) {
    throw new Error('Invalid coordinates provided');
  }

  const cacheKey = `climate_${generateCoordinateKey(lat, lon)}_${days}d`;
  const cachedData = weatherCache.get(cacheKey);
  
  if (isValidCacheEntry(cachedData)) {
    return cachedData.data;
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const params = {
      parameters: 'T2M,T2M_MIN,T2M_MAX,PRECTOTCORR,WS2M,RH2M,ALLSKY_SFC_SW_DWN,PS',
      community: 'AG',
      longitude: parseFloat(lon),
      latitude: parseFloat(lat),
      start: formatDate(startDate),
      end: formatDate(endDate),
      format: 'JSON'
    };

    const response = await axios.get(NASA_POWER_BASE_URL, {
      params,
      timeout: 15000
    });
    
    const data = response.data.properties.parameter;
    const locationName = await getLocationName(lat, lon);
    
    // Calculate statistics
    const tempValues = Object.values(data.T2M || {});
    const tempMinValues = Object.values(data.T2M_MIN || {});
    const tempMaxValues = Object.values(data.T2M_MAX || {});
    const precipValues = Object.values(data.PRECTOTCORR || {});
    const windValues = Object.values(data.WS2M || {});
    const humidityValues = Object.values(data.RH2M || {});
    const solarValues = Object.values(data.ALLSKY_SFC_SW_DWN || {});
    const pressureValues = Object.values(data.PS || {});
    
    const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : null;
    const avgTempMin = tempMinValues.length > 0 ? tempMinValues.reduce((a, b) => a + b, 0) / tempMinValues.length : null;
    const avgTempMax = tempMaxValues.length > 0 ? tempMaxValues.reduce((a, b) => a + b, 0) / tempMaxValues.length : null;
    const totalPrecip = precipValues.length > 0 ? precipValues.reduce((a, b) => a + b, 0) : null;
    const avgWindSpeed = windValues.length > 0 ? windValues.reduce((a, b) => a + b, 0) / windValues.length : null;
    const avgHumidity = humidityValues.length > 0 ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length : null;
    const avgSolarRadiation = solarValues.length > 0 ? solarValues.reduce((a, b) => a + b, 0) / solarValues.length : null;
    const avgPressure = pressureValues.length > 0 ? pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length : null;
    
    const climateData = {
      _id: cacheKey,
      name: `${locationName} Climate Data (NASA POWER)`,
      description: `${days}-day satellite climate data for ${locationName}. Avg: ${avgTemp ? Math.round(avgTemp) + '°C' : 'N/A'}, Total precipitation: ${totalPrecip ? Math.round(totalPrecip) + 'mm' : 'N/A'}`,
      location: locationName,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      bbox: createBoundingBox(parseFloat(lon), parseFloat(lat), 0.5),
      climate_data: {
        avg_temperature: avgTemp ? Math.round(avgTemp * 10) / 10 : null,
        avg_temperature_min: avgTempMin ? Math.round(avgTempMin * 10) / 10 : null,
        avg_temperature_max: avgTempMax ? Math.round(avgTempMax * 10) / 10 : null,
        total_precipitation: totalPrecip ? Math.round(totalPrecip * 10) / 10 : null,
        avg_wind_speed: avgWindSpeed ? Math.round(avgWindSpeed * 10) / 10 : null,
        avg_humidity: avgHumidity ? Math.round(avgHumidity * 10) / 10 : null,
        avg_solar_radiation: avgSolarRadiation ? Math.round(avgSolarRadiation * 10) / 10 : null,
        avg_pressure: avgPressure ? Math.round(avgPressure * 10) / 10 : null,
        period: `${formatDate(startDate)} to ${formatDate(endDate)}`,
        days_of_data: tempValues.length,
        data_quality: {
          temperature: tempValues.length > (days * 0.8) ? 'good' : tempValues.length > (days * 0.5) ? 'fair' : 'limited',
          precipitation: precipValues.length > (days * 0.8) ? 'good' : precipValues.length > (days * 0.5) ? 'fair' : 'limited',
          wind: windValues.length > (days * 0.8) ? 'good' : windValues.length > (days * 0.5) ? 'fair' : 'limited'
        }
      },
      tags: ['climate', 'satellite', 'nasa', 'historical', 'global', 'power-api'],
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
    console.error(`❌ Error fetching NASA climate data for coordinates ${lat}, ${lon}:`, error.message);
    
    // Return cached data if available
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
      console.log(`🔄 Using cached NASA climate data for coordinates ${lat}, ${lon}`);
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

// Clean up inactive connections and caches periodically
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 60 * 60 * 1000; // 1 hour
  const cacheThreshold = 60 * 60 * 1000; // 1 hour for old cache entries

  // Clean up inactive users
  for (const [socketId, user] of onlineUsers.entries()) {
    if (now - user.lastActivity > inactiveThreshold) {
      console.log(`🧹 Cleaning up inactive user: ${socketId}`);
      onlineUsers.delete(socketId);
    }
  }

  // Clean up old cache entries
  let cleanedWeatherCache = 0;
  let cleanedLocationCache = 0;
  
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > cacheThreshold) {
      weatherCache.delete(key);
      cleanedWeatherCache++;
    }
  }
  
  for (const [key, entry] of locationCache.entries()) {
    if (now - entry.timestamp > LOCATION_CACHE_DURATION) {
      locationCache.delete(key);
      cleanedLocationCache++;
    }
  }

  if (cleanedWeatherCache > 0 || cleanedLocationCache > 0) {
    console.log(`🧹 Cleaned ${cleanedWeatherCache} weather cache entries and ${cleanedLocationCache} location cache entries`);
  }
}, 15 * 60 * 1000); // Check every 15 minutes

// API Routes

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "JuaClima Global Weather Server",
    status: "running",
    version: "3.0.0",
    description: "Global weather and climate data API supporting any location on Earth",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      weather_by_coordinates: "/api/weather/coordinates?lat={lat}&lon={lon}",
      forecast_by_coordinates: "/api/weather/forecast?lat={lat}&lon={lon}&days={days}",
      climate_by_coordinates: "/api/climate/coordinates?lat={lat}&lon={lon}&days={days}",
      weather_by_location: "/api/weather/location?q={city_name}",
      datasets_by_area: "/api/datasets/area?lat={lat}&lon={lon}&radius={km}",
      stats: "/api/stats"
    },
    features: [
      "Global weather data for any coordinates",
      "5-day weather forecasts",
      "Historical climate data via NASA POWER API",
      "Location name resolution",
      "Intelligent caching system",
      "Real-time chat integration"
    ]
  });
});

// Get weather data by coordinates (enhanced)
app.get("/api/weather/coordinates", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        example: "/api/weather/coordinates?lat=-1.2921&lon=36.8219"
      });
    }

    if (!isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
        provided: { lat, lon }
      });
    }

    const weatherData = await fetchWeatherForCoordinates(lat, lon);

    res.json({
      success: true,
      data: weatherData,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching weather by coordinates:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching weather data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather forecast by coordinates
app.get("/api/weather/forecast", async (req, res) => {
  try {
    const { lat, lon, days = 5 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        example: "/api/weather/forecast?lat=-1.2921&lon=36.8219&days=5"
      });
    }

    if (!isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        provided: { lat, lon }
      });
    }

    const forecastDays = Math.min(Math.max(parseInt(days) || 5, 1), 5); // Max 5 days
    const forecastData = await fetchForecastForCoordinates(lat, lon, forecastDays);

    res.json({
      success: true,
      data: forecastData,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      forecast_days: forecastDays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching forecast by coordinates:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching forecast data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get climate data by coordinates
app.get("/api/climate/coordinates", async (req, res) => {
  try {
    const { lat, lon, days = 30 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        example: "/api/climate/coordinates?lat=-1.2921&lon=36.8219&days=30"
      });
    }

    if (!isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        provided: { lat, lon }
      });
    }

    const climateDays = Math.min(Math.max(parseInt(days) || 30, 7), 365); // 7 days to 1 year
    const climateData = await fetchClimateDataForCoordinates(lat, lon, climateDays);

    if (!climateData) {
      return res.status(503).json({
        success: false,
        message: "Climate data service temporarily unavailable",
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: climateData,
      coordinates: [parseFloat(lon), parseFloat(lat)],
      climate_days: climateDays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching climate by coordinates:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching climate data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather data by location name (city search)
app.get("/api/weather/location", async (req, res) => {
  try {
    const { q: query, country, state } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Location query is required",
        example: "/api/weather/location?q=Nairobi&country=KE"
      });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Weather service unavailable - API key not configured"
      });
    }

    // First, geocode the location
    const geocodeParams = {
      q: query,
      limit: 1,
      appid: OPENWEATHER_API_KEY
    };

    if (country) geocodeParams.q += `,${country}`;
    if (state) geocodeParams.q += `,${state}`;

    const geocodeResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct`,
      {
        params: geocodeParams,
        timeout: 8000
      }
    );

    if (!geocodeResponse.data || geocodeResponse.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
        query: query,
        suggestions: [
          "Try using more specific location names",
          "Include country code (e.g., 'Paris,FR')",
          "Check spelling of the location name"
        ]
      });
    }

    const location = geocodeResponse.data[0];
    const weatherData = await fetchWeatherForCoordinates(
      location.lat, 
      location.lon, 
      `${location.name}${location.country ? ', ' + location.country : ''}`
    );

    res.json({
      success: true,
      data: weatherData,
      location_info: {
        name: location.name,
        country: location.country,
        state: location.state,
        coordinates: [location.lon, location.lat]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching weather by location:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching weather data",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get multiple datasets for an area (radius-based search)
app.get("/api/datasets/area", async (req, res) => {
  try {
    const { lat, lon, radius = 50, include = 'weather,climate' } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        example: "/api/datasets/area?lat=-1.2921&lon=36.8219&radius=100&include=weather,climate,forecast"
      });
    }

    if (!isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        provided: { lat, lon }
      });
    }

    const radiusKm = Math.min(Math.max(parseInt(radius) || 50, 1), 500); // 1km to 500km
    const includeTypes = include.split(',').map(type => type.trim().toLowerCase());
    
    const datasets = [];
    const promises = [];

    // Generate points in a grid around the center
    const gridSize = Math.min(Math.ceil(radiusKm / 50), 5); // Max 5x5 grid
    const latStep = (radiusKm / 111000) / gridSize; // Approximate degrees per km
    const lonStep = (radiusKm / (111000 * Math.cos(lat * Math.PI / 180))) / gridSize;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        const pointLat = parseFloat(lat) + (i * latStep);
        const pointLon = parseFloat(lon) + (j * lonStep);
        
        // Calculate distance from center
        const distance = Math.sqrt(
          Math.pow((pointLat - lat) * 111000, 2) + 
          Math.pow((pointLon - lon) * 111000 * Math.cos(lat * Math.PI / 180), 2)
        ) / 1000;
        
        if (distance <= radiusKm) {
          if (includeTypes.includes('weather')) {
            promises.push(
              fetchWeatherForCoordinates(pointLat, pointLon)
                .then(data => ({ ...data, distance: Math.round(distance), type: 'weather' }))
                .catch(err => null)
            );
          }
          
          if (includeTypes.includes('climate')) {
            promises.push(
              fetchClimateDataForCoordinates(pointLat, pointLon, 30)
                .then(data => data ? { ...data, distance: Math.round(distance), type: 'climate' } : null)
                .catch(err => null)
            );
          }
        }
      }
    }

    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);

    res.json({
      success: true,
      datasets: validResults,
      metadata: {
        center_coordinates: [parseFloat(lon), parseFloat(lat)],
        search_radius_km: radiusKm,
        total_datasets: validResults.length,
        types_included: includeTypes,
        grid_size: `${gridSize * 2 + 1}x${gridSize * 2 + 1}`,
        coverage_area_km2: Math.round(Math.PI * Math.pow(radiusKm, 2))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching area datasets:', error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching area datasets",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search locations (geocoding endpoint)
app.get("/api/locations/search", async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
        example: "/api/locations/search?q=london&limit=5"
      });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Location search service unavailable - API key not configured"
      });
    }

    const searchLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 10);

    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct`,
      {
        params: {
          q: query,
          limit: searchLimit,
          appid: OPENWEATHER_API_KEY
        },
        timeout: 8000
      }
    );

    const locations = response.data.map(location => ({
      name: location.name,
      country: location.country,
      state: location.state,
      coordinates: [location.lon, location.lat],
      local_names: location.local_names || {}
    }));

    res.json({
      success: true,
      locations: locations,
      query: query,
      count: locations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error searching locations:', error.message);
    res.status(500).json({
      success: false,
      message: "Error searching locations",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch weather data endpoint
app.post("/api/weather/batch", async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        message: "Array of coordinates is required",
        example: {
          coordinates: [
            { lat: -1.2921, lon: 36.8219, name: "Nairobi" },
            { lat: 51.5074, lon: -0.1278, name: "London" }
          ]
        }
      });
    }

    if (coordinates.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 locations allowed per batch request"
      });
    }

    const promises = coordinates.map(async (coord, index) => {
      try {
        if (!isValidCoordinates(coord.lat, coord.lon)) {
          return {
            index,
            success: false,
            error: "Invalid coordinates",
            coordinates: coord
          };
        }

        const weatherData = await fetchWeatherForCoordinates(
          coord.lat, 
          coord.lon, 
          coord.name
        );

        return {
          index,
          success: true,
          data: weatherData,
          coordinates: coord
        };
      } catch (error) {
        return {
          index,
          success: false,
          error: error.message,
          coordinates: coord
        };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      results: results,
      summary: {
        total_requested: coordinates.length,
        successful: successful.length,
        failed: failed.length,
        success_rate: Math.round((successful.length / coordinates.length) * 100)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in batch weather request:', error.message);
    res.status(500).json({
      success: false,
      message: "Error processing batch weather request",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced server statistics endpoint
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      server: {
        online_users: onlineUsers.size,
        uptime_seconds: Math.floor(process.uptime()),
        uptime_human: formatUptime(process.uptime()),
        version: "3.0.0"
      },
      cache: {
        weather_cache_entries: weatherCache.size,
        location_cache_entries: locationCache.size,
        cache_duration_minutes: CACHE_DURATION / (60 * 1000),
        location_cache_duration_hours: LOCATION_CACHE_DURATION / (60 * 60 * 1000)
      },
      memory: {
        ...process.memoryUsage(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      services: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        openweather_api: !!OPENWEATHER_API_KEY ? 'configured' : 'not_configured',
        nasa_power_api: 'available'
      },
      features: {
        global_weather: true,
        climate_data: true,
        forecasts: true,
        location_search: !!OPENWEATHER_API_KEY,
        batch_requests: true,
        area_datasets: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Enhanced health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    service: "JuaClima Global Weather API",
    version: "3.0.0",
    timestamp: new Date().toISOString(),
    checks: {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      weather_api: OPENWEATHER_API_KEY ? 'configured' : 'not_configured',
      memory: process.memoryUsage().heapUsed < 1000000000 ? 'healthy' : 'high', // 1GB threshold
      uptime: process.uptime(),
      cache_health: weatherCache.size < 10000 ? 'healthy' : 'high' // 10k entries threshold
    },
    capabilities: {
      global_coverage: true,
      real_time_weather: !!OPENWEATHER_API_KEY,
      forecasts: !!OPENWEATHER_API_KEY,
      climate_data: true,
      location_search: !!OPENWEATHER_API_KEY,
      batch_processing: true
    }
  };

  // Test API connectivity if configured
  if (OPENWEATHER_API_KEY) {
    try {
      await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: 0,
            lon: 0,
            appid: OPENWEATHER_API_KEY
          },
          timeout: 5000
        }
      );
      health.checks.api_connectivity = 'healthy';
    } catch (error) {
      health.checks.api_connectivity = 'unhealthy';
      health.status = "degraded";
    }
  }

  const isHealthy = health.checks.database === 'healthy' && 
                   health.checks.memory === 'healthy' &&
                   health.checks.cache_health === 'healthy';

  if (!isHealthy) {
    health.status = "unhealthy";
  }

  res.status(isHealthy ? 200 : 503).json(health);
});

// API documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    service: "JuaClima Global Weather API",
    version: "3.0.0",
    description: "Global weather and climate data API supporting any location on Earth",
    base_url: req.protocol + '://' + req.get('host'),
    endpoints: {
      weather: {
        "GET /api/weather/coordinates": {
          description: "Get current weather for specific coordinates",
          parameters: {
            lat: "Latitude (-90 to 90)",
            lon: "Longitude (-180 to 180)"
          },
          example: "/api/weather/coordinates?lat=-1.2921&lon=36.8219"
        },
        "GET /api/weather/location": {
          description: "Get weather by location name",
          parameters: {
            q: "Location name (required)",
            country: "Country code (optional)",
            state: "State code (optional)"
          },
          example: "/api/weather/location?q=Nairobi&country=KE"
        },
        "GET /api/weather/forecast": {
          description: "Get weather forecast for coordinates",
          parameters: {
            lat: "Latitude (-90 to 90)",
            lon: "Longitude (-180 to 180)",
            days: "Number of days (1-5, default: 5)"
          },
          example: "/api/weather/forecast?lat=-1.2921&lon=36.8219&days=3"
        },
        "POST /api/weather/batch": {
          description: "Get weather for multiple locations (max 20)",
          body: {
            coordinates: [
              { lat: -1.2921, lon: 36.8219, name: "Nairobi" }
            ]
          }
        }
      },
      climate: {
        "GET /api/climate/coordinates": {
          description: "Get historical climate data from NASA POWER",
          parameters: {
            lat: "Latitude (-90 to 90)",
            lon: "Longitude (-180 to 180)",
            days: "Number of days (7-365, default: 30)"
          },
          example: "/api/climate/coordinates?lat=-1.2921&lon=36.8219&days=90"
        }
      },
      search: {
        "GET /api/locations/search": {
          description: "Search for locations by name",
          parameters: {
            q: "Search query (required)",
            limit: "Max results (1-10, default: 5)"
          },
          example: "/api/locations/search?q=paris&limit=3"
        },
        "GET /api/datasets/area": {
          description: "Get datasets for an area around coordinates",
          parameters: {
            lat: "Center latitude",
            lon: "Center longitude", 
            radius: "Search radius in km (1-500, default: 50)",
            include: "Data types: weather,climate,forecast (default: weather,climate)"
          },
          example: "/api/datasets/area?lat=0&lon=0&radius=100&include=weather,climate"
        }
      },
      system: {
        "GET /api/health": "Health check and system status",
        "GET /api/stats": "Server statistics and metrics",
        "GET /api/docs": "This documentation"
      }
    },
    rate_limits: {
      weather_api: "Shared OpenWeatherMap rate limits apply",
      nasa_api: "Reasonable use policy",
      caching: "10 minutes for weather, 24 hours for locations"
    },
    data_sources: {
      current_weather: "OpenWeatherMap API v2.5",
      forecasts: "OpenWeatherMap API v2.5",
      climate_data: "NASA POWER API v2.1",
      geocoding: "OpenWeatherMap Geocoding API"
    }
  });
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
      "GET /", 
      "GET /api/health", 
      "GET /api/docs",
      "GET /api/weather/coordinates", 
      "GET /api/weather/location",
      "GET /api/weather/forecast",
      "POST /api/weather/batch",
      "GET /api/climate/coordinates",
      "GET /api/locations/search",
      "GET /api/datasets/area",
      "GET /api/stats"
    ],
    suggestion: "Visit /api/docs for complete API documentation",
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
  console.log(`Server running on http://localhost:${PORT}`);
});
