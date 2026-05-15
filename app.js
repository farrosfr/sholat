const API_BASE = "https://api.myquran.com/v3";
const DEFAULT_QUERY = "gresik";
const PRAYERS = [
  ["imsak", "Imsak"],
  ["subuh", "Subuh"],
  ["terbit", "Terbit"],
  ["dhuha", "Dhuha"],
  ["dzuhur", "Dzuhur"],
  ["ashar", "Ashar"],
  ["maghrib", "Maghrib"],
  ["isya", "Isya"],
];

const state = {
  location: null,
  todaySchedule: null,
  tomorrowSchedule: null,
  timer: null,
};

const els = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  locationButton: document.querySelector("#location-button"),
  status: document.querySelector("#status"),
  resultList: document.querySelector("#result-list"),
  locationLabel: document.querySelector("#location-label"),
  nextPrayer: document.querySelector("#next-prayer"),
  nextTime: document.querySelector("#next-time"),
  countdown: document.querySelector("#countdown"),
  countdownNote: document.querySelector("#countdown-note"),
  scheduleDate: document.querySelector("#schedule-date"),
  scheduleGrid: document.querySelector("#schedule-grid"),
};

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
}

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
  if (payload.status === false) {
    throw new Error(payload.message || "Data tidak ditemukan.");
  }
  return payload;
}

async function searchLocations(query) {
  const payload = await fetchJSON(`${API_BASE}/sholat/kabkota/cari/${encodeURIComponent(query)}`);
  return Array.isArray(payload.data) ? payload.data : [];
}

async function fetchSchedule(location, dateISO) {
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
  els.locationLabel.textContent = `${state.todaySchedule.locationName}, ${state.todaySchedule.province}`;
  els.scheduleDate.textContent = state.todaySchedule.times.tanggal || state.todaySchedule.dateISO;
  els.scheduleGrid.innerHTML = "";

  PRAYERS.forEach(([key, label]) => {
    const card = document.createElement("article");
    card.className = `time-card${key === activeKey ? " active" : ""}`;
    card.innerHTML = `<span>${label}</span><strong>${state.todaySchedule.times[key] || "--:--"}</strong>`;
    els.scheduleGrid.append(card);
  });
}

function nextPrayerCandidate() {
  const now = new Date();
  const todayItems = PRAYERS
    .filter(([key]) => state.todaySchedule?.times?.[key])
    .map(([key, label]) => ({
      key,
      label,
      time: state.todaySchedule.times[key],
      date: parseTime(state.todaySchedule.dateISO, state.todaySchedule.times[key]),
      dayLabel: "hari ini",
    }));

  const upcomingToday = todayItems.find((item) => item.date > now);
  if (upcomingToday) return upcomingToday;

  const tomorrowSubuh = state.tomorrowSchedule?.times?.subuh;
  if (tomorrowSubuh) {
    return {
      key: "subuh",
      label: "Subuh",
      time: tomorrowSubuh,
      date: parseTime(state.tomorrowSchedule.dateISO, tomorrowSubuh),
      dayLabel: "besok",
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
  els.countdownNote.textContent = `Menuju ${next.label.toLowerCase()} ${next.dayLabel}.`;
  renderSchedule(next.dayLabel === "hari ini" ? next.key : "");
}

async function loadLocation(location) {
  try {
    setStatus(`Memuat jadwal ${location.lokasi}...`);
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
    setStatus(`Jadwal aktif: ${today.locationName}, ${today.province}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function runSearch(query, autoloadFirst = false) {
  try {
    setStatus(`Mencari "${query}"...`);
    const locations = await searchLocations(query);
    renderResults(locations);
    if (!locations.length) {
      setStatus("Lokasi tidak ditemukan.", true);
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
    setStatus("Browser ini belum mendukung akses lokasi.", true);
    return;
  }

  setStatus("Meminta izin lokasi...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        setStatus("Mencocokkan koordinat ke kota/kabupaten...");
        const { latitude, longitude } = position.coords;
        const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        reverseUrl.search = new URLSearchParams({
          format: "jsonv2",
          lat: latitude,
          lon: longitude,
          zoom: "10",
          addressdetails: "1",
          "accept-language": "id",
        });
        const reverse = await fetchJSON(reverseUrl.toString());
        const candidates = locationKeywords(reverse.address || {});

        for (const candidate of candidates) {
          const locations = await searchLocations(candidate.replace(/^Kabupaten\s+/i, ""));
          if (locations.length) {
            renderResults(locations);
            await loadLocation(locations[0]);
            return;
          }
        }
        setStatus("Lokasi berhasil dibaca, tapi belum cocok dengan data myQuran. Coba cari manual.", true);
      } catch (error) {
        setStatus(`Lokasi gagal dipakai: ${error.message}`, true);
      }
    },
    () => setStatus("Izin lokasi ditolak atau tidak tersedia. Coba cari kota manual.", true),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = els.input.value.trim();
  if (query) runSearch(query, true);
});

els.locationButton.addEventListener("click", useBrowserLocation);

runSearch(DEFAULT_QUERY, true);
