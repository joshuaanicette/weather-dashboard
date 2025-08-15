const API_URL = '/api'; // Use relative path for Vercel; update for local Docker

async function fetchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('Please enter or speak a city name');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.weather) {
            // Update weather info
            document.getElementById('weatherInfo').innerText = `
                City: ${data.weather.name}
                Temperature: ${data.weather.temp_f.toFixed(1)}°F / ${data.weather.temp_c.toFixed(1)}°C
                Feels Like: ${data.weather.feels_f.toFixed(1)}°F / ${data.weather.feels_c.toFixed(1)}°C
                Weather: ${data.weather.description}
                Humidity: ${data.weather.humidity}%
                Wind Speed: ${data.weather.wind_speed} m/s
                Coordinates: (${data.weather.lat}, ${data.weather.lon})
            `;
            document.getElementById('aqiInfo').innerText = `
                Air Quality Index: ${data.aqi.aqi} - ${data.aqi.level}
            `;
            // Draw forecast charts
            drawForecastCharts(data.forecast);
            // Update saved cities
            updateSavedCities();
        } else {
            alert('Error fetching weather data');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function drawForecastCharts(forecast) {
    const labels = forecast.map(item => item.dt_txt.split(' ')[1].slice(0, 5)); // Extract time (HH:MM)
    
    // Temperature Chart
    const tempData = forecast.map(item => item.temp_f);
    new Chart(document.getElementById('tempChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°F)',
                data: tempData,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false, title: { display: true, text: 'Temperature (°F)' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });

    // Humidity Chart
    const humidityData = forecast.map(item => item.humidity);
    new Chart(document.getElementById('humidityChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humidity (%)',
                data: humidityData,
                borderColor: '#4bc0c0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Humidity (%)' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });

    // Rain Chart
    const rainData = forecast.map(item => item.rain);
    new Chart(document.getElementById('rainChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rain (mm)',
                data: rainData,
                borderColor: '#1e90ff',
                backgroundColor: 'rgba(30, 144, 255, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Rain (mm)' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });

    // Snow Chart
    const snowData = forecast.map(item => item.snow);
    new Chart(document.getElementById('snowChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Snow (mm)',
                data: snowData,
                borderColor: '#6a5acd',
                backgroundColor: 'rgba(106, 90, 205, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Snow (mm)' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });
}

async function updateSavedCities() {
    try {
        const response = await fetch(`${API_URL}/cities`);
        const cities = await response.json();
        const ul = document.getElementById('savedCities');
        ul.innerHTML = '';
        cities.forEach(city => {
            const li = document.createElement('li');
            li.innerText = city;
            li.onclick = () => {
                document.getElementById('cityInput').value = city;
                fetchWeather();
            };
            ul.appendChild(li);
        });
    } catch (error) {
        console.error('Error updating saved cities:', error);
    }
}

function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        document.getElementById('cityInput').placeholder = 'Listening...';
    };

    recognition.onresult = (event) => {
        const city = event.results[0][0].transcript.trim();
        document.getElementById('cityInput').value = city;
        document.getElementById('cityInput').placeholder = 'e.g., London';
        // Use TTS to confirm city
        const utterance = new SpeechSynthesisUtterance(`City set to ${city}`);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        fetchWeather();
    };

    recognition.onerror = (event) => {
        document.getElementById('cityInput').placeholder = 'e.g., London';
        alert('Speech recognition error: ' + event.error);
    };

    recognition.onend = () => {
        document.getElementById('cityInput').placeholder = 'e.g., London';
    };

    recognition.start();
}

// Load saved cities on page load
updateSavedCities();