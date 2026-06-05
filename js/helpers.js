/* ================================
   NASA Space Explorer
   helpers.js
   Author: Arjumand Ali
================================ */

/* ---------- SHORT SELECTORS ---------- */
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => document.querySelectorAll(selector);
const byId = (id) => document.getElementById(id);

/* ---------- DATE HELPERS ---------- */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

function getRandomDate(startDate = APP_CONFIG.apodStartDate) {
  const start = new Date(startDate).getTime();
  const end = new Date().getTime();
  const randomTime = start + Math.random() * (end - start);

  return new Date(randomTime).toISOString().split("T")[0];
}

function formatDate(dateString) {
  if (!dateString) return "Unknown Date";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/* ---------- TEXT HELPERS ---------- */
function limitText(text, limit = 140) {
  if (!text) return "No description available.";

  if (text.length <= limit) {
    return text;
  }

  return text.slice(0, limit).trim() + "...";
}

function capitalizeText(text) {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatNumber(number) {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  return Number(number).toLocaleString();
}

/* ---------- CACHE HELPERS ---------- */
function getCacheKey(key) {
  return `${APP_CONFIG.cachePrefix}${key}`;
}

function saveCache(key, data) {
  if (!APP_CONFIG.cacheEnabled) return;

  try {
    localStorage.setItem(getCacheKey(key), JSON.stringify(data));
  } catch (error) {
    console.warn("Cache save failed:", error);
  }
}

function getCache(key) {
  if (!APP_CONFIG.cacheEnabled) return null;

  try {
    const cachedData = localStorage.getItem(getCacheKey(key));

    if (!cachedData) {
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.warn("Cache read failed:", error);
    return null;
  }
}

function clearProjectCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(APP_CONFIG.cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Cache clear failed:", error);
  }
}

/* ---------- API FETCH HELPER ---------- */
async function fetchData(url, cacheKey = null) {
  const startTime = performance.now();

  if (cacheKey) {
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      return {
        data: cachedData,
        fromCache: true,
        loadTime: Math.round(performance.now() - startTime)
      };
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}`);
  }

  const data = await response.json();

  if (cacheKey) {
    saveCache(cacheKey, data);
  }

  return {
    data,
    fromCache: false,
    loadTime: Math.round(performance.now() - startTime)
  };
}

/* ---------- STATUS / UI HELPERS ---------- */
function setText(id, text) {
  const element = byId(id);

  if (element) {
    element.textContent = text;
  }
}

function setHTML(id, html) {
  const element = byId(id);

  if (element) {
    element.innerHTML = html;
  }
}

function showElement(id) {
  const element = byId(id);

  if (element) {
    element.style.display = "";
  }
}

function hideElement(id) {
  const element = byId(id);

  if (element) {
    element.style.display = "none";
  }
}

function showStatus(id, message, type = "normal") {
  const element = byId(id);

  if (!element) return;

  element.textContent = message;

  element.classList.remove("status-normal", "status-success", "status-error", "status-warning");
  element.classList.add(`status-${type}`);
}

function showLoading(containerId, message = "Loading data...") {
  const container = byId(containerId);

  if (!container) return;

  container.innerHTML = `
    <div class="status-message">
      ${message}
    </div>
  `;
}

function showError(containerId, message = "Something went wrong. Please try again.") {
  const container = byId(containerId);

  if (!container) return;

  container.innerHTML = `
    <div class="status-message error-message">
      ${message}
    </div>
  `;
}

/* ---------- SKELETON HELPERS ---------- */
function createSkeletonCards(count = 6) {
  let cards = "";

  for (let i = 0; i < count; i++) {
    cards += `
      <div class="result-card">
        <div class="skeleton-box" style="position:relative;height:230px;"></div>
        <div class="result-card-body">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `;
  }

  return cards;
}

/* ---------- CARD HELPERS ---------- */
function createImageCard({ image, title, description, link }) {
  return `
    <article class="result-card">
      <img src="${image}" alt="${title}" loading="lazy" />

      <div class="result-card-body">
        <h3>${title}</h3>
        <p>${limitText(description, 120)}</p>

        ${
          link
            ? `<a href="${link}" target="_blank" class="card-link">Open Source</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function createInfoCard({ title, description, badge, badgeClass = "badge-safe" }) {
  return `
    <article class="result-card">
      <div class="result-card-body">
        ${badge ? `<span class="badge ${badgeClass}">${badge}</span>` : ""}
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    </article>
  `;
}

/* ---------- URL BUILDERS ---------- */
function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);

  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
}

function buildNasaUrl(endpoint, params = {}) {
  return buildUrl(endpoint, {
    ...params,
    api_key: NASA_API_KEY
  });
}

/* ---------- MEDIA HELPERS ---------- */
function renderMedia(data, containerId) {
  const container = byId(containerId);

  if (!container) return;

  if (data.media_type === "image") {
    container.innerHTML = `
      <img src="${data.url}" alt="${data.title || "NASA Image"}" loading="lazy" />
    `;
    return;
  }

  if (data.media_type === "video") {
    container.innerHTML = `
      <iframe
        src="${data.url}"
        title="${data.title || "NASA Video"}"
        loading="lazy"
        allowfullscreen>
      </iframe>
    `;
    return;
  }

  container.innerHTML = `
    <div class="status-message">
      Unsupported media type.
    </div>
  `;
}

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
  const menuToggle = byId("menuToggle");
  const mobileMenu = byId("mobileMenu");

  if (!menuToggle || !mobileMenu) return;

  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("show");
    menuToggle.classList.toggle("active");
  });

  const mobileLinks = qsa(".mobile-link");

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("show");
      menuToggle.classList.remove("active");
    });
  });
}

/* ---------- ACTIVE NAV HELPER ---------- */
function setActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = qsa(".nav-link, .mobile-link");

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname;

    if (currentPath === linkPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/* ---------- SCROLL HEADER ---------- */
function initHeaderScroll() {
  const header = qs(".site-header");

  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

/* ---------- INIT COMMON HELPERS ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  setActiveNav();
  initHeaderScroll();
});