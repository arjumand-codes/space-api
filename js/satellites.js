/* ================================
   NASA Space Explorer
   satellites.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the Satellite Tracker page:
  - Search satellite TLE records by name
  - Search satellite TLE records by NORAD ID
  - Show featured satellite details
  - Show TLE line 1 and line 2
  - Cache results in localStorage
*/

/* ---------- ELEMENTS ---------- */
const satelliteSearchInput = byId("satelliteSearchInput");
const satelliteSearchType = byId("satelliteSearchType");

const satelliteSearchBtn = byId("satelliteSearchBtn");
const satelliteDemoBtn = byId("satelliteDemoBtn");
const satelliteClearCacheBtn = byId("satelliteClearCacheBtn");

const satelliteStatus = byId("satelliteStatus");
const satelliteResults = byId("satelliteResults");

const satelliteQueryText = byId("satelliteQueryText");
const satelliteTypeText = byId("satelliteTypeText");
const satelliteResultCount = byId("satelliteResultCount");

const satelliteFeaturedTag = byId("satelliteFeaturedTag");
const satelliteFeaturedTitle = byId("satelliteFeaturedTitle");
const satelliteFeaturedText = byId("satelliteFeaturedText");

const satelliteNoradId = byId("satelliteNoradId");
const satelliteName = byId("satelliteName");
const satelliteUpdated = byId("satelliteUpdated");

/*
  NASA TLE API is listed on NASA Open APIs, but its live service is powered by
  this public TLE API backend. It returns JSON satellite TLE records.
*/
const TLE_API_BASE = "https://tle.ivanstanojevic.me/api/tle";

/* ---------- UI STATES ---------- */
function showSatelliteLoading(message = "Searching satellite orbit data...") {
  if (satelliteStatus) {
    satelliteStatus.textContent = message;
    satelliteStatus.classList.remove("error-message");
  }

  if (satelliteResults) {
    satelliteResults.innerHTML = createSkeletonCards(6);
  }

  updateSatelliteStats({
    query: satelliteSearchInput?.value || "ISS",
    type: satelliteSearchType?.value || "name",
    count: "Loading..."
  });

  updateSatelliteFeatured({
    tag: "Loading...",
    title: "Searching Satellite Data",
    text: "Please wait while the project connects to the TLE API.",
    norad: "—",
    name: "—",
    updated: "—"
  });
}

function showSatelliteError(message) {
  if (satelliteStatus) {
    satelliteStatus.textContent = message;
    satelliteStatus.classList.add("error-message");
  }

  if (satelliteResults) {
    satelliteResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load satellite data. Try ISS, STARLINK, NOAA, HUBBLE, or a NORAD ID.
      </div>
    `;
  }

  updateSatelliteStats({
    query: satelliteSearchInput?.value || "—",
    type: satelliteSearchType?.value || "—",
    count: "0"
  });

  updateSatelliteFeatured({
    tag: "Error",
    title: "Satellite Request Failed",
    text: "The TLE request failed. Try another satellite name or check your internet connection.",
    norad: "—",
    name: "—",
    updated: "—"
  });
}

/* ---------- STATS ---------- */
function updateSatelliteStats({ query, type, count }) {
  if (satelliteQueryText) {
    satelliteQueryText.textContent = query || "—";
  }

  if (satelliteTypeText) {
    satelliteTypeText.textContent = type === "norad" ? "NORAD ID" : "Name";
  }

  if (satelliteResultCount) {
    satelliteResultCount.textContent = count ?? "—";
  }
}

function updateSatelliteFeatured({ tag, title, text, norad, name, updated }) {
  if (satelliteFeaturedTag) {
    satelliteFeaturedTag.textContent = tag || "Ready";
  }

  if (satelliteFeaturedTitle) {
    satelliteFeaturedTitle.textContent = title || "Satellite Orbit Search";
  }

  if (satelliteFeaturedText) {
    satelliteFeaturedText.textContent =
      text || "Search by satellite name or NORAD ID to load TLE orbit data.";
  }

  if (satelliteNoradId) {
    satelliteNoradId.textContent = norad || "—";
  }

  if (satelliteName) {
    satelliteName.textContent = name || "—";
  }

  if (satelliteUpdated) {
    satelliteUpdated.textContent = updated || "—";
  }
}

/* ---------- DATA NORMALIZER ---------- */
function normalizeSatelliteResults(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.member)) {
    return data.member;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (data.name || data.satelliteId || data.satellite_id || data.noradId) {
    return [data];
  }

  return [];
}

function getSatelliteId(item) {
  return (
    item.satelliteId ||
    item.satellite_id ||
    item.noradId ||
    item.norad_id ||
    item.objectId ||
    item.id ||
    "—"
  );
}

function getSatelliteName(item) {
  return (
    item.name ||
    item.satelliteName ||
    item.satellite_name ||
    item.objectName ||
    "Unknown Satellite"
  );
}

function getTleLine1(item) {
  return item.line1 || item.tle_line1 || item.tle1 || item.tle?.line1 || "TLE line 1 unavailable";
}

function getTleLine2(item) {
  return item.line2 || item.tle_line2 || item.tle2 || item.tle?.line2 || "TLE line 2 unavailable";
}

function getUpdatedDate(item) {
  return (
    item.date ||
    item.updated ||
    item.updated_at ||
    item.last_updated ||
    item.epoch ||
    "Latest"
  );
}

/* ---------- API URL ---------- */
function getSatelliteApiUrl() {
  const query = satelliteSearchInput?.value.trim() || "ISS";
  const type = satelliteSearchType?.value || "name";

  if (type === "norad") {
    return `${TLE_API_BASE}/${encodeURIComponent(query)}`;
  }

  return buildUrl(TLE_API_BASE, {
    search: query
  });
}

/* ---------- RENDER FEATURED ---------- */
function renderFeaturedSatellite(item) {
  if (!item) return;

  const id = getSatelliteId(item);
  const name = getSatelliteName(item);
  const updated = getUpdatedDate(item);
  const line1 = getTleLine1(item);
  const line2 = getTleLine2(item);

  updateSatelliteFeatured({
    tag: "TLE Record",
    title: name,
    text: `NORAD satellite record with Two-Line Element orbit data. Line 1 starts with "${limitText(line1, 40)}" and line 2 contains the second orbit parameter line.`,
    norad: id,
    name,
    updated
  });
}

/* ---------- CARD ---------- */
function createSatelliteCard(item) {
  const id = getSatelliteId(item);
  const name = getSatelliteName(item);
  const updated = getUpdatedDate(item);
  const line1 = getTleLine1(item);
  const line2 = getTleLine2(item);

  return `
    <article class="result-card satellite-tle-card">
      <div class="result-card-body">
        <span class="badge badge-safe">TLE</span>

        <h3>${limitText(name, 46)}</h3>

        <p>
          Satellite orbit data record using Two-Line Element format.
        </p>

        <div class="satellite-card-meta">
          <span>
            NORAD ID
            <b>${id}</b>
          </span>

          <span>
            Updated
            <b>${limitText(String(updated), 22)}</b>
          </span>
        </div>

        <div class="tle-box">
          <code>${line1}</code>
          <code>${line2}</code>
        </div>
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderSatelliteData(data, meta = {}) {
  const items = normalizeSatelliteResults(data);
  const query = satelliteSearchInput?.value.trim() || "ISS";
  const type = satelliteSearchType?.value || "name";

  updateSatelliteStats({
    query,
    type,
    count: items.length
  });

  if (satelliteStatus) {
    satelliteStatus.textContent = meta.fromCache
      ? `Loaded ${items.length} satellite result(s) from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${items.length} satellite result(s) from TLE API in ${meta.loadTime}ms.`;

    satelliteStatus.classList.remove("error-message");
  }

  if (!satelliteResults) return;

  if (!items.length) {
    satelliteResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No satellite records found. Try ISS, STARLINK, NOAA, HUBBLE, TERRA, or LANDSAT.
      </div>
    `;

    updateSatelliteFeatured({
      tag: "No Results",
      title: "No Satellite Found",
      text: "Try a different satellite keyword or use the ISS Demo button.",
      norad: "—",
      name: "—",
      updated: "—"
    });

    return;
  }

  renderFeaturedSatellite(items[0]);

  satelliteResults.innerHTML = items
    .slice(0, 24)
    .map((item) => createSatelliteCard(item))
    .join("");
}

/* ---------- LOAD DATA ---------- */
async function loadSatelliteData() {
  const query = satelliteSearchInput?.value.trim() || "ISS";
  const type = satelliteSearchType?.value || "name";

  if (!query) {
    showSatelliteError("Please enter a satellite name or NORAD ID.");
    return;
  }

  if (type === "norad" && !/^\d+$/.test(query)) {
    showSatelliteError("NORAD search needs a number, for example: 25544 for ISS.");
    return;
  }

  const cacheKey = `satellite-${type}-${query.toLowerCase().replace(/\s+/g, "-")}`;
  const url = getSatelliteApiUrl();

  console.log("Satellite API URL:", url);

  showSatelliteLoading("Checking satellite cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderSatelliteData(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("Satellite API Error:", error);
    showSatelliteError(`Satellite request failed: ${error.message}`);
  }
}

/* ---------- DEMO / PRESETS ---------- */
function loadSatelliteDemo() {
  if (satelliteSearchInput) {
    satelliteSearchInput.value = "25544";
  }

  if (satelliteSearchType) {
    satelliteSearchType.value = "norad";
  }

  loadSatelliteData();
}

function initSatellitePresets() {
  const chips = qsa(".satellite-chip");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.satellite || "ISS";

      if (satelliteSearchInput) {
        satelliteSearchInput.value = value;
      }

      if (satelliteSearchType) {
        satelliteSearchType.value = "name";
      }

      loadSatelliteData();
    });
  });
}

/* ---------- CLEAR CACHE ---------- */
function clearSatelliteCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}satellite-`)) {
        localStorage.removeItem(key);
      }
    });

    if (satelliteStatus) {
      satelliteStatus.textContent = "Satellite cache cleared successfully.";
      satelliteStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("Satellite cache clear error:", error);

    if (satelliteStatus) {
      satelliteStatus.textContent = "Could not clear satellite cache.";
      satelliteStatus.classList.add("error-message");
    }
  }
}

/* ---------- INIT ---------- */
function initSatellitePage() {
  if (!satelliteSearchInput || !satelliteSearchBtn) return;

  satelliteSearchInput.value = "ISS";
  satelliteSearchType.value = "name";

  updateSatelliteStats({
    query: "ISS",
    type: "name",
    count: "—"
  });

  updateSatelliteFeatured({
    tag: "Ready",
    title: "Satellite Orbit Search",
    text: "Search by satellite name or NORAD ID to load TLE orbit data.",
    norad: "—",
    name: "—",
    updated: "—"
  });

  satelliteSearchBtn.addEventListener("click", loadSatelliteData);

  if (satelliteDemoBtn) {
    satelliteDemoBtn.addEventListener("click", loadSatelliteDemo);
  }

  if (satelliteClearCacheBtn) {
    satelliteClearCacheBtn.addEventListener("click", clearSatelliteCache);
  }

  satelliteSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loadSatelliteData();
    }
  });

  satelliteSearchType.addEventListener("change", () => {
    updateSatelliteStats({
      query: satelliteSearchInput.value || "—",
      type: satelliteSearchType.value,
      count: satelliteResultCount?.textContent || "—"
    });
  });

  initSatellitePresets();
  loadSatelliteData();
}

document.addEventListener("DOMContentLoaded", initSatellitePage);