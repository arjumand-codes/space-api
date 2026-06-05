/* ================================
   NASA Space Explorer
   main.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the homepage only:
  - Mobile menu already handled in helpers.js
  - Loads small APOD preview on homepage
  - Adds smooth UI interactions
  - Keeps homepage fast and clean
*/

/* ---------- HOMEPAGE APOD PREVIEW ---------- */
async function loadHomeAPODPreview() {
  const previewMedia = byId("homePreviewMedia");
  const previewDate = byId("homePreviewDate");
  const previewTitle = byId("homePreviewTitle");
  const previewText = byId("homePreviewText");

  if (!previewMedia || !previewDate || !previewTitle || !previewText) return;

  const cacheKey = "home-apod-preview";

  try {
    previewDate.textContent = "Connecting...";
    previewTitle.textContent = "Fetching today’s space picture";
    previewText.textContent = "Please wait while the project connects to the API.";

    const url = buildNasaUrl(API_ENDPOINTS.apod, {
      thumbs: true
    });

    const result = await fetchData(url, cacheKey);
    const data = result.data;

    previewDate.textContent = `${formatDate(data.date)} ${
      result.fromCache ? "· Cached" : "· Live"
    }`;

    previewTitle.textContent = data.title || "Astronomy Picture of the Day";
    previewText.textContent = limitText(data.explanation, 230);

    if (data.media_type === "image") {
      previewMedia.innerHTML = `
        <img
          src="${data.url}"
          alt="${data.title || "Astronomy Picture of the Day"}"
          loading="lazy"
        />
      `;
    } else if (data.media_type === "video") {
      previewMedia.innerHTML = `
        <iframe
          src="${data.url}"
          title="${data.title || "NASA APOD Video"}"
          loading="lazy"
          allowfullscreen>
        </iframe>
      `;
    } else {
      previewMedia.innerHTML = `
        <div class="status-message">
          Unsupported media type.
        </div>
      `;
    }
  } catch (error) {
    console.error("Homepage APOD preview failed:", error);

    previewDate.textContent = "Connection Error";
    previewTitle.textContent = "Could not load space picture";
    previewText.textContent =
      "The API request failed. Check your internet connection or API key.";

    previewMedia.innerHTML = `
      <div class="status-message error-message">
        API preview failed. Try again later.
      </div>
    `;
  }
}

/* ---------- API CARD HOVER EFFECT ---------- */
function initApiCardEffects() {
  const cards = qsa(".api-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `translateY(-7px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------- SIMPLE SCROLL REVEAL ---------- */
function initScrollReveal() {
  const revealItems = qsa(
    ".api-card, .feature-item, .timeline-item, .preview-card, .cta-box"
  );

  if (!revealItems.length) return;

  revealItems.forEach((item) => {
    item.classList.add("reveal-item");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  revealItems.forEach((item) => {
    observer.observe(item);
  });
}

/* ---------- HERO META COUNTER ANIMATION ---------- */
function initHeroCounters() {
  const counters = qsa(".meta-item strong");

  if (!counters.length) return;

  const animateCounter = (element) => {
    const originalText = element.textContent.trim();

    if (!originalText.includes("+") && !originalText.includes("%")) return;

    const number = parseInt(originalText.replace(/\D/g, ""), 10);

    if (isNaN(number)) return;

    let current = 0;
    const duration = 900;
    const startTime = performance.now();

    function updateCounter(time) {
      const progress = Math.min((time - startTime) / duration, 1);
      current = Math.floor(progress * number);

      if (originalText.includes("+")) {
        element.textContent = `${current}+`;
      } else if (originalText.includes("%")) {
        element.textContent = `${current}%`;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = originalText;
      }
    }

    requestAnimationFrame(updateCounter);
  };

  const heroMeta = qs(".hero-meta");

  if (!heroMeta) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach(animateCounter);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.5
    }
  );

  observer.observe(heroMeta);
}

/* ---------- SMOOTH ANCHOR FIX ---------- */
function initSmoothAnchors() {
  const links = qsa('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = qs(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

/* ---------- HOMEPAGE INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadHomeAPODPreview();
  initApiCardEffects();
  initScrollReveal();
  initHeroCounters();
  initSmoothAnchors();
});