# Jadwal Sholat Indonesia

Static GitHub Pages app for Indonesian prayer times with a live countdown to the nearest upcoming time.

## Features

- Defaults to Kab. Gresik, Jawa Timur.
- Search Indonesian cities/regencies from myQuran API.
- Shows Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, and Isya.
- Counts down to the nearest upcoming time.
- Falls back to tomorrow's Subuh when today's schedule has passed.
- Optional browser location button with OpenStreetMap reverse geocoding.

## API

- Prayer schedule: `https://api.myquran.com/v3`
- Reverse geocoding for browser location: `https://nominatim.openstreetmap.org`

## Local Preview

Open `index.html` directly, or run a small static server:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

Use GitHub Pages with source set to the `main` branch and `/ (root)`.
