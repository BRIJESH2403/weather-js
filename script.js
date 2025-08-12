document.addEventListener("DOMContentLoaded", async () => {
  const SunTimer = document.getElementById("sun-timer");
  const SunRise = document.getElementById("sunrise");
  const SunSet = document.getElementById("sunset");
  const sunStatusText = document.getElementById("sun-status-text");
  if ("geolocation" in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const locationString = `${latitude},${longitude}`;
      await fetchWeather(locationString);
      await fetchMoonData(locationString);
    } catch (error) {
      console.error("Geolocation error:", error.message);
      
      const indiaLocation = "28.6139,77.2090"; 
      await fetchWeather(indiaLocation);
      await fetchMoonData(indiaLocation);
    }
  } else {
    console.warn("Geolocation not supported.");
    
    const indiaLocation = "28.6139,77.2090"; // Delhi coordinates
    await fetchWeather(indiaLocation);
    await fetchMoonData(indiaLocation);
  }

  const searchBox = document.getElementById("city");
  const searchButton = document.getElementById("search-btn");

  searchButton.addEventListener("click", () => {
    const city = searchBox.value.trim();
    if (city) {
      fetchWeather(city);
      fetchMoonData(city);
    }
  });

  searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const city = searchBox.value.trim();
      if (city) {
        fetchWeather(city);
        fetchMoonData(city);
      }
    }
  });

  async function fetchWeather(city) {
    const apiKey = "01a4ec62be614564bbb83937252703";
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7&aqi=no&alerts=no`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      updateCurrentWeather(data);
      updateHourlyForecast(data.forecast.forecastday[0].hour, data.current);
      updateWeeklyForecast(data.forecast.forecastday, data.location.localtime);
    } catch (error) {
      console.error("Error fetching weather data:", error.message);
      alert("Failed to fetch weather data. Please try again later.");
    }
  }

  async function fetchMoonData(city) {
    const apiKey = "01a4ec62be614564bbb83937252703";
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.weatherapi.com/v1/astronomy.json?key=${apiKey}&q=${city}&dt=${today}`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const astro = data.astronomy.astro;
      updateMoonInfo(astro);
      updateSunInfo(astro, data.location.localtime);
    } catch (error) {
      console.error("Error fetching moon data:", error.message);
    }
  }

  function updateMoonInfo(astro) {
    const moonPhaseEl = document.getElementById("moon-phase");
    const moonriseEl = document.getElementById("moonrise");
    const moonsetEl = document.getElementById("moonset");
    const moonImgEl = document.querySelector(".Image03");

    if (moonPhaseEl) moonPhaseEl.textContent = astro.moon_phase;
    if (moonriseEl) moonriseEl.textContent = astro.moonrise;
    if (moonsetEl) moonsetEl.textContent = astro.moonset;

    const moonPhaseImages = {
      "New Moon": "New Moon.png",
      "Waxing Crescent": "Waxing Crescent.png",
      "First Quarter": "First Quarter.png",
      "Waxing Gibbous": "Waxing Gibbous.png",
      "Full Moon": "Full Moon.png",
      "Waning Gibbous": "Waning Gibbous.png",
      "Last Quarter": "Last Quarter.png",
      "Waning Crescent": "Waning Crescent.png",
    };

    const imageName = moonPhaseImages[astro.moon_phase];
    if (moonImgEl && imageName) {
      moonImgEl.src = `assets/images/${imageName}`;
      moonImgEl.alt = astro.moon_phase;
    }
  }

  function updateSunInfo(astro, localTime) {
    let timeDiffinSeconds = 0;
    const locationLocalTime = dayjs(localTime).format("YYYY-MM-DD HH:mm:ss");
    const localDate = locationLocalTime.split(" ")[0];
    const locationSunriseTime = dayjs(`${localDate} ${astro.sunrise}`).format(
      "hh:mm a"
    );
    const locationSunsetTime = dayjs(`${localDate} ${astro.sunset}`).format(
      "hh:mm a"
    );

    SunRise.textContent = locationSunriseTime;
    SunSet.textContent = locationSunsetTime;

    if (Boolean(astro.is_sun_up)) {
      sunStatusText.textContent = "Sunset in:";
      timeDiffinSeconds = dayjs(`${localDate} ${astro.sunset}`).diff(
        dayjs(localTime),
        "second"
      );
    } else {
      sunStatusText.textContent = "Sunrise in:";

      const todaySunrise = dayjs(`${localDate} ${astro.sunrise}`);
      const currentTime = dayjs(localTime);

      if (todaySunrise.isBefore(currentTime)) {
        const tomorrow = currentTime.add(1, "day").format("YYYY-MM-DD");
        const nextSunrise = dayjs(`${tomorrow} ${astro.sunrise}`);
        timeDiffinSeconds = nextSunrise.diff(currentTime, "second");
      } else {
        timeDiffinSeconds = todaySunrise.diff(currentTime, "second");
      }
    }

    SunTimer.textContent = formatSeconds(timeDiffinSeconds);

    console.log(
      locationLocalTime,
      locationSunriseTime,
      locationSunsetTime,
      formatSeconds(timeDiffinSeconds)
    );
  }

  function formatSeconds(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
  }

  function updateCurrentWeather(data) {
    const cityElement = document.querySelector(".Hongkong05");
    const timeElement = document.querySelector(".Time05");
    const tempElement = document.querySelector(".Temp05");
    const iconElement = document.querySelector(".HeavyRainstormColor img");

    if (cityElement) cityElement.textContent = data.location.name;
    if (timeElement)
      timeElement.textContent = formatDateTime(data.location.localtime);
    if (tempElement)
      tempElement.textContent = `${Math.round(data.current.temp_c)}°C`;
    if (iconElement) iconElement.src = `https:${data.current.condition.icon}`;
  }

  function updateHourlyForecast(hourlyData, currentData) {
    const hourElements = document.querySelectorAll(".Card07 .Row07");

    const nowRow = hourElements[0];
    if (nowRow) {
      const tempNow = nowRow.querySelector(".temp-for-third-div");
      const iconNow = nowRow.querySelector("img");
      if (tempNow) tempNow.textContent = `${Math.round(currentData.temp_c)}°`;
      if (iconNow) iconNow.src = `https:${currentData.condition.icon}`;
    }

    const nextHours = getNext6Hours(hourlyData, currentData.last_updated);
    nextHours.forEach((hour, index) => {
      const row = hourElements[index + 1];
      if (row) {
        const timeElement = row.querySelector(".Am span");
        const tempElement = row.querySelector(".temp-for-third-div");
        const iconElement = row.querySelector("img");
        if (timeElement) timeElement.textContent = formatHour(hour.time);
        if (tempElement)
          tempElement.textContent = `${Math.round(hour.temp_c)}°`;
        if (iconElement) iconElement.src = `https:${hour.condition.icon}`;
      }
    });
  }

  function updateWeeklyForecast(weeklyData, localtime) {
    const weekElements = document.querySelectorAll(".Card06 .Line");
    const today = new Date(localtime);
    const todayDate = today.toISOString().split("T")[0];

    const startIndex = weeklyData.findIndex((day) => day.date === todayDate);
    const orderedDays = [
      ...weeklyData.slice(startIndex),
      ...weeklyData.slice(0, startIndex),
    ];

    orderedDays.forEach((day, index) => {
      if (weekElements[index]) {
        const line = weekElements[index];
        const dayElement = line.querySelector(".Today06");
        const maxTempElement = line.querySelector(
          ".Temperature06 div:nth-child(1)"
        );
        const minTempElement = line.querySelector(
          ".Temperature06 div:nth-child(2)"
        );
        const iconElement = line.querySelector("img");

        if (dayElement) dayElement.textContent = formatDay(day.date);
        if (maxTempElement)
          maxTempElement.textContent = `${Math.round(day.day.maxtemp_c)}°`;
        if (minTempElement)
          minTempElement.textContent = `${Math.round(day.day.mintemp_c)}°`;
        if (iconElement) iconElement.src = `https:${day.day.condition.icon}`;
      }
    });
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm} • ${date.getDate()}-${date.toLocaleString(
      "en-US",
      { month: "short" }
    )}-${date.getFullYear()}`;
  }

  function formatHour(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  }

  function formatDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  function getNext6Hours(hourlyData, currentTimeString) {
    const currentTime = new Date(currentTimeString);
    const currentHour = currentTime.getHours();

    const upcoming = hourlyData.filter((hour) => {
      const hourDate = new Date(hour.time);
      return (
        hourDate.getHours() > currentHour ||
        hourDate.getDate() > currentTime.getDate()
      );
    });
    return upcoming.slice(0, 6);
  }
});
