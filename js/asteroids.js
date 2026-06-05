/* ================================
   NASA Space Explorer
   asteroids.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the Asteroid Tracker page:
  - Select start date
  - Select end date
  - Fetch Near Earth Objects
  - Show asteroid stats
  - Show asteroid cards
  - Cache results in localStorage
*/

/* ---------- ELEMENTS ---------- */
const asteroidStartDate = byId("asteroidStartDate");
const asteroidEndDate = byId("asteroidEndDate");

const asteroidLoadBtn = byId("asteroidLoadBtn");
const asteroidTodayBtn = byId("asteroidTodayBtn");
const asteroidClearCacheBtn = byId("asteroidClearCacheBtn");

const asteroidStatus = byId("asteroidStatus");
const asteroidResults = byId("asteroidResults");

const asteroidTotalCount = byId("asteroidTotalCount");
const asteroidHazardCount = byId("asteroidHazardCount");
const asteroidClosestName = byId("asteroidClosestName");
const asteroidDateRange = byId("asteroidDateRange");

/* ---------- UI STATES ---------- */
function showAsteroidLoading(message = "Connecting to NASA NeoWs API...") {
  if (asteroidStatus) {
    asteroidStatus.textContent = message;
    asteroidStatus.classList.remove("error-message");
  }

  if (asteroidResults) {
    asteroidResults.innerHTML = createSkeletonCards(6);
  }

  updateAsteroidStats({
    total: "Loading...",
    hazardous: "Loading...",
    closest: "Loading...",
    range: getSelectedDateRangeText()
  });
}

function showAsteroidError(message) {
  if (asteroidStatus) {
    asteroidStatus.textContent = message;
    asteroidStatus.classList.add("error-message");
  }

  if (asteroidResults) {
    asteroidResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load asteroid data. Check your API key, internet connection, or selected date range.
      </div>
    `;
  }

  updateAsteroidStats({
    total: "0",
    hazardous: "0",
    closest: "—",
    range: getSelectedDateRangeText()
  });
}

/* ---------- DATE HELPERS ---------- */
function getSelectedDateRangeText() {
  const start = asteroidStartDate?.value || "—";
  const end = asteroidEndDate?.value || "—";

  if (start === end) {
    return start;
  }

  return `${start} → ${end}`;
}

function setTodayAsteroidDates() {
  const today = getTodayDate();

  if (asteroidStartDate) {
    asteroidStartDate.value = today;
  }

  if (asteroidEndDate) {
    asteroidEndDate.value = today;
  }
}

/*
  NASA NeoWs feed allows a limited date range.
  Keep range small so the project stays fast and avoids API errors.
*/
function validateAsteroidDates() {
  const start = asteroidStartDate?.value;
  const end = asteroidEndDate?.value;

  if (!start || !end) {
    showAsteroidError("Please select both start date and end date.");
    return false;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (endDate < startDate) {
    showAsteroidError("End date cannot be before start date.");
    return false;
  }

  const diffMs = endDate - startDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > 7) {
    showAsteroidError("Please select a maximum date range of 7 days.");
    return false;
  }

  return true;
}

/* ---------- STATS ---------- */
function updateAsteroidStats({ total, hazardous, closest, range }) {
  if (asteroidTotalCount) {
    asteroidTotalCount.textContent = total ?? "—";
  }

  if (asteroidHazardCount) {
    asteroidHazardCount.textContent = hazardous ?? "—";
  }

  if (asteroidClosestName) {
    asteroidClosestName.textContent = closest ?? "—";
  }

  if (asteroidDateRange) {
    asteroidDateRange.textContent = range ?? "—";
  }
}

function flattenAsteroidData(data) {
  const objectsByDate = data.near_earth_objects || {};
  const allObjects = [];

  Object.keys(objectsByDate).forEach((date) => {
    objectsByDate[date].forEach((object) => {
      allObjects.push({
        ...object,
        approach_date: date
      });
    });
  });

  return allObjects;
}

function getClosestAsteroid(asteroids) {
  if (!asteroids.length) return null;

  return asteroids.reduce((closest, current) => {
    const currentDistance = Number(
      current.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity
    );

    const closestDistance = Number(
      closest.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity
    );

    return currentDistance < closestDistance ? current : closest;
  });
}

/* ---------- CARD ---------- */
function createAsteroidCard(asteroid) {
  const approach = asteroid.close_approach_data?.[0] || {};

  const name = asteroid.name || "Unknown Asteroid";
  const isHazardous = asteroid.is_potentially_hazardous_asteroid;

  const speed = Number(approach.relative_velocity?.kilometers_per_hour || 0);
  const distance = Number(approach.miss_distance?.kilometers || 0);

  const minDiameter = Number(
    asteroid.estimated_diameter?.meters?.estimated_diameter_min || 0
  );

  const maxDiameter = Number(
    asteroid.estimated_diameter?.meters?.estimated_diameter_max || 0
  );

  const closeDate = approach.close_approach_date || asteroid.approach_date || "—";

  return `
    <article class="result-card asteroid-card">
      <div class="result-card-body">
        <span class="badge ${isHazardous ? "badge-danger" : "badge-safe"}">
          ${isHazardous ? "Hazardous" : "Safe"}
        </span>

        <h3>${name}</h3>

        <p>
          Near-Earth object detected for the selected date range.
        </p>

        <div class="asteroid-data-list">
          <span>
            Close Date
            <b>${closeDate}</b>
          </span>

          <span>
            Speed
            <b>${formatNumber(Math.round(speed))} km/h</b>
          </span>

          <span>
            Miss Distance
            <b>${formatNumber(Math.round(distance))} km</b>
          </span>

          <span>
            Size Estimate
            <b>${Math.round(minDiameter)}m - ${Math.round(maxDiameter)}m</b>
          </span>
        </div>

        ${
          asteroid.nasa_jpl_url
            ? `<a href="${asteroid.nasa_jpl_url}" target="_blank" class="card-link">Open JPL Data</a>`
            : ""
        }
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderAsteroids(data, meta = {}) {
  const asteroids = flattenAsteroidData(data);
  const hazardousObjects = asteroids.filter(
    (item) => item.is_potentially_hazardous_asteroid
  );

  const closest = getClosestAsteroid(asteroids);

  updateAsteroidStats({
    total: asteroids.length,
    hazardous: hazardousObjects.length,
    closest: closest ? closest.name : "—",
    range: getSelectedDateRangeText()
  });

  if (asteroidStatus) {
    asteroidStatus.textContent = meta.fromCache
      ? `Loaded ${asteroids.length} objects from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${asteroids.length} objects from NASA NeoWs API in ${meta.loadTime}ms.`;

    asteroidStatus.classList.remove("error-message");
  }

  if (!asteroidResults) return;

  if (!asteroids.length) {
    asteroidResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No near-Earth objects found for this date range.
      </div>
    `;
    return;
  }

  asteroidResults.innerHTML = asteroids
    .slice(0, 30)
    .map((asteroid) => createAsteroidCard(asteroid))
    .join("");
}

/* ---------- API URL ---------- */
function getAsteroidApiUrl() {
  const startDate = asteroidStartDate?.value || getTodayDate();
  const endDate = asteroidEndDate?.value || startDate;

  return buildNasaUrl(API_ENDPOINTS.asteroids, {
    start_date: startDate,
    end_date: endDate
  });
}

/* ---------- LOAD DATA ---------- */
async function loadAsteroids() {
  if (!validateAsteroidDates()) return;

  const startDate = asteroidStartDate.value;
  const endDate = asteroidEndDate.value;

  const cacheKey = `asteroids-${startDate}-${endDate}`;
  const url = getAsteroidApiUrl();

  console.log("Asteroid API URL:", url);

  showAsteroidLoading("Checking asteroid cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderAsteroids(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("Asteroid API Error:", error);
    showAsteroidError(`Asteroid request failed: ${error.message}`);
  }
}

/* ---------- CLEAR CACHE ---------- */
function clearAsteroidCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}asteroids-`)) {
        localStorage.removeItem(key);
      }
    });

    if (asteroidStatus) {
      asteroidStatus.textContent = "Asteroid cache cleared successfully.";
      asteroidStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("Asteroid cache clear error:", error);

    if (asteroidStatus) {
      asteroidStatus.textContent = "Could not clear asteroid cache.";
      asteroidStatus.classList.add("error-message");
    }
  }
}

/* ---------- INIT ---------- */
function initAsteroidPage() {
  if (!asteroidStartDate || !asteroidEndDate) return;

  const today = getTodayDate();

  asteroidStartDate.max = today;
  asteroidEndDate.max = today;

  setTodayAsteroidDates();

  updateAsteroidStats({
    total: "—",
    hazardous: "—",
    closest: "—",
    range: getSelectedDateRangeText()
  });

  if (asteroidLoadBtn) {
    asteroidLoadBtn.addEventListener("click", loadAsteroids);
  }

  if (asteroidTodayBtn) {
    asteroidTodayBtn.addEventListener("click", () => {
      setTodayAsteroidDates();
      loadAsteroids();
    });
  }

  if (asteroidClearCacheBtn) {
    asteroidClearCacheBtn.addEventListener("click", clearAsteroidCache);
  }

  asteroidStartDate.addEventListener("change", () => {
    updateAsteroidStats({
      total: asteroidTotalCount?.textContent || "—",
      hazardous: asteroidHazardCount?.textContent || "—",
      closest: asteroidClosestName?.textContent || "—",
      range: getSelectedDateRangeText()
    });
  });

  asteroidEndDate.addEventListener("change", () => {
    updateAsteroidStats({
      total: asteroidTotalCount?.textContent || "—",
      hazardous: asteroidHazardCount?.textContent || "—",
      closest: asteroidClosestName?.textContent || "—",
      range: getSelectedDateRangeText()
    });
  });

  loadAsteroids();
}

document.addEventListener("DOMContentLoaded", initAsteroidPage);