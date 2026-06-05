/* ================================
   NASA Space Explorer
   eonet.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the EONET Natural Events page:
  - Load Earth natural events
  - Filter by category
  - Filter by status
  - Limit results
  - Show event cards
  - Cache results in localStorage
  - This API does not need a NASA API key
*/

/* ---------- ELEMENTS ---------- */
const eonetCategorySelect = byId("eonetCategorySelect");
const eonetStatusSelect = byId("eonetStatusSelect");
const eonetLimitInput = byId("eonetLimitInput");

const eonetLoadBtn = byId("eonetLoadBtn");
const eonetWildfireBtn = byId("eonetWildfireBtn");
const eonetClearCacheBtn = byId("eonetClearCacheBtn");

const eonetStatus = byId("eonetStatus");
const eonetResults = byId("eonetResults");

const eonetTotalCount = byId("eonetTotalCount");
const eonetSelectedCategory = byId("eonetSelectedCategory");
const eonetSelectedStatus = byId("eonetSelectedStatus");
const eonetSelectedLimit = byId("eonetSelectedLimit");

/* ---------- UI STATES ---------- */
function showEonetLoading(message = "Connecting to EONET API...") {
  if (eonetStatus) {
    eonetStatus.textContent = message;
    eonetStatus.classList.remove("error-message");
  }

  if (eonetResults) {
    eonetResults.innerHTML = createSkeletonCards(6);
  }

  updateEonetStats({
    total: "Loading...",
    category: getEonetCategoryLabel(),
    status: eonetStatusSelect?.value || "open",
    limit: eonetLimitInput?.value || "12"
  });
}

function showEonetError(message) {
  if (eonetStatus) {
    eonetStatus.textContent = message;
    eonetStatus.classList.add("error-message");
  }

  if (eonetResults) {
    eonetResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load EONET events. Try another category or status.
      </div>
    `;
  }

  updateEonetStats({
    total: "0",
    category: getEonetCategoryLabel(),
    status: eonetStatusSelect?.value || "open",
    limit: eonetLimitInput?.value || "12"
  });
}

/* ---------- STATS ---------- */
function updateEonetStats({ total, category, status, limit }) {
  if (eonetTotalCount) {
    eonetTotalCount.textContent = total ?? "—";
  }

  if (eonetSelectedCategory) {
    eonetSelectedCategory.textContent = category || "All Categories";
  }

  if (eonetSelectedStatus) {
    eonetSelectedStatus.textContent = status || "open";
  }

  if (eonetSelectedLimit) {
    eonetSelectedLimit.textContent = limit || "12";
  }
}

function getEonetCategoryLabel() {
  if (!eonetCategorySelect) return "All Categories";

  const selectedOption = eonetCategorySelect.options[eonetCategorySelect.selectedIndex];

  return selectedOption ? selectedOption.textContent : "All Categories";
}

/* ---------- DATA HELPERS ---------- */
function getEventCategory(eventItem) {
  return eventItem.categories?.[0]?.title || "Unknown";
}

function getEventGeometry(eventItem) {
  const geometry = eventItem.geometry?.[0];

  if (!geometry) {
    return {
      date: "—",
      type: "—",
      coordinates: "—"
    };
  }

  let coordinates = "—";

  if (Array.isArray(geometry.coordinates)) {
    if (typeof geometry.coordinates[0] === "number") {
      coordinates = geometry.coordinates
        .slice(0, 2)
        .map((value) => Number(value).toFixed(2))
        .join(", ");
    } else {
      coordinates = "Multiple points";
    }
  }

  return {
    date: geometry.date ? geometry.date.split("T")[0] : "—",
    type: geometry.type || "—",
    coordinates
  };
}

function getEventSources(eventItem) {
  return eventItem.sources || [];
}

/* ---------- CARD ---------- */
function createEonetEventCard(eventItem) {
  const title = eventItem.title || "Unknown Event";
  const category = getEventCategory(eventItem);
  const geometry = getEventGeometry(eventItem);
  const sources = getEventSources(eventItem);

  const sourceLinks = sources
    .slice(0, 2)
    .map((source) => {
      return `
        <a href="${source.url}" target="_blank" class="eonet-source-link">
          ${source.id || "Source"}
        </a>
      `;
    })
    .join("");

  return `
    <article class="result-card eonet-event-card">
      <div class="result-card-body">
        <span class="badge badge-safe">${category}</span>

        <h3>${title}</h3>

        <p>
          Earth natural event reported through NASA EONET data.
        </p>

        <div class="eonet-card-list">
          <span>
            Event Date
            <b>${geometry.date}</b>
          </span>

          <span>
            Geometry Type
            <b>${geometry.type}</b>
          </span>

          <span>
            Coordinates
            <b>${geometry.coordinates}</b>
          </span>

          <span>
            Sources
            <b>${sources.length}</b>
          </span>
        </div>

        <div class="eonet-source-list">
          ${
            sourceLinks ||
            `<a href="https://eonet.gsfc.nasa.gov/" target="_blank" class="eonet-source-link">EONET</a>`
          }
        </div>
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderEonetEvents(data, meta = {}) {
  const events = data.events || [];

  updateEonetStats({
    total: events.length,
    category: getEonetCategoryLabel(),
    status: eonetStatusSelect?.value || "open",
    limit: eonetLimitInput?.value || "12"
  });

  if (eonetStatus) {
    eonetStatus.textContent = meta.fromCache
      ? `Loaded ${events.length} events from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${events.length} events from EONET API in ${meta.loadTime}ms.`;

    eonetStatus.classList.remove("error-message");
  }

  if (!eonetResults) return;

  if (!events.length) {
    eonetResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No EONET events found for this selection. Try All Categories or Open Events.
      </div>
    `;
    return;
  }

  eonetResults.innerHTML = events
    .map((eventItem) => createEonetEventCard(eventItem))
    .join("");
}

/* ---------- API URL ---------- */
function getEonetApiUrl() {
  const category = eonetCategorySelect?.value || "";
  const status = eonetStatusSelect?.value || "open";
  const limit = eonetLimitInput?.value || "12";

  const params = {
    status,
    limit
  };

  if (category) {
    params.category = category;
  }

  return buildUrl(API_ENDPOINTS.eonet, params);
}

/* ---------- LOAD DATA ---------- */
async function loadEonetEvents() {
  const category = eonetCategorySelect?.value || "all";
  const status = eonetStatusSelect?.value || "open";
  const limit = eonetLimitInput?.value || "12";

  if (Number(limit) < 1 || Number(limit) > 50) {
    showEonetError("Limit must be between 1 and 50.");
    return;
  }

  const cacheKey = `eonet-${category}-${status}-${limit}`;
  const url = getEonetApiUrl();

  console.log("EONET API URL:", url);

  showEonetLoading("Checking EONET cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderEonetEvents(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("EONET API Error:", error);
    showEonetError(`EONET request failed: ${error.message}`);
  }
}

/* ---------- QUICK BUTTONS ---------- */
function loadWildfires() {
  if (eonetCategorySelect) {
    eonetCategorySelect.value = "wildfires";
  }

  if (eonetStatusSelect) {
    eonetStatusSelect.value = "open";
  }

  if (eonetLimitInput) {
    eonetLimitInput.value = "12";
  }

  loadEonetEvents();
}

/* ---------- CLEAR CACHE ---------- */
function clearEonetCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}eonet-`)) {
        localStorage.removeItem(key);
      }
    });

    if (eonetStatus) {
      eonetStatus.textContent = "EONET cache cleared successfully.";
      eonetStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("EONET cache clear error:", error);

    if (eonetStatus) {
      eonetStatus.textContent = "Could not clear EONET cache.";
      eonetStatus.classList.add("error-message");
    }
  }
}

/* ---------- INIT ---------- */
function initEonetPage() {
  if (!eonetCategorySelect || !eonetStatusSelect || !eonetLimitInput) return;

  eonetCategorySelect.value = "";
  eonetStatusSelect.value = "open";
  eonetLimitInput.value = "12";

  updateEonetStats({
    total: "—",
    category: getEonetCategoryLabel(),
    status: eonetStatusSelect.value,
    limit: eonetLimitInput.value
  });

  if (eonetLoadBtn) {
    eonetLoadBtn.addEventListener("click", loadEonetEvents);
  }

  if (eonetWildfireBtn) {
    eonetWildfireBtn.addEventListener("click", loadWildfires);
  }

  if (eonetClearCacheBtn) {
    eonetClearCacheBtn.addEventListener("click", clearEonetCache);
  }

  eonetCategorySelect.addEventListener("change", () => {
    updateEonetStats({
      total: eonetTotalCount?.textContent || "—",
      category: getEonetCategoryLabel(),
      status: eonetStatusSelect.value,
      limit: eonetLimitInput.value
    });
  });

  eonetStatusSelect.addEventListener("change", () => {
    updateEonetStats({
      total: eonetTotalCount?.textContent || "—",
      category: getEonetCategoryLabel(),
      status: eonetStatusSelect.value,
      limit: eonetLimitInput.value
    });
  });

  eonetLimitInput.addEventListener("input", () => {
    updateEonetStats({
      total: eonetTotalCount?.textContent || "—",
      category: getEonetCategoryLabel(),
      status: eonetStatusSelect.value,
      limit: eonetLimitInput.value
    });
  });

  loadEonetEvents();
}

document.addEventListener("DOMContentLoaded", initEonetPage);