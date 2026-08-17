# Nigeria Health Access Dashboard — Setup Guide

## What's in this package

```
backend/
  main.py                     - FastAPI server (serves data from the database)
  health_data.db               - SQLite database (37 states, 4 indicators)
  nga_states_simplified.json   - Nigeria state boundaries for the map

frontend/
  HealthDashboard.jsx          - React component (fetches from the backend)
  styles.css                   - All styling (plain CSS, no Tailwind)
```

## 1. Running the backend

You need Python 3.9+ installed.

```bash
cd backend
pip install fastapi uvicorn --break-system-packages
python3 -m uvicorn main:app --reload --port 8000
```

Leave this running. Check it worked by visiting:
`http://localhost:8000/api/states` — you should see JSON data for all 37 states.

**Available endpoints:**
- `GET /api/states` — all states, all indicators
- `GET /api/states/{state_name}` — one state (e.g. `/api/states/Lagos`)
- `GET /api/national-average` — national average for each indicator
- `GET /api/geojson` — Nigeria state boundaries for the map

## 2. Running the frontend

You need an existing React project (Vite is simplest). If you don't have one yet:

```bash
npm create vite@latest my-dashboard -- --template react
cd my-dashboard
npm install d3
```

Then:
1. Copy `HealthDashboard.jsx` and `styles.css` into `my-dashboard/src/`
2. In `src/App.jsx`, replace the contents with:

```jsx
import HealthDashboard from './HealthDashboard';

function App() {
  return <HealthDashboard />;
}

export default App;
```

3. Run the frontend:

```bash
npm run dev
```

Open the local URL it gives you (usually `http://localhost:5173`) — the dashboard should load, pulling live data from your backend at `http://localhost:8000`.

## Important: keep both servers running at once

The frontend fetches data from the backend on load — if the backend isn't running, you'll see a "Couldn't load dashboard data" message. Always start the backend first, then the frontend.

## Updating the data later

Since the data now lives in `health_data.db` instead of being embedded in the code, you can update it without touching any frontend code:

```bash
sqlite3 backend/health_data.db
UPDATE state_health_indicators SET stunting_rate = 45.2 WHERE state_name = 'Sokoto';
.quit
```

Refresh the frontend — the change appears automatically, since it's pulled live from the database on every page load.

## Before deploying publicly

- In `main.py`, change `allow_origins=["*"]` to your actual frontend's URL — this currently allows any website to call your API, which is fine for local development but not for a public launch.
- Host the backend somewhere (Render/Railway free tier works well) and update `API_BASE_URL` in `HealthDashboard.jsx` to point to that live URL instead of `localhost`.
