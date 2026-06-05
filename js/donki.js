/* ================================
   NASA Space Explorer
   donki.js
   Author: Arjumand Ali
================================ */

/*
  This file controls the DONKI Notifications page:
  - Load NASA space weather notifications
  - Load specific event types like FLR, CME, GST, IPS
  - Filter by date range
  - Show result cards
  - Cache results in localStorage
*/

/* ---------- ELEMENTS ---------- */
const donkiTypeSelect = byId("donkiTypeSelect");
const donkiStartDate = byId("donkiStartDate");
const donkiEndDate = byId("donkiEndDate");

const donkiLoadBtn = byId("donkiLoadBtn");
const donkiRecentBtn = byId("donkiRecentBtn");
const donkiClearCacheBtn = byId("donkiClearCacheBtn");

const donkiStatus = byId("donkiStatus");
const donkiResults = byId("donkiResults");

const donkiTotalCount = byId("donkiTotalCount");
const donkiSelectedType = byId("donkiSelectedType");
const donkiDateRange = byId("donkiDateRange");
const donkiLoadSource = byId("donkiLoadSource");

/* ---------- UI STATES ---------- */
function showDonkiLoading(message = "Connecting to NASA DONKI API...") {
  if (donkiStatus) {
    donkiStatus.textContent = message;
    donkiStatus.classList.remove("error-message");
  }

  if (donkiResults) {
    donkiResults.innerHTML = createSkeletonCards(6);
  }

  updateDonkiStats({
    total: "Loading...",
    type: getDonkiTypeLabel(),
    range: getDonkiDateRangeText(),
    source: "—"
  });
}

function showDonkiError(message) {
  if (donkiStatus) {
    donkiStatus.textContent = message;
    donkiStatus.classList.add("error-message");
  }

  if (donkiResults) {
    donkiResults.innerHTML = `
      <div class="status-message error-message" style="grid-column:1/-1;">
        Could not load DONKI data. Try Recent, Notifications, or a smaller date range.
      </div>
    `;
  }

  updateDonkiStats({
    total: "0",
    type: getDonkiTypeLabel(),
    range: getDonkiDateRangeText(),
    source: "Error"
  });
}

/* ---------- HELPERS ---------- */
function getDonkiTypeLabel() {
  if (!donkiTypeSelect) return "Notifications";

  const selectedOption = donkiTypeSelect.options[donkiTypeSelect.selectedIndex];

  return selectedOption ? selectedOption.textContent : "Notifications";
}

function getDonkiDateRangeText() {
  const start = donkiStartDate?.value || "—";
  const end = donkiEndDate?.value || "—";

  if (start === end) {
    return start;
  }

  return `${start} → ${end}`;
}

function updateDonkiStats({ total, type, range, source }) {
  if (donkiTotalCount) {
    donkiTotalCount.textContent = total ?? "—";
  }

  if (donkiSelectedType) {
    donkiSelectedType.textContent = type || "Notifications";
  }

  if (donkiDateRange) {
    donkiDateRange.textContent = range || "—";
  }

  if (donkiLoadSource) {
    donkiLoadSource.textContent = source || "—";
  }
}

function setRecentDonkiDates() {
  const end = getTodayDate();
  const start = getDateDaysAgo(30);

  if (donkiStartDate) {
    donkiStartDate.value = start;
  }

  if (donkiEndDate) {
    donkiEndDate.value = end;
  }
}

/*
  DONKI can return a lot of data.
  Keep date range controlled so your frontend stays fast.
*/
function validateDonkiDates() {
  const start = donkiStartDate?.value;
  const end = donkiEndDate?.value;

  if (!start || !end) {
    showDonkiError("Please select both start date and end date.");
    return false;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (endDate < startDate) {
    showDonkiError("End date cannot be before start date.");
    return false;
  }

  const diffMs = endDate - startDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > 60) {
    showDonkiError("Please select a maximum date range of 60 days.");
    return false;
  }

  return true;
}

function getDonkiMainDate(item) {
  return (
    item.messageIssueTime ||
    item.flrBeginTime ||
    item.startTime ||
    item.eventTime ||
    item.activityID ||
    item.cmeAnalyses?.[0]?.time21_5 ||
    "—"
  );
}

function getDonkiTitle(item, type) {
  if (type === "notifications") {
    return item.messageType || item.messageID || "DONKI Notification";
  }

  if (item.flrID) return item.flrID;
  if (item.activityID) return item.activityID;
  if (item.gstID) return item.gstID;
  if (item.sepID) return item.sepID;
  if (item.ipsID) return item.ipsID;
  if (item.mpcID) return item.mpcID;
  if (item.rbeID) return item.rbeID;
  if (item.hssID) return item.hssID;

  return `${type} Event`;
}

function getDonkiDescription(item, type) {
  if (type === "notifications") {
    return item.messageBody || item.messageType || "NASA DONKI notification.";
  }

  if (item.note) {
    return item.note;
  }

  if (item.instruments?.length) {
    return `Detected by ${item.instruments.length} instrument record(s).`;
  }

  if (item.link) {
    return "Space weather event with NASA DONKI source link.";
  }

  return "NASA DONKI space weather event data.";
}

function getDonkiSourceLink(item) {
  return item.link || "https://kauai.ccmc.gsfc.nasa.gov/DONKI/";
}

/* ---------- CARD ---------- */
function createDonkiCard(item, type) {
  const title = getDonkiTitle(item, type);
  const date = getDonkiMainDate(item);
  const description = getDonkiDescription(item, type);
  const sourceLink = getDonkiSourceLink(item);

  const displayDate = typeof date === "string" && date.includes("T")
    ? date.split("T")[0]
    : String(date).slice(0, 20);

  const badgeText = type === "notifications" ? "Notice" : type;

  return `
    <article class="result-card donki-card">
      <div class="result-card-body">
        <span class="badge badge-safe">${badgeText}</span>

        <h3>${limitText(title, 42)}</h3>

        <p>${limitText(description, 180)}</p>

        <div class="donki-data-list">
          <span>
            Event Type
            <b>${badgeText}</b>
          </span>

          <span>
            Date
            <b>${displayDate || "—"}</b>
          </span>

          <span>
            Source
            <b>DONKI</b>
          </span>
        </div>

        <div class="donki-message">
          ${limitText(description, 260)}
        </div>

        <a href="${sourceLink}" target="_blank" class="card-link">
          Open Source
        </a>
      </div>
    </article>
  `;
}

/* ---------- RENDER ---------- */
function renderDonkiData(data, meta = {}) {
  const items = Array.isArray(data) ? data : [];
  const type = donkiTypeSelect?.value || "notifications";

  updateDonkiStats({
    total: items.length,
    type: getDonkiTypeLabel(),
    range: getDonkiDateRangeText(),
    source: meta.fromCache ? "Cache" : "Live API"
  });

  if (donkiStatus) {
    donkiStatus.textContent = meta.fromCache
      ? `Loaded ${items.length} DONKI result(s) from browser cache in ${meta.loadTime}ms.`
      : `Loaded ${items.length} DONKI result(s) from NASA DONKI API in ${meta.loadTime}ms.`;

    donkiStatus.classList.remove("error-message");
  }

  if (!donkiResults) return;

  if (!items.length) {
    donkiResults.innerHTML = `
      <div class="status-message" style="grid-column:1/-1;">
        No DONKI results found for this selection. Try Recent or a different event type.
      </div>
    `;
    return;
  }

  donkiResults.innerHTML = items
    .slice(0, 30)
    .map((item) => createDonkiCard(item, type))
    .join("");
}

/* ---------- API URL ---------- */
function getDonkiApiUrl() {
  const type = donkiTypeSelect?.value || "notifications";
  const startDate = donkiStartDate?.value || getDateDaysAgo(30);
  const endDate = donkiEndDate?.value || getTodayDate();

  let endpoint = "";

  if (type === "notifications") {
    endpoint = `${API_ENDPOINTS.donki}/notifications`;

    return buildNasaUrl(endpoint, {
      startDate,
      endDate,
      type: "all"
    });
  }

  endpoint = `${API_ENDPOINTS.donki}/${type}`;

  return buildNasaUrl(endpoint, {
    startDate,
    endDate
  });
}

/* ---------- LOAD DATA ---------- */
async function loadDonkiData() {
  if (!validateDonkiDates()) return;

  const type = donkiTypeSelect?.value || "notifications";
  const startDate = donkiStartDate?.value || getDateDaysAgo(30);
  const endDate = donkiEndDate?.value || getTodayDate();

  const cacheKey = `donki-${type}-${startDate}-${endDate}`;
  const url = getDonkiApiUrl();

  console.log("DONKI API URL:", url);

  showDonkiLoading("Checking DONKI cache...");

  try {
    const result = await fetchData(url, cacheKey);

    renderDonkiData(result.data, {
      fromCache: result.fromCache,
      loadTime: result.loadTime
    });
  } catch (error) {
    console.error("DONKI API Error:", error);
    showDonkiError(`DONKI request failed: ${error.message}`);
  }
}

/* ---------- QUICK RECENT ---------- */
function loadRecentDonkiData() {
  if (donkiTypeSelect) {
    donkiTypeSelect.value = "notifications";
  }

  setRecentDonkiDates();
  loadDonkiData();
}

/* ---------- CLEAR CACHE ---------- */
function clearDonkiCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${APP_CONFIG.cachePrefix}donki-`)) {
        localStorage.removeItem(key);
      }
    });

    if (donkiStatus) {
      donkiStatus.textContent = "DONKI cache cleared successfully.";
      donkiStatus.classList.remove("error-message");
    }
  } catch (error) {
    console.error("DONKI cache clear error:", error);

    if (donkiStatus) {
      donkiStatus.textContent = "Could not clear DONKI cache.";
      donkiStatus.classList.add("error-message");
    }
  }
}

/* ---------- UPDATE STATS ON CHANGE ---------- */
function updateDonkiSelectionStats() {
  updateDonkiStats({
    total: donkiTotalCount?.textContent || "—",
    type: getDonkiTypeLabel(),
    range: getDonkiDateRangeText(),
    source: donkiLoadSource?.textContent || "—"
  });
}

/* ---------- INIT ---------- */
function initDonkiPage() {
  if (!donkiTypeSelect || !donkiStartDate || !donkiEndDate) return;

  const today = getTodayDate();

  donkiStartDate.max = today;
  donkiEndDate.max = today;

  donkiTypeSelect.value = "notifications";
  setRecentDonkiDates();

  updateDonkiStats({
    total: "—",
    type: getDonkiTypeLabel(),
    range: getDonkiDateRangeText(),
    source: "—"
  });

  if (donkiLoadBtn) {
    donkiLoadBtn.addEventListener("click", loadDonkiData);
  }

  if (donkiRecentBtn) {
    donkiRecentBtn.addEventListener("click", loadRecentDonkiData);
  }

  if (donkiClearCacheBtn) {
    donkiClearCacheBtn.addEventListener("click", clearDonkiCache);
  }

  donkiTypeSelect.addEventListener("change", updateDonkiSelectionStats);
  donkiStartDate.addEventListener("change", updateDonkiSelectionStats);
  donkiEndDate.addEventListener("change", updateDonkiSelectionStats);

  loadDonkiData();
}

document.addEventListener("DOMContentLoaded", initDonkiPage);