const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());

// API Key and Base URL for OpenWeatherMap
const API_KEY = 'd10a876e32cc3030c3874089ca5cb983';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// SQLite database file
const SAVED_CITIES_FILE = path.join(__dirname, 'saved_cities.db');

// Initialize SQLite database
const db = new sqlite3.Database(SAVED_CITIES_FILE, (err) => {
  if (err) console.error('Database error:', err);
  db.run(`CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )`);
});

// Middleware for CORS (for Vercel and local testing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Helper functions
const celsiusToFahrenheit = (celsius) => celsius * 9/5 + 32;

const getWeather = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}weather?q=${city}&appid=${API_KEY}&units=metric`);
    return response.data;
  } catch (error) {
    return null;
  }
};

const getForecast = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}forecast?q=${city}&appid=${API_KEY}&units=metric`);
    return response.data;
  } catch (error) {
    return null;
  }
};

const getAirPollution = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

const saveCity = (city, callback) => {
  db.run(`INSERT OR IGNORE INTO cities (name) VALUES (?)`, [city.toLowerCase()], callback);
};

const loadSavedCities = (callback) => {
  db.all(`SELECT name FROM cities`, [], (err, rows) => {
    if (err) return callback(err, []);
    callback(null, rows.map(row => row.name));
  });
};

// API Routes
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  const weatherData = await getWeather(city);
  if (weatherData) {
    const lat = weatherData.coord.lat;
    const lon = weatherData.coord.lon;
    const airData = await getAirPollution(lat, lon);
    const forecastData = await getForecast(city);

    const tempC = weatherData.main.temp;
    const feelsC = weatherData.main.feels_like;
    const tempF = celsiusToFahrenheit(tempC);
    const feelsF = celsiusToFahrenheit(feelsC);
    const description = weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1);
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;

    const aqi = airData?.list[0]?.main.aqi || 0;
    const aqiLevels = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
    const aqiLevel = aqiLevels[aqi] || 'Unknown';

    const forecast = forecastData?.list?.slice(0, 8).map(entry => ({
      dt_txt: entry.dt_txt,
      temp_f: celsiusToFahrenheit(entry.main.temp),
      humidity: entry.main.humidity,
      rain: entry.rain?.['3h'] || 0,
      snow: entry.snow?.['3h'] || 0
    })) || [];

    saveCity(city, (err) => {
      if (err) console.error('Error saving city:', err);
    });

    return res.json({
      weather: {
        name: weatherData.name,
        temp_c: tempC,
        temp_f: tempF,
        feels_c: feelsC,
        feels_f: feelsF,
        description,
        humidity,
        wind_speed: windSpeed,
        lat,
        lon
      },
      aqi: { aqi, level: aqiLevel },
      forecast
    });
  } else {
    return res.status(404).json({ error: 'No weather data available' });
  }
});

app.get('/api/cities', (req, res) => {
  loadSavedCities((err, cities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(cities);
  });
});

// Export for Vercel serverless
module.exports = app;

// Only start the server if running directly (not required by another file)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}