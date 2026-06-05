/* ================================
   NASA Space Explorer
   apod.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the APOD page:
  - Load today's Astronomy Picture of the Day
  - Load selected date picture
  - Load random APOD picture
  - Display image/video
  - Save API result in localStorage cache
  - Show load source and load time
*/

/* ---------- ELEMENTS ---------- */
const apodDateInput = byId("apodDateInput");
const apodLoadBtn = byId("apodLoadBtn");
const apodTodayBtn = byId("apodTodayBtn");
const apodRandomBtn = byId("apodRandomBtn");
const apodClearCacheBtn = byId("apodClearCacheBtn");

const apodStatus = byId("apodStatus");

const apodMedia = byId("apodMedia");
const apodDate = byId("apodDate");
const apodTitle = byId("apodTitle");
const apodExplanation = byId("apodExplanation");

const apodMediaType = byId("apodMediaType");
const apodCopyright = byId("apodCopyright");
const apodLoadSource = byId("apodLoadSource");
const apodLoadTime = byId("apodLoadTime");

const apodOriginalLink = byId("apodOriginalLink");

/* ---------- APOD UI STATES ---------- */
function showAPODLoading(message = "Connecting to NASA APOD API...") {
  if (apodStatus) {
    apodStatus.textContent = message;
    apodStatus.classList.remove("error-message");
  }

  if (apodMedia) {
    apodMedia.innerHTML = `<div class="skeleton-box"></div>`;
  }

  setText("apodDate", "Loading...");
  setText("apodTitle", "Fetching Astronomy Picture");
  setText("apodExplanation", "Please wait while the project connects to NASA APOD API.");

  setText("apodMediaType", "—");
  setText("apodCopyright", "—");
  setText("apodLoadSource", "—");
  setText("apodLoadTime", "—");
}

function showAPODError(message) {
  if (apodStatus) {
    apodStatus.textContent = message;
    apodStatus.classList.add("error-message");
  }

  if (apodMedia) {
    apodMedia.innerHTML = `
      <div class="status-message error-message">
        Could not load APOD media.
      </div>
    `;
  }

  setText("apodDate", "Connection Error");
  setText("apodTitle", "APOD Request Failed");
  setText(
    "apodExplanation",
    "The API request failed. Check your internet connection, API key, or selected date."
  );
}

/* ---------- RENDER APOD DATA ---------- */
function renderAPOD(data, meta = {}) {
  const loadSourceText = meta.fromCache ? "Cache" : "Live API";
  const loadTimeText = meta.loadTime ? `${meta.loadTime}ms` : "—";

  const mediaType = data.media_type || "unknown";
  const originalUrl = data.hdurl || data.url || "#";

  setText("apodDate", formatDate(data.date));
  setText("apodTitle", data.title || "Astronomy Picture of the Day");
  setText("apodExplanation", data.explanation || "No explanation available.");

  setText("apodMediaType", mediaType.toUpperCase());
  setText(
    "apodCopyright",
    data.copyright ? data.copyright.trim().replace("\n", " ") : "Public Domain"
  );
  setText("apodLoadSource", loadSourceText);
  setText("apodLoadTime", loadTimeText);

  if (apodOriginalLink) {
    apodOriginalLink.href = originalUrl;
  }

  if (!apodMedia) return;

  if (mediaType === "image") {
    apodMedia.innerHTML = `
      <img
        src="${data.url}"
        alt="${data.title || "NASA APOD Image"}"
        loading="lazy"
      />
    `;
  } else if (mediaType === "video") {
    apodMedia.innerHTML = `
      <iframe
        src="${data.url}"
        title="${data.title || "NASA APOD Video"}"
        loading="lazy"
        allowfullscreen>
      </iframe>
    `;
  } else {
    apodMedia.innerHTML = `
      <div class="status-message">
        Unsupported APOD media type.
      </div>
    `;
  }

  if (apodStatus) {
    apodStatus.textContent = meta.fromCache
      ? `Loaded from browser cache in ${loadTimeText}.`
      : `Loaded from NASA APOD API in ${loadTimeText}.`;

    apodStatus.classList.remove("error-message");
  }
}

/* ---------- LOAD APOD ---------- */
async function loadAPOD(date = "") {
  showAPODLoading("Checking browser cache...");

  const selectedDate = date || apodDateInput?.value || "";
  const cacheKey = `apod-${selectedDate || "today"}`;

  const url = buildNasaUrl(API_ENDPOINTS.apod, {
    date: selectedDate,
    thumbs: true
  });

  try {
    const result = await fetchData(url, cacheKey);

    renderAPOD(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("APOD Error:", error);
    showAPODError(`APOD request failed: ${error.message}`);
  }
}

/* ---------- LOAD TODAY ---------- */
function loadTodayAPOD() {
  if (apodDateInput) {
    apodDateInput.value = "";
  }

  loadAPOD("");
}

/* ---------- LOAD RANDOM ---------- */
function loadRandomAPOD() {
  const randomAPODDate = getRandomDate(APP_CONFIG.apodStartDate);

  if (apodDateInput) {
    apodDateInput.value = randomAPODDate;
  }

  loadAPOD(randomAPODDate);
}

/* ---------- CLEAR APOD CACHE ---------- */
function clearAPODCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}apod-`)) {
        localStorage.removeItem(key);
      }
    });

    if (apodStatus) {
      apodStatus.textContent = "APOD cache cleared successfully.";
      apodStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("Cache clear error:", error);

    if (apodStatus) {
      apodStatus.textContent = "Could not clear cache.";
      apodStatus.classList.add("error-message");
    }
  }
}

/* ---------- INIT APOD PAGE ---------- */
function initAPODPage() {
  if (!apodDateInput) return;

  apodDateInput.max = getTodayDate();

  if (apodLoadBtn) {
    apodLoadBtn.addEventListener("click", () => {
      loadAPOD();
    });
  }

  if (apodTodayBtn) {
    apodTodayBtn.addEventListener("click", loadTodayAPOD);
  }

  if (apodRandomBtn) {
    apodRandomBtn.addEventListener("click", loadRandomAPOD);
  }

  if (apodClearCacheBtn) {
    apodClearCacheBtn.addEventListener("click", clearAPODCache);
  }

  apodDateInput.addEventListener("change", () => {
    loadAPOD();
  });

  loadTodayAPOD();
}

document.addEventListener("DOMContentLoaded", initAPODPage);