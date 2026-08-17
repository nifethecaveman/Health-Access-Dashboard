import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI(title="Nigeria Health Access Dashboard API")

# Allow the React frontend (running on a different port during development) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend URL before deploying publicly
    allow_methods=["GET"],
    allow_headers=["*"],
)

DB_PATH = "health_data.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/api/states")
def get_all_states():
    """Return health indicators for all states."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM state_health_indicators ORDER BY state_name").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/states/{state_name}")
def get_state(state_name: str):
    """Return health indicators for a single state."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM state_health_indicators WHERE state_name = ?", (state_name,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail=f"State '{state_name}' not found")
    return dict(row)


@app.get("/api/national-average")
def get_national_average():
    """Return the national average for each indicator, computed directly from the database."""
    conn = get_connection()
    row = conn.execute(
        """
        SELECT
            AVG(stunting_rate) AS stunting_rate,
            AVG(immunization_rate) AS immunization_rate,
            AVG(birth_facility_rate) AS birth_facility_rate,
            AVG(education_rate) AS education_rate
        FROM state_health_indicators
        """
    ).fetchone()
    conn.close()
    return dict(row)


@app.get("/api/geojson")
def get_geojson():
    """Serve the Nigeria state boundaries file for the map."""
    return FileResponse("nga_states_simplified.json", media_type="application/json")


@app.get("/")
def root():
    return {"message": "Nigeria Health Access Dashboard API. See /api/states, /api/national-average, /api/geojson"}
