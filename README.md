# Menuju Waktu Sholat (Prayer Times)

A modern, responsive, and internationalized prayer times web application built with Vanilla JS, CSS, and HTML.

## 🚀 Key Features

- **Hybrid API Intelligence**: Automatically switches between `myquran.com` (for high-accuracy Indonesian data) and `aladhan.com` (for global coverage).
- **Location-Based Localization**:
  - Automatically switches UI language (Indonesian/English) based on detected location.
  - Real-time Hijri date calculation.
  - Live clock with seconds precision.
- **Amoled Dark Mode**: High-contrast dark theme optimized for OLED screens, with persistence using `localStorage`.
- **Smart Search**:
  - Live autocomplete recommendations while typing.
  - Support for colloquial city aliases (e.g., "jogja" -> "Yogyakarta", "jkt" -> "Jakarta").
- **Fullscreen Mode**: Dedicated focus mode with rotation support for mobile devices.

## 🔄 Project Flow

1.  **Initialization**: On load, the app detects the user's preferred theme and default location (defaults to Gresik, ID).
2.  **Location Detection**:
    *   If the user searches or uses "Gunakan lokasi saya", the app performs a reverse-geocoding lookup.
    *   The app identifies if the coordinates/query are within Indonesia.
3.  **API Selection**:
    *   **In Indonesia**: Uses `api.myquran.com` for local city IDs and precise Ministry of Religious Affairs (KEMENAG) data. Language set to **Indonesian**.
    *   **International**: Uses `api.aladhan.com` for global timings based on city names. Language set to **English**.
4.  **Display**:
    *   Calculates the next prayer time and starts a real-time countdown.
    *   Updates the hero background with dynamic color gradients based on the active theme.

## 🔌 APIs Used

- **Indonesian Data**: [MyQuran API v3](https://api.myquran.com/)
- **Global Data**: [Aladhan Prayer Times API](https://aladhan.com/prayer-times-api)
- **Geocoding**: [Nominatim OpenStreetMap](https://nominatim.org/) (for reverse location matching)
- **Hijri Date**: Native `Intl.DateTimeFormat` with `islamic-umalqura` calendar.

## 🛠️ Built With

- **HTML5**: Semantic structure.
- **CSS3**: Custom variables, Grid layout, and smooth transitions.
- **Vanilla JavaScript**: Zero dependencies for maximum performance and speed.

---

Built with ❤️ for the global Muslim community.
