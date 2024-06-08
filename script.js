const weatherApiKey = 'dba6fe7e001cace32c32c58952e1afbc';
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastApiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

let map; // Declare map variable outside functions
let forecastVisible = false; // Track forecast visibility

document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    getWeatherData(city);
});

document.getElementById('forecastBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    toggleForecast(city);
});

// Define temperature ranges and corresponding background images
const temperatureBackgrounds = [
    { min: -100, max: -20, image: 'url("freeze.jpg")' },
    { min: -20, max: 0, image: 'url("cold.jpg")' },
    { min: 0, max: 10, image: 'url("cool.jpg")' },
    { min: 10, max: 20, image: 'url("mild.jpg")' },
    { min: 20, max: 30, image: 'url("warm.jpg")' },
    { min: 30, max: 40, image: 'url("hot.jpg")' },
    { min: 40, max: 100, image: 'url("very-hot.jpg")' }
];

const defaultBackground = 'url("default.jpg")';

function getWeatherData(city) {
    fetch(`${weatherApiUrl}?q=${city}&appid=${weatherApiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(data => {
            displayWeather(data);
            setBackgroundByTemperature(data.main.temp);
            displayMap(data.coord.lat, data.coord.lon);
            document.getElementById('forecastBtn').style.display = 'block';
            forecastVisible = false;
            const forecastInfoDiv = document.getElementById('forecastInfo');
            forecastInfoDiv.style.display = 'none';
            forecastInfoDiv.classList.remove('show');
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            showError(error.message);
        });
}

function setBackgroundByTemperature(temperature) {
    const body = document.querySelector('body');
    let backgroundImage = defaultBackground; // Default background image


    for (const range of temperatureBackgrounds) {
        if (temperature >= range.min && temperature < range.max) {
            backgroundImage = range.image;
            break; // Use the first matching temperature range
        }
    }
    body.style.backgroundImage = backgroundImage;
    body.style.backgroundSize = 'cover'; // Set background image to cover the screen
}

window.addEventListener('load', () => {
    setBackgroundByTemperature(); // No temperature argument provided to load default background
});

function toggleForecast(city) {
    const forecastInfoDiv = document.getElementById('forecastInfo');
    if (forecastVisible) {
        forecastInfoDiv.classList.remove('show');
        setTimeout(() => {
            forecastInfoDiv.style.display = 'none';
        }, 500); // Match this duration with the CSS transition duration
        forecastVisible = false;
    } else {
        getForecastData(city);
    }
}

function getForecastData(city) {
    fetch(`${forecastApiUrl}?q=${city}&appid=${weatherApiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast not found');
            }
            return response.json();
        })
        .then(data => {
            displayForecast(data);
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            showError(error.message);
        });
}

function displayWeather(data) {
    const weatherInfoDiv = document.getElementById('weatherInfo');
    weatherInfoDiv.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p>Temperature: ${data.main.temp}°C <i class="fas fa-thermometer-half"></i></p>
        <p>Weather: ${data.weather[0].main} <i class="fas fa-cloud"></i></p>
        <p>Description: ${data.weather[0].description} <i class="fas fa-info-circle"></i></p>
        <p>Humidity: ${data.main.humidity}% <i class="fas fa-tint"></i></p>
    `;
}

function displayMap(lat, lon) {
    const mapElement = document.getElementById('map');
    if (map) {
        map.remove(); // Remove previous map instance
    }
    mapElement.innerHTML = ''; // Clear previous map content

    map = L.map(mapElement).setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lon]).addTo(map)
        .bindPopup('Weather location')
        .openPopup();
}

function showError(message) {
    const weatherInfoDiv = document.getElementById('weatherInfo');
    weatherInfoDiv.innerHTML = `<p class="error">${message}</p>`;
    document.getElementById('forecastBtn').style.display = 'none';
    document.getElementById('forecastInfo').style.display = 'none';
}


function displayForecast(data) {
    const forecastInfoDiv = document.getElementById('forecastInfo');
    forecastInfoDiv.innerHTML = '<h3>3-Day Forecast</h3>';

    const forecasts = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!forecasts[date]) {
            forecasts[date] = [];
        }
        forecasts[date].push(item);
    });

    const forecastDates = Object.keys(forecasts).slice(0, 3);

    forecastDates.forEach(date => {
        const dayForecast = forecasts[date];
        const averageTemp = (dayForecast.reduce((acc, cur) => acc + cur.main.temp, 0) / dayForecast.length).toFixed(2);
        const description = dayForecast[0].weather[0].description;
        const humidity = dayForecast[0].main.humidity;

        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

        forecastInfoDiv.innerHTML += `
            <div class="forecast-item">
                <h4>${dayOfWeek}, ${date}</h4>
                <p>Avg Temp: ${averageTemp}°C <i class="fas fa-thermometer-half"></i></p>
                <p>Description: ${description} <i class="fas fa-info-circle"></i></p>
                <p>Humidity: ${humidity}% <i class="fas fa-tint"></i></p>
            </div>
        `;
    });

    forecastInfoDiv.style.display = 'block';
    setTimeout(() => {
        forecastInfoDiv.classList.add('show');
    }, 10); // Slight delay to trigger CSS transition
    forecastVisible = true;
}

document.getElementById('cityInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});
