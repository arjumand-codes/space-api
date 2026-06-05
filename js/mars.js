/* ================================
   NASA Space Explorer
   mars.js
   Author: Arjumand Ali
================================ */

const marsRoverSelect = byId("marsRoverSelect");
const marsCameraSelect = byId("marsCameraSelect");
const marsSolInput = byId("marsSolInput");

const marsLoadBtn = byId("marsLoadBtn");
const marsDefaultBtn = byId("marsDefaultBtn");
const marsClearCacheBtn = byId("marsClearCacheBtn");

const marsStatus = byId("marsStatus");
const marsResults = byId("marsResults");

const marsSelectedRover = byId("marsSelectedRover");
const marsSelectedCamera = byId("marsSelectedCamera");
const marsSelectedSol = byId("marsSelectedSol");
const marsPhotoCount = byId("marsPhotoCount");

function showMarsLoading(message = "Connecting to NASA Mars Rover API...") {
  if (marsStatus) {
    marsStatus.textContent = message;
    marsStatus.classList.remove("error-message");
  }

  if (marsResults) {
    marsResults.innerHTML = createSkeletonCards(6);
  }

  updateMarsStats({
    rover: marsRoverSelect?.value || "curiosity",
    camera: marsCameraSelect?.value || "All Cameras",
    sol: marsSolInput?.value || "1000",
    count: "Loading..."
  });
}

function showMarsError(message) {
  if (marsStatus) {
    marsStatus.textContent = message;
    marsStatus.classList.add("error-message");
  }

  if (marsResults) {
    marsResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load Mars rover photos. Use Curiosity + Sol 1000 + All Cameras.
      </div>
    `;
  }

  updateMarsStats({
    rover: marsRoverSelect?.value || "curiosity",
    camera: marsCameraSelect?.value || "All Cameras",
    sol: marsSolInput?.value || "1000",
    count: "0"
  });
}

function updateMarsStats({ rover, camera, sol, count }) {
  if (marsSelectedRover) {
    marsSelectedRover.textContent = rover || "—";
  }

  if (marsSelectedCamera) {
    marsSelectedCamera.textContent = camera || "All Cameras";
  }

  if (marsSelectedSol) {
    marsSelectedSol.textContent = sol || "—";
  }

  if (marsPhotoCount) {
    marsPhotoCount.textContent = count ?? "—";
  }
}

function createMarsPhotoCard(photo) {
  const cameraFullName =
    photo.camera?.full_name || MARS_CAMERAS[photo.camera?.name] || "Unknown Camera";

  const roverName = photo.rover?.name || "Unknown Rover";
  const roverStatus = photo.rover?.status || "Unknown";
  const earthDate = photo.earth_date || "Unknown Date";
  const sol = photo.sol || "—";

  return `
    <article class="result-card mars-photo-card">
      <img
        src="${photo.img_src}"
        alt="${roverName} Mars Rover Photo"
        loading="lazy"
      />

      <div class="result-card-body">
        <span class="badge badge-safe">${photo.camera?.name || "Camera"}</span>

        <h3>${roverName}</h3>

        <p>${cameraFullName}</p>

        <div class="mars-photo-meta">
          <span>
            Earth Date
            <b>${earthDate}</b>
          </span>

          <span>
            Martian Sol
            <b>${sol}</b>
          </span>

          <span>
            Rover Status
            <b>${capitalizeText(roverStatus)}</b>
          </span>
        </div>

        <a href="${photo.img_src}" target="_blank" class="card-link">
          Open Image
        </a>
      </div>
    </article>
  `;
}

function renderMarsPhotos(data, meta = {}) {
  const photos = data.photos || [];

  const rover = marsRoverSelect?.value || "curiosity";
  const camera = marsCameraSelect?.value || "";
  const sol = marsSolInput?.value || "1000";

  updateMarsStats({
    rover,
    camera: camera || "All Cameras",
    sol,
    count: photos.length
  });

  if (marsStatus) {
    marsStatus.textContent = meta.fromCache
      ? `Loaded ${photos.length} photos from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${photos.length} photos from NASA Mars Rover API in ${meta.loadTime}ms.`;

    marsStatus.classList.remove("error-message");
  }

  if (!marsResults) return;

  if (!photos.length) {
    marsResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No photos found. Try Curiosity, Sol 1000, and All Cameras.
      </div>
    `;
    return;
  }

  marsResults.innerHTML = photos
    .slice(0, 24)
    .map((photo) => createMarsPhotoCard(photo))
    .join("");
}

function getMarsApiUrl() {
  const rover = marsRoverSelect?.value || "curiosity";
  const camera = marsCameraSelect?.value || "";
  const sol = marsSolInput?.value || "1000";

  const baseUrl = `${API_ENDPOINTS.marsRovers}/${rover.toLowerCase()}/photos`;

  const params = {
    sol,
    api_key: NASA_API_KEY
  };

  if (camera) {
    params.camera = camera.toLowerCase();
  }

  return buildUrl(baseUrl, params);
}

async function loadMarsPhotos() {
  const rover = marsRoverSelect?.value || "curiosity";
  const camera = marsCameraSelect?.value || "";
  const sol = marsSolInput?.value || "1000";

  if (!sol) {
    showMarsError("Please enter a sol number first.");
    return;
  }

  const cacheKey = `mars-${rover}-${camera || "all"}-sol-${sol}`;
  const url = getMarsApiUrl();

  console.log("Mars API URL:", url);

  showMarsLoading("Checking Mars photo cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderMarsPhotos(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("Mars API Error:", error);
    showMarsError(`Mars request failed: ${error.message}`);
  }
}

function loadMarsDemoDate() {
  if (marsRoverSelect) {
    marsRoverSelect.value = "curiosity";
  }

  if (marsCameraSelect) {
    marsCameraSelect.value = "";
  }

  if (marsSolInput) {
    marsSolInput.value = "1000";
  }

  loadMarsPhotos();
}

function clearMarsCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}mars-`)) {
        localStorage.removeItem(key);
      }
    });

    if (marsStatus) {
      marsStatus.textContent = "Mars Rover cache cleared successfully.";
      marsStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("Mars cache clear error:", error);

    if (marsStatus) {
      marsStatus.textContent = "Could not clear Mars cache.";
      marsStatus.classList.add("error-message");
    }
  }
}

function updateMarsSelectionText() {
  updateMarsStats({
    rover: marsRoverSelect?.value || "curiosity",
    camera: marsCameraSelect?.value || "All Cameras",
    sol: marsSolInput?.value || "1000",
    count: marsPhotoCount?.textContent || "—"
  });
}

function initMarsPage() {
  if (!marsRoverSelect || !marsSolInput) return;

  marsRoverSelect.value = "curiosity";
  marsCameraSelect.value = "";
  marsSolInput.value = "1000";

  updateMarsSelectionText();

  if (marsLoadBtn) {
    marsLoadBtn.addEventListener("click", loadMarsPhotos);
  }

  if (marsDefaultBtn) {
    marsDefaultBtn.addEventListener("click", loadMarsDemoDate);
  }

  if (marsClearCacheBtn) {
    marsClearCacheBtn.addEventListener("click", clearMarsCache);
  }

  marsRoverSelect.addEventListener("change", updateMarsSelectionText);
  marsCameraSelect.addEventListener("change", updateMarsSelectionText);
  marsSolInput.addEventListener("input", updateMarsSelectionText);

  loadMarsPhotos();
}

document.addEventListener("DOMContentLoaded", initMarsPage);