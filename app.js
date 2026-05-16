const API_BASE = "https://api.myquran.com/v3";
const GLOBAL_API_BASE = "https://api.aladhan.com/v1";
const DEFAULT_QUERY = "gresik";

const translations = {
  id: {
    eyebrow: "Jadwal Sholat Indonesia",
    title: "Menuju Waktu Sholat",
    loading: "Memuat jadwal {loc}...",
    searching: "Mencari \"{query}\"...",
    next: "Berikutnya",
    today: "hari ini",
    tomorrow: "besok",
    towards: "Menuju",
    searchLabel: "Cari kota/kabupaten",
    searchPlaceholder: "Contoh: Gresik, Surabaya, Bandung",
    searchBtn: "Cari",
    locationBtn: "Gunakan lokasi saya",
    scheduleTitle: "Jadwal hari ini",
    locNotFound: "Lokasi tidak ditemukan.",
    locError: "Lokasi gagal dipakai: {msg}",
    locMatching: "Mencocokkan koordinat...",
    locPermission: "Meminta izin lokasi...",
    locNoSupport: "Browser ini belum mendukung akses lokasi.",
    locMatchError: "Lokasi berhasil dibaca, tapi belum cocok dengan data. Coba cari manual.",
    themeLabel: "Ganti tema",
    rotateLabel: "Putar layar",
    fullscreenEnter: "Tampilkan countdown layar penuh",
    fullscreenExit: "Keluar dari countdown layar penuh",
    fetchNote: "Mengambil jadwal terbaru.",
    imsak: "Imsak",
    subuh: "Subuh",
    terbit: "Terbit",
    dhuha: "Dhuha",
    dzuhur: "Dzuhur",
    ashar: "Ashar",
    maghrib: "Maghrib",
    isya: "Isya",
  },
  en: {
    eyebrow: "Prayer Times",
    title: "Time for Prayer",
    loading: "Loading schedule for {loc}...",
    searching: "Searching for \"{query}\"...",
    next: "Next",
    today: "today",
    tomorrow: "tomorrow",
    towards: "Towards",
    searchLabel: "Search city/region",
    searchPlaceholder: "Example: Tokyo, London, Jakarta",
    searchBtn: "Search",
    locationBtn: "Use my location",
    scheduleTitle: "Today's Schedule",
    locNotFound: "Location not found.",
    locError: "Location failed: {msg}",
    locMatching: "Matching coordinates...",
    locPermission: "Requesting location permission...",
    locNoSupport: "This browser does not support location access.",
    locMatchError: "Location found, but no matching data. Please search manually.",
    themeLabel: "Change theme",
    rotateLabel: "Rotate screen",
    fullscreenEnter: "Show fullscreen countdown",
    fullscreenExit: "Exit fullscreen countdown",
    fetchNote: "Fetching latest schedule.",
    imsak: "Imsak",
    subuh: "Fajr",
    terbit: "Sunrise",
    dhuha: "Dhuha",
    dzuhur: "Dhuhr",
    ashar: "Asr",
    maghrib: "Maghrib",
    isya: "Isha",
  }
};

const PRAYERS_KEYS = [
  ["imsak", "imsak"],
  ["subuh", "subuh"],
  ["terbit", "terbit"],
  ["dhuha", "dhuha"],
  ["dzuhur", "dzuhur"],
  ["ashar", "ashar"],
  ["maghrib", "maghrib"],
  ["isya", "isya"],
];

const state = {
  location: null,
  isInternational: false,
  todaySchedule: null,
  tomorrowSchedule: null,
  timer: null,
  fullscreen: false,
  theme: localStorage.getItem("theme") || "light",
  lang: "id", // Default to id, will be updated by location
};

const els = {
  appTitle: document.querySelector("#app-title"),
  eyebrow: document.querySelector(".eyebrow"),
  form: document.querySelector("#search-form"),
  formLabel: document.querySelector("#search-form label"),
  input: document.querySelector("#city-input"),
  searchBtn: document.querySelector("#search-form button"),
  locationButton: document.querySelector("#location-button"),
  status: document.querySelector("#status"),
  resultList: document.querySelector("#result-list"),
  locationLabel: document.querySelector("#location-label"),
  panelLabel: document.querySelector(".panel-label"),
  nextPrayer: document.querySelector("#next-prayer"),
  nextTime: document.querySelector("#next-time"),
  countdown: document.querySelector("#countdown"),
  countdownNote: document.querySelector("#countdown-note"),
  rotateToggle: document.querySelector("#rotate-toggle"),
  fullscreenToggle: document.querySelector("#fullscreen-toggle"),
  themeToggle: document.querySelector("#theme-toggle"),
  scheduleTitle: document.querySelector("#schedule-title"),
  scheduleDate: document.querySelector("#schedule-date"),
  scheduleGrid: document.querySelector("#schedule-grid"),
  currentTime: document.querySelector("#current-time-display"),
  currentDate: document.querySelector("#current-date-display"),
  hijriDate: document.querySelector("#hijri-date-display"),
};

function t(key, vars = {}) {
  let text = translations[state.lang][key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function updateStaticStrings() {
  els.eyebrow.textContent = t("eyebrow");
  els.appTitle.textContent = t("title");
  els.formLabel.textContent = t("searchLabel");
  els.input.placeholder = t("searchPlaceholder");
  els.searchBtn.textContent = t("searchBtn");
  els.locationBtn?.textContent ? els.locationBtn.textContent = t("locationBtn") : null;
  if (els.locationButton) els.locationButton.textContent = t("locationBtn");
  els.panelLabel.textContent = t("next");
  els.scheduleTitle.textContent = t("scheduleTitle");
  els.themeToggle.title = t("themeLabel");
  els.themeToggle.setAttribute("aria-label", t("themeLabel"));
  els.rotateToggle.title = t("rotateLabel");
  els.rotateToggle.setAttribute("aria-label", t("rotateLabel"));
  els.countdownNote.textContent = t("fetchNote");
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
}

function updateClock() {
  const now = new Date();
  const locale = state.lang === "id" ? "id-ID" : "en-US";
  
  els.currentTime.textContent = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  els.currentDate.textContent = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hijriFormatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  els.hijriDate.textContent = `${hijriFormatter.format(now)} H`;
}

setInterval(updateClock, 1000);
updateClock();

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  setTheme(state.theme === "light" ? "dark" : "light");
}

setTheme(state.theme);

function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTime(dateISO, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(`${dateISO}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getScheduleEntry(payload, dateISO) {
  if (state.isInternational) {
    const timings = payload.data.timings;
    return {
      imsak: timings.Imsak,
      subuh: timings.Fajr,
      terbit: timings.Sunrise,
      dhuha: timings.Dhuhr,
      dzuhur: timings.Dhuhr,
      ashar: timings.Asr,
      maghrib: timings.Maghrib,
      isya: timings.Isha,
      tanggal: payload.data.date.readable
    };
  }
  if (!payload?.data?.jadwal) {
    throw new Error("Format jadwal tidak dikenali.");
  }
  return payload.data.jadwal[dateISO] || Object.values(payload.data.jadwal)[0];
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request gagal (${response.status}).`);
  }
  const payload = await response.json();
  if (payload.status === false || (payload.status === "error" && payload.code !== 200)) {
    throw new Error(payload.message || "Data tidak ditemukan.");
  }
  return payload;
}

async function searchLocations(query) {
  if (state.isInternational) {
    return [{ id: query, lokasi: query, international: true }];
  }
  const payload = await fetchJSON(`${API_BASE}/sholat/kabkota/cari/${encodeURIComponent(query)}`);
  return Array.isArray(payload.data) ? payload.data : [];
}

async function fetchSchedule(location, dateISO) {
  if (location.international) {
    const [y, m, d] = dateISO.split("-");
    const aladhanDate = `${d}-${m}-${y}`;
    const payload = await fetchJSON(`${GLOBAL_API_BASE}/timingsByCity/${aladhanDate}?city=${encodeURIComponent(location.id)}&country=`);
    return {
      dateISO,
      locationName: payload.data.meta.timezone,
      province: location.lokasi,
      times: getScheduleEntry(payload, dateISO),
    };
  }
  const payload = await fetchJSON(`${API_BASE}/sholat/jadwal/${location.id}/${dateISO}`);
  return {
    dateISO,
    locationName: payload.data.kabko,
    province: payload.data.prov,
    times: getScheduleEntry(payload, dateISO),
  };
}

function renderResults(locations) {
  els.resultList.innerHTML = "";
  locations.slice(0, 8).forEach((location) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = location.lokasi;
    button.addEventListener("click", () => loadLocation(location));
    els.resultList.append(button);
  });
}

function renderSchedule(activeKey = "") {
  if (!state.todaySchedule) return;
  els.locationLabel.textContent = state.isInternational 
    ? state.todaySchedule.province 
    : `${state.todaySchedule.locationName}, ${state.todaySchedule.province}`;
  els.scheduleDate.textContent = state.todaySchedule.times.tanggal || state.todaySchedule.dateISO;
  els.scheduleGrid.innerHTML = "";

  PRAYERS_KEYS.forEach(([key, labelKey]) => {
    const card = document.createElement("article");
    card.className = `time-card${key === activeKey ? " active" : ""}`;
    card.innerHTML = `<span>${t(labelKey)}</span><strong>${state.todaySchedule.times[key] || "--:--"}</strong>`;
    els.scheduleGrid.append(card);
  });
}

function nextPrayerCandidate() {
  const now = new Date();
  const todayItems = PRAYERS_KEYS
    .filter(([key]) => state.todaySchedule?.times?.[key])
    .map(([key, labelKey]) => ({
      key,
      label: t(labelKey),
      time: state.todaySchedule.times[key],
      date: parseTime(state.todaySchedule.dateISO, state.todaySchedule.times[key]),
      dayLabel: t("today"),
    }));

  const upcomingToday = todayItems.find((item) => item.date > now);
  if (upcomingToday) return upcomingToday;

  const tomorrowSubuh = state.tomorrowSchedule?.times?.subuh;
  if (tomorrowSubuh) {
    return {
      key: "subuh",
      label: t("subuh"),
      time: tomorrowSubuh,
      date: parseTime(state.tomorrowSchedule.dateISO, tomorrowSubuh),
      dayLabel: t("tomorrow"),
    };
  }

  return null;
}

function updateCountdown() {
  const next = nextPrayerCandidate();
  if (!next) return;

  els.nextPrayer.textContent = next.label;
  els.nextTime.textContent = `${next.time} ${next.dayLabel}`;
  els.countdown.textContent = formatDuration(next.date - new Date());
  els.countdownNote.textContent = `${t("towards")} ${next.label.toLowerCase()} ${next.dayLabel}.`;
  renderSchedule(next.dayLabel === t("today") ? next.key : "");
}

function setFullscreenMode(enabled) {
  state.fullscreen = enabled;
  document.body.classList.toggle("countdown-fullscreen", enabled);
  els.fullscreenToggle.setAttribute("aria-pressed", String(enabled));
  els.fullscreenToggle.setAttribute(
    "aria-label",
    enabled ? t("fullscreenExit") : t("fullscreenEnter"),
  );
}

async function toggleFullscreen() {
  const shouldEnter = !state.fullscreen;
  setFullscreenMode(shouldEnter);

  try {
    if (shouldEnter && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else if (!shouldEnter && document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
      if (canLockOrientation) screen.orientation.unlock();
    }
  } catch {
    setFullscreenMode(shouldEnter);
  }
}

async function loadLocation(location) {
  try {
    state.isInternational = !!location.international;
    state.lang = state.isInternational ? "en" : "id";
    updateStaticStrings();
    
    setStatus(t("loading", { loc: location.lokasi }));
    state.location = location;
    const [today, tomorrow] = await Promise.all([
      fetchSchedule(location, todayISO()),
      fetchSchedule(location, todayISO(1)),
    ]);
    state.todaySchedule = today;
    state.tomorrowSchedule = tomorrow;
    clearInterval(state.timer);
    updateCountdown();
    state.timer = setInterval(updateCountdown, 1000);
    setStatus(`Jadwal aktif: ${location.lokasi}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function runSearch(query, autoloadFirst = false) {
  try {
    setStatus(t("searching", { query }));
    const locations = await searchLocations(query);
    renderResults(locations);
    if (!locations.length) {
      setStatus(t("locNotFound"), true);
      return;
    }
    setStatus(`${locations.length} lokasi ditemukan.`);
    if (autoloadFirst) {
      await loadLocation(locations[0]);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
}

function locationKeywords(address) {
  return [
    address.city,
    address.town,
    address.village,
    address.county,
    address.municipality,
    address.state_district,
    address.state,
  ].filter(Boolean);
}

async function useBrowserLocation() {
  if (!navigator.geolocation) {
    setStatus(t("locNoSupport"), true);
    return;
  }

  setStatus(t("locPermission"));
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        setStatus(t("locMatching"));
        const { latitude, longitude } = position.coords;
        const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        reverseUrl.search = new URLSearchParams({
          format: "jsonv2",
          lat: latitude,
          lon: longitude,
          zoom: "10",
          addressdetails: "1",
          "accept-language": state.lang,
        });
        const reverse = await fetchJSON(reverseUrl.toString());
        const isIndo = reverse.address?.country_code === "id";
        
        if (isIndo) {
          const candidates = locationKeywords(reverse.address || {});
          for (const candidate of candidates) {
            const locations = await searchLocations(candidate.replace(/^Kabupaten\s+/i, ""));
            if (locations.length) {
              renderResults(locations);
              await loadLocation(locations[0]);
              return;
            }
          }
        } else {
          const city = reverse.address.city || reverse.address.town || reverse.address.state;
          const country = reverse.address.country;
          const locName = `${city}, ${country}`;
          await loadLocation({ id: locName, lokasi: locName, international: true });
          return;
        }
        setStatus(t("locMatchError"), true);
      } catch (error) {
        setStatus(t("locError", { msg: error.message }), true);
      }
    },
    () => setStatus(t("locNoSupport"), true),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
}

const canLockOrientation = "orientation" in screen && "lock" in screen.orientation;
if (!canLockOrientation) {
  els.rotateToggle.style.display = "none";
}

async function toggleRotation() {
  if (!document.fullscreenElement) return;
  try {
    if (screen.orientation.type.startsWith("landscape")) {
      await screen.orientation.unlock();
    } else {
      await screen.orientation.lock("landscape");
    }
  } catch (e) {
    console.warn("Orientation lock failed:", e);
    setStatus(t("rotateLabel") + " error", true);
  }
}

els.rotateToggle.addEventListener("click", toggleRotation);

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = els.input.value.trim();
  if (query) {
    runSearch(query, true);
  }
});

els.locationButton.addEventListener("click", useBrowserLocation);
els.fullscreenToggle.addEventListener("click", toggleFullscreen);
els.themeToggle.addEventListener("click", toggleTheme);

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && state.fullscreen) {
    setFullscreenMode(false);
  }
});

async function init() {
  updateStaticStrings();
  runSearch(DEFAULT_QUERY, true);
}

init();
