/* ================================
   NASA Space Explorer
   search.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the NASA Image Search page:
  - Search NASA Image and Video Library
  - Does not need NASA API key
  - Supports image/video filter
  - Shows responsive result cards
  - Uses localStorage cache
*/

/* ---------- ELEMENTS ---------- */
const nasaSearchInput = byId("nasaSearchInput");
const nasaMediaType = byId("nasaMediaType");

const nasaSearchBtn = byId("nasaSearchBtn");
const nasaDefaultBtn = byId("nasaDefaultBtn");
const nasaClearBtn = byId("nasaClearBtn");

const nasaSearchStatus = byId("nasaSearchStatus");
const nasaSearchResults = byId("nasaSearchResults");

const searchQueryText = byId("searchQueryText");
const searchMediaText = byId("searchMediaText");
const searchResultCount = byId("searchResultCount");

/* ---------- UI STATES ---------- */
function showSearchLoading(message = "Searching NASA Image Library...") {
  if (nasaSearchStatus) {
    nasaSearchStatus.textContent = message;
    nasaSearchStatus.classList.remove("error-message");
  }

  if (nasaSearchResults) {
    nasaSearchResults.innerHTML = createSkeletonCards(6);
  }

  updateSearchStats({
    query: nasaSearchInput?.value || APP_CONFIG.defaultSearchTerm,
    media: nasaMediaType?.value || "image",
    count: "Loading..."
  });
}

function showSearchError(message) {
  if (nasaSearchStatus) {
    nasaSearchStatus.textContent = message;
    nasaSearchStatus.classList.add("error-message");
  }

  if (nasaSearchResults) {
    nasaSearchResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load NASA search results. Try another keyword.
      </div>
    `;
  }

  updateSearchStats({
    query: nasaSearchInput?.value || "—",
    media: nasaMediaType?.value || "—",
    count: "0"
  });
}

/* ---------- STATS ---------- */
function updateSearchStats({ query, media, count }) {
  if (searchQueryText) {
    searchQueryText.textContent = query || "—";
  }

  if (searchMediaText) {
    searchMediaText.textContent = media ? media.toUpperCase() : "—";
  }

  if (searchResultCount) {
    searchResultCount.textContent = count ?? "—";
  }
}

/* ---------- DATA HELPERS ---------- */
function getSearchItems(data) {
  return data.collection?.items || [];
}

function getItemData(item) {
  return item.data?.[0] || {};
}

function getItemImage(item) {
  const links = item.links || [];
  const preview = links.find((link) => link.rel === "preview") || links[0];

  return preview?.href || "";
}

function getItemSourceLink(item) {
  const data = getItemData(item);

  if (data.nasa_id) {
    return `https://images.nasa.gov/details/${data.nasa_id}`;
  }

  return "https://images.nasa.gov/";
}

/* ---------- CARD ---------- */
function createSearchResultCard(item, mediaType) {
  const data = getItemData(item);

  const title = data.title || "NASA Media";
  const description = data.description || "No description available.";
  const dateCreated = data.date_created ? data.date_created.split("T")[0] : "—";
  const center = data.center || "NASA";
  const keywords = data.keywords?.slice(0, 3).join(", ") || "Space";
  const image = getItemImage(item);
  const sourceLink = getItemSourceLink(item);

  const mediaPreview =
    mediaType === "image" && image
      ? `<img src="${image}" alt="${title}" loading="lazy" />`
      : `<div class="video-placeholder">Video Result</div>`;

  return `
    <article class="result-card search-result-card">
      ${mediaPreview}

      <div class="result-card-body">
        <span class="badge badge-safe">${mediaType.toUpperCase()}</span>

        <h3>${title}</h3>

        <p>${limitText(description, 130)}</p>

        <div class="search-card-meta">
          <span>
            Date
            <b>${dateCreated}</b>
          </span>

          <span>
            Center
            <b>${center}</b>
          </span>

          <span>
            Tags
            <b>${limitText(keywords, 24)}</b>
          </span>
        </div>

        <a href="${sourceLink}" target="_blank" class="card-link">
          Open NASA Source
        </a>
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderSearchResults(data, meta = {}) {
  const items = getSearchItems(data);
  const query = nasaSearchInput?.value || APP_CONFIG.defaultSearchTerm;
  const media = nasaMediaType?.value || "image";

  updateSearchStats({
    query,
    media,
    count: items.length
  });

  if (nasaSearchStatus) {
    nasaSearchStatus.textContent = meta.fromCache
      ? `Loaded ${items.length} results from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${items.length} results from NASA Image Library in ${meta.loadTime}ms.`;

    nasaSearchStatus.classList.remove("error-message");
  }

  if (!nasaSearchResults) return;

  if (!items.length) {
    nasaSearchResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No results found. Try searching: moon, mars, galaxy, apollo, or astronaut.
      </div>
    `;
    return;
  }

  nasaSearchResults.innerHTML = items
    .slice(0, 24)
    .map((item) => createSearchResultCard(item, media))
    .join("");
}

/* ---------- API URL ---------- */
function getSearchApiUrl() {
  const query = nasaSearchInput?.value.trim() || APP_CONFIG.defaultSearchTerm;
  const media = nasaMediaType?.value || "image";

  return buildUrl(API_ENDPOINTS.nasaSearch, {
    q: query,
    media_type: media
  });
}

/* ---------- SEARCH ---------- */
async function loadNasaSearchResults() {
  const query = nasaSearchInput?.value.trim() || APP_CONFIG.defaultSearchTerm;
  const media = nasaMediaType?.value || "image";

  if (!query) {
    showSearchError("Please enter a search keyword.");
    return;
  }

  const cacheKey = `search-${media}-${query.toLowerCase().replace(/\s+/g, "-")}`;
  const url = getSearchApiUrl();

  console.log("NASA Search URL:", url);

  showSearchLoading("Checking NASA search cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderSearchResults(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("NASA Search Error:", error);
    showSearchError(`NASA search request failed: ${error.message}`);
  }
}

/* ---------- PRESET CHIPS ---------- */
function initSearchPresets() {
  const presetButtons = qsa(".preset-chip");

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const searchTerm = button.dataset.search;

      if (nasaSearchInput) {
        nasaSearchInput.value = searchTerm;
      }

      loadNasaSearchResults();
    });
  });
}

/* ---------- CLEAR ---------- */
function clearSearchPage() {
  if (nasaSearchInput) {
    nasaSearchInput.value = "";
  }

  if (nasaMediaType) {
    nasaMediaType.value = "image";
  }

  updateSearchStats({
    query: "—",
    media: "—",
    count: "—"
  });

  if (nasaSearchStatus) {
    nasaSearchStatus.textContent = "Search cleared. Enter a keyword or choose a preset.";
    nasaSearchStatus.classList.remove("error-message");
  }

  if (nasaSearchResults) {
    nasaSearchResults.innerHTML = `
      <div class="result-card">
        <div class="skeleton-box" style="position:relative;height:230px;"></div>
        <div class="result-card-body">
          <span class="badge badge-safe">Ready</span>
          <h3>NASA Search</h3>
          <p>
            Type a search term or click a preset chip to find NASA media.
          </p>
        </div>
      </div>

      <div class="result-card">
        <div class="skeleton-box" style="position:relative;height:230px;"></div>
        <div class="result-card-body">
          <span class="badge badge-safe">No Key</span>
          <h3>Public API</h3>
          <p>
            This search module does not require your NASA API key.
          </p>
        </div>
      </div>

      <div class="result-card">
        <div class="skeleton-box" style="position:relative;height:230px;"></div>
        <div class="result-card-body">
          <span class="badge badge-safe">Visual</span>
          <h3>Image Grid</h3>
          <p>
            Results will display in a clean responsive image card grid.
          </p>
        </div>
      </div>
    `;
  }
}

/* ---------- INIT ---------- */
function initSearchPage() {
  if (!nasaSearchInput || !nasaSearchBtn) return;

  nasaSearchInput.value = APP_CONFIG.defaultSearchTerm;
  nasaMediaType.value = "image";

  updateSearchStats({
    query: APP_CONFIG.defaultSearchTerm,
    media: "image",
    count: "—"
  });

  nasaSearchBtn.addEventListener("click", loadNasaSearchResults);

  if (nasaDefaultBtn) {
    nasaDefaultBtn.addEventListener("click", () => {
      nasaSearchInput.value = APP_CONFIG.defaultSearchTerm;
      nasaMediaType.value = "image";
      loadNasaSearchResults();
    });
  }

  if (nasaClearBtn) {
    nasaClearBtn.addEventListener("click", clearSearchPage);
  }

  nasaSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loadNasaSearchResults();
    }
  });

  nasaMediaType.addEventListener("change", () => {
    updateSearchStats({
      query: nasaSearchInput.value || "—",
      media: nasaMediaType.value,
      count: searchResultCount?.textContent || "—"
    });
  });

  initSearchPresets();

  loadNasaSearchResults();
}

document.addEventListener("DOMContentLoaded", initSearchPage);