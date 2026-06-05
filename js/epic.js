/* ================================
   NASA Space Explorer
   epic.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the EPIC Earth Images page:
  - Load EPIC images by selected date
  - Load latest available EPIC images
  - Show featured Earth image
  - Show image gallery
  - Cache results in localStorage
*/

/* ---------- ELEMENTS ---------- */
const epicDateInput = byId("epicDateInput");

const epicLoadBtn = byId("epicLoadBtn");
const epicDemoBtn = byId("epicDemoBtn");
const epicLatestBtn = byId("epicLatestBtn");
const epicClearCacheBtn = byId("epicClearCacheBtn");

const epicStatus = byId("epicStatus");
const epicResults = byId("epicResults");

const epicImageCount = byId("epicImageCount");
const epicSelectedDate = byId("epicSelectedDate");
const epicLoadSource = byId("epicLoadSource");
const epicLoadTime = byId("epicLoadTime");

const epicFeaturedMedia = byId("epicFeaturedMedia");
const epicFeaturedDate = byId("epicFeaturedDate");
const epicFeaturedTitle = byId("epicFeaturedTitle");
const epicFeaturedText = byId("epicFeaturedText");

const epicLat = byId("epicLat");
const epicLon = byId("epicLon");
const epicImageName = byId("epicImageName");

/* ---------- UI STATES ---------- */
function showEpicLoading(message = "Connecting to NASA EPIC API...") {
  if (epicStatus) {
    epicStatus.textContent = message;
    epicStatus.classList.remove("error-message");
  }

  if (epicFeaturedMedia) {
    epicFeaturedMedia.innerHTML = `<div class="skeleton-box"></div>`;
  }

  if (epicResults) {
    epicResults.innerHTML = createSkeletonCards(6);
  }

  updateEpicStats({
    count: "Loading...",
    date: epicDateInput?.value || "—",
    source: "—",
    time: "—"
  });

  setText("epicFeaturedDate", "Loading...");
  setText("epicFeaturedTitle", "Earth From Space");
  setText("epicFeaturedText", "Please wait while the project connects to NASA EPIC API.");
  setText("epicLat", "—");
  setText("epicLon", "—");
  setText("epicImageName", "—");
}

function showEpicError(message) {
  if (epicStatus) {
    epicStatus.textContent = message;
    epicStatus.classList.add("error-message");
  }

  if (epicFeaturedMedia) {
    epicFeaturedMedia.innerHTML = `
      <div class="status-message error-message" style="margin:20px;">
        Could not load EPIC image.
      </div>
    `;
  }

  if (epicResults) {
    epicResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load EPIC images. Try Demo Date or Latest.
      </div>
    `;
  }

  updateEpicStats({
    count: "0",
    date: epicDateInput?.value || "—",
    source: "Error",
    time: "—"
  });

  setText("epicFeaturedDate", "Connection Error");
  setText("epicFeaturedTitle", "EPIC Request Failed");
  setText(
    "epicFeaturedText",
    "The EPIC API request failed. Try the demo date, latest button, or check the API key."
  );
}

/* ---------- STATS ---------- */
function updateEpicStats({ count, date, source, time }) {
  if (epicImageCount) {
    epicImageCount.textContent = count ?? "—";
  }

  if (epicSelectedDate) {
    epicSelectedDate.textContent = date ? formatDate(date) : "—";
  }

  if (epicLoadSource) {
    epicLoadSource.textContent = source || "—";
  }

  if (epicLoadTime) {
    epicLoadTime.textContent = time || "—";
  }
}

/* ---------- EPIC IMAGE URL ---------- */
function getEpicImageUrl(item) {
  if (!item || !item.image || !item.date) return "";

  const dateOnly = item.date.split(" ")[0];
  const [year, month, day] = dateOnly.split("-");

  return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${item.image}.png?api_key=${NASA_API_KEY}`;
}

/* ---------- DATA HELPERS ---------- */
function getEpicCentroid(item) {
  const coordinates = item.centroid_coordinates || {};

  return {
    lat: coordinates.lat !== undefined ? Number(coordinates.lat).toFixed(2) : "—",
    lon: coordinates.lon !== undefined ? Number(coordinates.lon).toFixed(2) : "—"
  };
}

/* ---------- FEATURED ---------- */
function renderEpicFeatured(item) {
  if (!item) return;

  const imageUrl = getEpicImageUrl(item);
  const centroid = getEpicCentroid(item);
  const dateText = item.date ? item.date.split(" ")[0] : "—";

  if (epicFeaturedMedia) {
    epicFeaturedMedia.innerHTML = `
      <img
        src="${imageUrl}"
        alt="${item.caption || "NASA EPIC Earth Image"}"
        loading="lazy"
      />
    `;
  }

  setText("epicFeaturedDate", formatDate(dateText));
  setText("epicFeaturedTitle", item.caption || "Earth From Space");
  setText(
    "epicFeaturedText",
    "This Earth image was captured by NASA’s EPIC camera and loaded from the EPIC natural color image archive."
  );
  setText("epicLat", centroid.lat);
  setText("epicLon", centroid.lon);
  setText("epicImageName", item.image || "—");
}

/* ---------- CARD ---------- */
function createEpicImageCard(item) {
  const imageUrl = getEpicImageUrl(item);
  const centroid = getEpicCentroid(item);
  const dateText = item.date ? item.date.split(" ")[0] : "—";

  return `
    <article class="result-card epic-image-card">
      <img
        src="${imageUrl}"
        alt="${item.caption || "NASA EPIC Earth Image"}"
        loading="lazy"
      />

      <div class="result-card-body">
        <span class="badge badge-safe">EPIC</span>

        <h3>Earth Image</h3>

        <p>${limitText(item.caption || "NASA EPIC natural color Earth image.", 120)}</p>

        <div class="epic-card-meta">
          <span>
            Date
            <b>${dateText}</b>
          </span>

          <span>
            Latitude
            <b>${centroid.lat}</b>
          </span>

          <span>
            Longitude
            <b>${centroid.lon}</b>
          </span>

          <span>
            Image
            <b>${limitText(item.image || "—", 18)}</b>
          </span>
        </div>

        <a href="${imageUrl}" target="_blank" class="card-link">
          Open Image
        </a>
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderEpicImages(data, meta = {}) {
  const images = Array.isArray(data) ? data : [];
  const selectedDate = epicDateInput?.value || "—";

  updateEpicStats({
    count: images.length,
    date: selectedDate,
    source: meta.fromCache ? "Cache" : "Live API",
    time: meta.loadTime ? `${meta.loadTime}ms` : "—"
  });

  if (epicStatus) {
    epicStatus.textContent = meta.fromCache
      ? `Loaded ${images.length} EPIC images from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${images.length} EPIC images from NASA EPIC API in ${meta.loadTime}ms.`;

    epicStatus.classList.remove("error-message");
  }

  if (!images.length) {
    if (epicResults) {
      epicResults.innerHTML = `
        <div class="status-message" style="grid-column:1/-1;">
          No EPIC images found for this date. Try Demo Date or Latest.
        </div>
      `;
    }

    if (epicFeaturedMedia) {
      epicFeaturedMedia.innerHTML = `
        <div class="status-message" style="margin:20px;">
          No image available for this date.
        </div>
      `;
    }

    return;
  }

  renderEpicFeatured(images[0]);

  if (epicResults) {
    epicResults.innerHTML = images
      .slice(0, 24)
      .map((item) => createEpicImageCard(item))
      .join("");
  }
}

/* ---------- API URLS ---------- */
function getEpicDateApiUrl(date) {
  return buildNasaUrl(`${API_ENDPOINTS.epic}/date/${date}`);
}

function getEpicLatestApiUrl() {
  return buildNasaUrl(API_ENDPOINTS.epic);
}

/* ---------- LOAD BY DATE ---------- */
async function loadEpicImages() {
  const selectedDate = epicDateInput?.value;

  if (!selectedDate) {
    showEpicError("Please select a date or use the Demo Date button.");
    return;
  }

  const cacheKey = `epic-date-${selectedDate}`;
  const url = getEpicDateApiUrl(selectedDate);

  console.log("EPIC Date API URL:", url);

  showEpicLoading("Checking EPIC cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderEpicImages(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("EPIC API Error:", error);
    showEpicError(`EPIC request failed: ${error.message}`);
  }
}

/* ---------- LOAD LATEST ---------- */
async function loadLatestEpicImages() {
  const cacheKey = "epic-latest";
  const url = getEpicLatestApiUrl();

  console.log("EPIC Latest API URL:", url);

  showEpicLoading("Loading latest EPIC images...");

  try {
    const result = await fetchData(url, cacheKey);
    const images = Array.isArray(result.data) ? result.data : [];

    if (images.length && epicDateInput) {
      epicDateInput.value = images[0].date.split(" ")[0];
    }

    renderEpicImages(images, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("EPIC Latest Error:", error);
    showEpicError(`EPIC latest request failed: ${error.message}`);
  }
}

/* ---------- DEMO DATE ---------- */
function loadEpicDemoDate() {
  /*
    EPIC does not have images for every date.
    This old date is commonly available.
  */
  if (epicDateInput) {
    epicDateInput.value = "2015-10-31";
  }

  loadEpicImages();
}

/* ---------- CLEAR CACHE ---------- */
function clearEpicCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}epic-`)) {
        localStorage.removeItem(key);
      }
    });

    if (epicStatus) {
      epicStatus.textContent = "EPIC cache cleared successfully.";
      epicStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("EPIC cache clear error:", error);

    if (epicStatus) {
      epicStatus.textContent = "Could not clear EPIC cache.";
      epicStatus.classList.add("error-message");
    }
  }
}

/* ---------- INIT ---------- */
function initEpicPage() {
  if (!epicDateInput) return;

  epicDateInput.max = getTodayDate();
  epicDateInput.value = "2015-10-31";

  updateEpicStats({
    count: "—",
    date: epicDateInput.value,
    source: "—",
    time: "—"
  });

  if (epicLoadBtn) {
    epicLoadBtn.addEventListener("click", loadEpicImages);
  }

  if (epicDemoBtn) {
    epicDemoBtn.addEventListener("click", loadEpicDemoDate);
  }

  if (epicLatestBtn) {
    epicLatestBtn.addEventListener("click", loadLatestEpicImages);
  }

  if (epicClearCacheBtn) {
    epicClearCacheBtn.addEventListener("click", clearEpicCache);
  }

  epicDateInput.addEventListener("change", () => {
    updateEpicStats({
      count: epicImageCount?.textContent || "—",
      date: epicDateInput.value,
      source: epicLoadSource?.textContent || "—",
      time: epicLoadTime?.textContent || "—"
    });
  });

  loadEpicImages();
}

document.addEventListener("DOMContentLoaded", initEpicPage);