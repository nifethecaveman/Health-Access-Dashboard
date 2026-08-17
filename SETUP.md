# Frontend v2 — Multi-Page Setup Guide

This replaces the single-page dashboard with 4 separate pages: **Overview** (landing), **Map**, **State Search**, and **Compare States**, all sharing one navigation bar.

## 1. Install the router

In your `my-dashboard` folder:

```bash
cd my-dashboard
npm install react-router-dom
```

(You should already have `d3` installed from before — if not: `npm install d3`)

## 2. Copy these files into your project

Copy the whole `src/` structure from this package into `my-dashboard/src/`, **replacing** your existing `App.jsx` and `styles.css`, so you end up with:

```
my-dashboard/src/
  App.jsx                    (replaced)
  styles.css                 (replaced)
  context/
    DataContext.jsx           (new)
  components/
    NavBar.jsx                 (new)
  pages/
    Landing.jsx                 (new)
    MapPage.jsx                  (new)
    StatePage.jsx                 (new)
    ComparePage.jsx                (new)
```

You can now **delete** the old `HealthDashboard.jsx` from your `src/` folder — its logic has been split across `context/DataContext.jsx` and the four page files.

## 3. Run it

Same as before — keep the backend running in one terminal:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

And the frontend in another:

```bash
cd my-dashboard
npm run dev
```

## What changed

- **Routing:** Uses `HashRouter` (URLs look like `#/map`, `#/states`, `#/compare`) — this avoids needing any server configuration for page routes, which matters once you deploy this somewhere like Netlify/Vercel.
- **Shared data:** All pages pull from one `DataContext` that fetches from your backend once, so switching pages doesn't re-fetch data every time.
- **Map → State Search hand-off:** Clicking a state on the map page takes you to the State Search page with that state pre-selected.
- **New landing page:** Shows a national snapshot for all 4 indicators, plus two "priority" callouts (highest stunting, highest immunization) that link into the State Search page.

## Known limitation to flag

`API_BASE_URL` is still hardcoded to `http://localhost:8000` inside `context/DataContext.jsx` — same as before, update this one line when you deploy the backend somewhere real.
