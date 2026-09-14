# CT Sparks ⚡

A mobile-first app for finding **registered E-1 (unlimited) electrical
contractors that operate a company in Connecticut** — built to help you
discover them on a map, track the ones you like, and manage which you've
applied to.

It's a **Progressive Web App (PWA)**: it runs in any phone browser, installs to
the home screen (no app store needed), works offline, and is structured so it
can also be wrapped as a native iOS/Android app with
[Capacitor](https://capacitorjs.com/) (see [Native packaging](#native-packaging)).

---

## What it does

Two pages, switchable from the bottom tab bar:

### 🗺️ Map — "Registered Locations"
A full-screen map with a pinpoint for each company at its registered business
address. Pins are **color-coded by your status**:

| Color | Meaning |
|-------|---------|
| 🔵 Blue | New — you haven't opened it yet |
| 🟡 Amber | Favorited (hearted) |
| 🟢 Green | You've applied |
| ⚪ Gray | Viewed |

Tap a pin for a quick card (name, license, town) with **Favorite** and
**Details** actions. A floating search box and status chips filter the pins.

### 📋 Companies
Box-styled cards, one per company, with the **name on the left** and status
**columns on the right** showing what you've done and when:

- **Viewed** — `New`, or how long ago you last opened it
- **Status** — your application stage (`Applied`, `In contact`, `Hired`, `Passed`)
- A **♥ heart** to favorite, and a colored dot summarizing status at a glance

Filter with the segmented control: **All / New / Favorites / Applied** (each
shows a live count), plus a search box and a town filter. A stat strip up top
summarizes Companies / New / Saved / Applied.

**Tap a card to expand it**, revealing:

- **Location** — company name + full registered address (with an "approx."
  flag when the point is derived from the town rather than an exact address)
- **License** — E-1 type, credential number, status, license holder, issue &
  expiration dates
- **About** — a brief description of the company
- **Contact** — phone, website, email (when available)
- **Find out more** — one-tap **Search the web**, **Open in Maps**, and
  **Verify license** (CT's official eLicense lookup) so you can dig up more on
  any company
- **Your application** — a tracker to set your stage and keep private notes

Everything you do (favorites, views, application stages, notes) is saved
**locally on your device**.

---

## Data

The app has two data sources, toggled with the **Live** switch in the header.

### Sample data (default)
Ships with 29 realistic **example** companies across Connecticut so every
feature works immediately and offline. These are **fictional demonstration
records** — the businesses are invented and their websites use the reserved
`.example` domain, which never resolves. They are clearly labeled as samples in
the UI.

### Live Connecticut data
Flip **Live** on to pull **real** E-1 electrical contractors from the State of
Connecticut's official open dataset:

> **State Licenses and Credentials** (`ngch-56tr`)
> https://data.ct.gov/Business/State-Licenses-and-Credentials/ngch-56tr

The app queries the dataset's Socrata JSON API, keeps only **E-1** credentials
that have a **business name** (i.e. operating a company) and an **active**
status, and places each on the map. Because the dataset stores addresses but
not coordinates, live records are geocoded to their **town center** (and flagged
as approximate). Use **Verify license** / **Open in Maps** on a card to confirm
exact details.

Notes:
- Live mode needs internet and works from a real device/browser. Some sandboxed
  or corporate networks block `data.ct.gov`; if the fetch fails, the app falls
  back to sample data and shows a notice.
- The dataset's exact column names can change over time. The live layer
  **auto-detects** the relevant fields, but if CT renames columns you can adjust
  the candidate lists in [`src/data/ctApi.ts`](src/data/ctApi.ts).
- Coverage of town coordinates lives in
  [`src/data/ctTowns.ts`](src/data/ctTowns.ts) — add towns there to improve
  live-pin placement.

---

## Getting started

Requires Node 18+.

```bash
npm install
npm run dev        # start the dev server (Vite) → http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript only
npm run gen-icons  # regenerate the PWA app icons (see scripts/gen-icons.mjs)
```

### Install it on your phone
1. Deploy the `dist/` folder (see below) or run `npm run dev -- --host` and open
   the LAN URL on your phone.
2. In the phone browser's menu choose **Add to Home Screen**. It launches
   full-screen like a native app and works offline.

---

## Deploying

It's a static site — host `dist/` anywhere (Netlify, Vercel, Cloudflare Pages,
GitHub Pages, S3, …).

- **Root domain** (Netlify/Vercel): no config needed.
- **Sub-path** (e.g. GitHub Pages at `/<repo>/`): build with the base set —
  ```bash
  VITE_BASE=/your-repo-name/ npm run build
  ```
  Routing uses `HashRouter`, so deep links work on any static host with no
  server rewrite rules.

Map tiles come from OpenStreetMap and are cached for offline use after first
view. For heavy production traffic, consider a commercial tile provider.

---

## Native packaging

The app was built PWA-first but structured to become a real iOS/Android app
without a rewrite, using Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "CT Sparks" com.example.ctsparks --web-dir=dist
npm run build
npx cap add ios        # and/or: npx cap add android
npx cap copy
npx cap open ios       # opens Xcode / Android Studio to build & run
```

`HashRouter`, local storage, and relative asset paths all work inside the native
web view as-is. (No native map SDK or API key is required — the map is
Leaflet + OpenStreetMap.)

---

## Tech stack

- **React 18 + TypeScript + Vite**
- **react-leaflet / Leaflet** with OpenStreetMap tiles (no API key)
- **react-router-dom** (HashRouter)
- **vite-plugin-pwa** (installable, offline, tile + data caching)
- Local persistence via `localStorage`; no backend required
- Zero runtime UI dependencies beyond the above (icons are inline SVG)

## Project structure

```
src/
  App.tsx                 # routes + shell
  main.tsx                # providers (data, user state, filters)
  index.css               # design system (mobile-first, dark theme)
  types.ts                # domain types
  data/
    sampleData.ts         # 29 example CT E-1 contractors
    ctTowns.ts            # CT town-center coordinates + geocoder
    ctApi.ts              # live CT open-data fetch + field detection
    dataSource.tsx        # sample/live mode provider
  store/userState.tsx     # favorites / viewed / applications (localStorage)
  state/filters.tsx       # search, segment, town, map focus
  lib/
    format.ts             # dates, relative time, links, descriptions
    useVisible.ts         # filtering + counts selector
  pages/
    CompaniesPage.tsx
    MapPage.tsx
  components/
    CompanyCard.tsx       # expandable, box-styled list item
    MapView.tsx           # Leaflet map + status-colored pins
    Filters.tsx  Header.tsx  BottomNav.tsx  DataSourceControl.tsx  Icons.tsx
```

## Disclaimer

Sample records are fictional and for demonstration only. Live records come from
the State of Connecticut's public dataset and are provided as-is; always verify
a contractor's current license and details on the official
[CT eLicense lookup](https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx)
before relying on them. This project is not affiliated with the State of
Connecticut.
