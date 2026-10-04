const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusMsg = document.getElementById("statusMsg");
const currentCard = document.getElementById("currentCard");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const windEl = document.getElementById("wind");
const conditionEl = document.getElementById("condition");
const forecastBody = document.getElementById("forecastBody");

// ============================================================
// TASK 1 — WEATHER CODE DESCRIPTION
// ============================================================

function describeWeatherCode(code) {
    if (code === 0) return "Clear sky";
    if (code >= 1 && code <= 3) return "Partly cloudy";
    if (code === 45 || code === 48) return "Fog";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Unknown";
}

// ============================================================
// TASK 2 — STATUS MESSAGE & GEOCODING API
// ============================================================

function setStatus(message, isError = false) {
    statusMsg.textContent = message;
    if (isError) {
        statusMsg.classList.add("error");
    } else {
        statusMsg.classList.remove("error");
    }
}

async function geocodeCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Geocoding request failed");
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found — try another name.");
    }

    return data.results[0];
}

// ============================================================
// TASK 3 — FORECAST API & CURRENT WEATHER DISPLAY
// ============================================================

async function fetchForecast(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Forecast request failed");
    }

    return res.json();
}

function renderCurrentWeather(place, weatherData) {
    const current = weatherData.current_weather;

    // Display the city name and country (matches TODO 9 element id="cityName")
    if (cityNameEl) {
        cityNameEl.textContent = place.country ? `${place.name}, ${place.country}` : place.name;
    }

    // Display temperature and wind speed
    tempEl.textContent = `${current.temperature} °C`;
    windEl.textContent = `${current.windspeed} km/h`;

    // Display condition description using weather code
    conditionEl.textContent = describeWeatherCode(current.weathercode);

    // Make the current weather card visible
    currentCard.classList.remove("hidden");
}

// ============================================================
// TASK 4 — POPULATE THE FORECAST TABLE
// ============================================================

function renderForecastTable(daily) {
    // 1. Clear any existing rows to prevent duplication
    forecastBody.innerHTML = "";

    // 2. Loop through parallel arrays using their shared index
    for (let i = 0; i < daily.time.length; i++) {
        const row = document.createElement("tr");

        const date = daily.time[i];
        const condition = describeWeatherCode(daily.weathercode[i]);
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const precipitation = daily.precipitation_sum[i];

        // 3. Create five table cells and append them
        row.innerHTML = `
            <td>${date}</td>
            <td>${condition}</td>
            <td>${maxTemp} °C</td>
            <td>${minTemp} °C</td>
            <td>${precipitation} mm</td>
        `;

        // Stretch Goal: Highlight rainy days where precipitation > 0
        if (precipitation > 0) {
            row.classList.add("rainy");
        }

        forecastBody.appendChild(row);
    }
}

// ============================================================
// HANDLE SEARCH LOGIC & EVENT LISTENERS
// ============================================================

async function handleSearch() {
    const city = cityInput.value.trim();

    if (!city) {
        setStatus("Please type a city name.", true);
        return;
    }

    // Reset previous views/errors & show loading state
    currentCard.classList.add("hidden");
    forecastBody.innerHTML = "";
    setStatus("Loading…");

    try {
        // Step 1: Get coordinates from Geocoding API
        const place = await geocodeCity(city);
        console.log("Coordinates:", place.latitude, place.longitude);

        // Step 2: Fetch weather forecast using coordinates
        const weatherData = await fetchForecast(place.latitude, place.longitude);

        // Step 3 & 4: Render Current Weather & Forecast Table
        renderCurrentWeather(place, weatherData);
        renderForecastTable(weatherData.daily);

        // Clear status message on success
        setStatus("");
    } catch (err) {
        setStatus(err.message, true);
    }
}

// Event Listeners for Search Button and Enter Key
searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleSearch();
    }
});