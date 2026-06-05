/* ================================
   NASA Space Explorer
   config.js
   Author: Arjumand Ali
================================ */

/*
  Your NASA API key.
  This key works for many NASA APIs:
  - APOD
  - Mars Rover Photos
  - Asteroids NeoWs
  - EPIC
  - DONKI
*/

const NASA_API_KEY = "OUIftf2ueONK1uhYEyLItDSZuMdpgayMbQqLcYai";

/*
  Main API endpoints.
  We keep all URLs in one place so the project stays clean.
*/

const API_ENDPOINTS = {
  apod: "https://api.nasa.gov/planetary/apod",

  marsRovers: "https://api.nasa.gov/mars-photos/api/v1/rovers",

  asteroids: "https://api.nasa.gov/neo/rest/v1/feed",

  epic: "https://api.nasa.gov/EPIC/api/natural",

  donki: "https://api.nasa.gov/DONKI",

  /*
    NASA Image and Video Library does not need an API key.
  */
  nasaSearch: "https://images-api.nasa.gov/search",

  eonet: "https://eonet.gsfc.nasa.gov/api/v3/events"
};

/*
  Project settings.
*/

const APP_CONFIG = {
  appName: "NASA Space Explorer",
  author: "Arjumand Ali",
  currentYear: "2026",

  defaultSearchTerm: "galaxy",

  defaultMarsRover: "curiosity",
  defaultMarsCamera: "NAVCAM",
  defaultMarsDate: "2020-06-03",

  apodStartDate: "1995-06-16",

  cachePrefix: "nasa-space-explorer-",
  cacheEnabled: true
};

/*
  Mars rover camera options.
*/

const MARS_CAMERAS = {
  FHAZ: "Front Hazard Avoidance Camera",
  RHAZ: "Rear Hazard Avoidance Camera",
  MAST: "Mast Camera",
  CHEMCAM: "Chemistry and Camera Complex",
  MAHLI: "Mars Hand Lens Imager",
  MARDI: "Mars Descent Imager",
  NAVCAM: "Navigation Camera",
  PANCAM: "Panoramic Camera",
  MINITES: "Miniature Thermal Emission Spectrometer"
};

/*
  Rover list.
*/

const MARS_ROVERS = [
  "curiosity",
  "opportunity",
  "spirit",
  "perseverance"
];

/*
  Useful preset search terms for NASA Image Search page.
*/

const SEARCH_PRESETS = [
  "moon",
  "mars",
  "earth",
  "galaxy",
  "black hole",
  "nebula",
  "apollo",
  "astronaut",
  "jupiter",
  "saturn"
];

/*
  DONKI space weather event types.
*/

const DONKI_EVENT_TYPES = {
  flr: "FLR",
  cme: "CME",
  gst: "GST",
  ips: "IPS",
  sep: "SEP",
  mpc: "MPC",
  rbe: "RBE",
  hss: "HSS",
  notifications: "notifications"
};