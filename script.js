const apiKey = "9d5c7eeab93c8bd336805a0fe8b6aa65";

// Update current date
function updateCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Get weather icon based on condition
function getWeatherIcon(condition) {
  const conditions = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️',
    'drizzle': '🌦️'
  };
  
  condition = condition.toLowerCase();
  for (const key in conditions) {
    if (condition.includes(key)) {
      return conditions[key];
    }
  }
  return '🌤️';
}

// Convert timestamp to time
function timestampToTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  let hours = date.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  return `${hours}:${date.getUTCMinutes().toString().padStart(2, '0')} ${ampm}`;
}

// Convert m/s to km/h
function msToKmh(speed) {
  return (speed * 3.6).toFixed(1);
}

// Fetch weather for a city
async function fetchWeather(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Fetch forecast for a city
async function fetchForecast(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

// Update major cities weather
async function updateMajorCities() {
  const cities = [
    { id: 'city1', name: 'London', country: 'UK' },
    { id: 'city2', name: 'New York', country: 'US' },
    { id: 'city3', name: 'Tokyo', country: 'Japan' }
  ];

  for (const city of cities) {
    const data = await fetchWeather(city.name);
    if (data && data.cod === 200) {
      const element = document.getElementById(city.id);
      element.innerHTML = `
        <div>${data.name}, ${data.sys.country}<br/>
        ${getWeatherIcon(data.weather[0].main)} ${Math.round(data.main.temp)}°C</div>
      `;
    }
  }
}

// Main weather function
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  
  if (!city) {
    errorMsg.textContent = "Please enter a city name.";
    return;
  }

  errorMsg.textContent = "";
  
  // Show loading state
  const currentWeather = document.getElementById('currentWeather');
  currentWeather.innerHTML = '<div class="loading">Loading weather data...</div>';

  try {
    // Fetch current weather
    const weatherData = await fetchWeather(city);
    
    if (!weatherData || weatherData.cod !== 200) {
      errorMsg.textContent = "City not found. Please try another location.";
      currentWeather.innerHTML = `
        <div class="weather-temp">--°C</div>
        <div class="weather-condition">--</div>
        <div class="weather-location">Search for a city</div>
      `;
      return;
    }

    // Update current weather
    currentWeather.innerHTML = `
      <div class="weather-temp">${Math.round(weatherData.main.temp)}°C</div>
      <div class="weather-condition">${weatherData.weather[0].main}</div>
      <div class="weather-location">${weatherData.name}, ${weatherData.sys.country}</div>
    `;

    // Update highlights
    const highlights = document.getElementById('weatherHighlights');
    highlights.querySelector('.highlight-box').innerHTML = `
      <div><strong>Sunrise:</strong> ${timestampToTime(weatherData.sys.sunrise, weatherData.timezone)}</div>
      <div><strong>Sunset:</strong> ${timestampToTime(weatherData.sys.sunset, weatherData.timezone)}</div>
      <div><strong>Wind:</strong> ${msToKmh(weatherData.wind.speed)} km/h</div>
      <div><strong>Humidity:</strong> ${weatherData.main.humidity}%</div>
      <div><strong>Pressure:</strong> ${weatherData.main.pressure} hPa</div>
      <div><strong>Visibility:</strong> ${(weatherData.visibility / 1000).toFixed(1)} km</div>
    `;

    // Fetch and update forecast
    const forecastData = await fetchForecast(city);
    if (forecastData && forecastData.cod === "200") {
      const forecastDays = document.getElementById('forecastDays');
      forecastDays.innerHTML = '';
      
      // Get unique days (next 5 days)
      const dailyForecasts = [];
      const seenDays = new Set();
      
      forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!seenDays.has(day)) {
          seenDays.add(day);
          dailyForecasts.push({
            day: day,
            temp: Math.round(item.main.temp),
            icon: getWeatherIcon(item.weather[0].main),
            main: item.weather[0].main
          });
        }
      });
      
      // Display next 5 days
      dailyForecasts.slice(0, 5).forEach(day => {
        forecastDays.innerHTML += `
          <div class="day">
            ${day.day}<br/>
            ${day.icon}<br/>
            ${day.temp}°C
          </div>
        `;
      });

      // Update weather distribution pie chart
      const totalItems = forecastData.list.length;
      const sunnyCount = forecastData.list.filter(item => 
        item.weather[0].main.toLowerCase().includes('clear')
      ).length;
      const rainyCount = forecastData.list.filter(item => 
        item.weather[0].main.toLowerCase().includes('rain')
      ).length;
      
      document.getElementById('weatherSun').textContent = `${Math.round((sunnyCount / totalItems) * 100)}%`;
      document.getElementById('weatherRain').textContent = `${Math.round((rainyCount / totalItems) * 100)}%`;
    }

    // Update major cities
    updateMajorCities();

  } catch (error) {
    errorMsg.textContent = "Failed to fetch weather data. Please try again later.";
    console.error(error);
  }
}

// Initialize the app
updateCurrentDate();
updateMajorCities();

// Allow search on Enter key
document.getElementById('cityInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    getWeather();
  }
});