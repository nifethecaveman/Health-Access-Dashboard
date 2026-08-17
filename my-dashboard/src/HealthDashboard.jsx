import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './styles.css';

// Point this at your backend's URL (default: local FastAPI dev server)
const API_BASE_URL = 'http://localhost:8000';

const INDICATORS = [
  { key: 'immunization_rate', label: 'Immunization', good: 'high', desc: 'Children fully vaccinated (8 basic antigens)' },
  { key: 'stunting_rate', label: 'Stunting', good: 'low', desc: 'Children who are stunted (low height-for-age)' },
  { key: 'birth_facility_rate', label: 'Facility Delivery', good: 'high', desc: 'Births delivered at a health facility' },
  { key: 'education_rate', label: 'Education', good: 'high', desc: 'Women with secondary or higher education' },
];

const COLOR_RAMPS = {
  immunization_rate: ['#fef9ec', '#0f5c4f'],
  stunting_rate: ['#fef2ec', '#9a2b1f'],
  birth_facility_rate: ['#eef6fb', '#0c4a6e'],
  education_rate: ['#f6f0fb', '#4c2d7a'],
};

export default function HealthDashboard() {
  const [indicator, setIndicator] = useState('immunization_rate');
  const [selected, setSelected] = useState('Kano');
  const [hovered, setHovered] = useState(null);
  const [compareList, setCompareList] = useState(['Kano', 'Lagos', 'Rivers']);
  const [compareInput, setCompareInput] = useState('');
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ width: 640, height: 620 });

  // Data fetched from the backend, rather than embedded
  const [stateData, setStateData] = useState([]);
  const [nationalAvg, setNationalAvg] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statesRes, avgRes, geoRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/states`),
          fetch(`${API_BASE_URL}/api/national-average`),
          fetch(`${API_BASE_URL}/api/geojson`),
        ]);

        if (!statesRes.ok || !avgRes.ok || !geoRes.ok) {
          throw new Error('One or more API requests failed');
        }

        const [states, avg, geo] = await Promise.all([
          statesRes.json(),
          avgRes.json(),
          geoRes.json(),
        ]);

        setStateData(states);
        setNationalAvg(avg);
        setGeojson(geo);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    function handleResize() {
      const el = svgRef.current;
      if (el) {
        const w = el.parentElement.clientWidth;
        setDims({ width: w, height: Math.max(420, w * 0.95) });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dataByName = useMemo(() => {
    const m = {};
    stateData.forEach(d => { m[d.state_name] = d; });
    return m;
  }, [stateData]);

  const currentIndicator = INDICATORS.find(i => i.key === indicator);

  const colorScale = useMemo(() => {
    if (stateData.length === 0) return () => '#eee';
    const vals = stateData.map(d => d[indicator]);
    const [lo, hi] = COLOR_RAMPS[indicator];
    return d3.scaleLinear()
      .domain([Math.min(...vals), Math.max(...vals)])
      .range([lo, hi]);
  }, [indicator, stateData]);

  const projection = useMemo(() => {
    if (!geojson) return null;
    return d3.geoMercator().fitSize([dims.width, dims.height], geojson);
  }, [dims, geojson]);

  const pathGen = useMemo(() => projection ? d3.geoPath().projection(projection) : null, [projection]);

  const selectedData = dataByName[selected];
  const hoveredData = hovered ? dataByName[hovered] : null;

  function diffLabel(stateVal, avgVal, key) {
    const diff = stateVal - avgVal;
    const good = INDICATORS.find(i => i.key === key).good;
    const isBetter = good === 'high' ? diff > 0 : diff < 0;
    const arrow = diff === 0 ? '\u2192' : (diff > 0 ? '\u2191' : '\u2193');
    const label = isBetter ? 'Better than avg' : (diff === 0 ? 'At avg' : 'Worse than avg');
    return { text: `${arrow} ${Math.abs(diff).toFixed(1)} pts \u00b7 ${label}`, isBetter };
  }

  function addCompare(name) {
    if (!name || compareList.includes(name) || compareList.length >= 4) return;
    setCompareList([...compareList, name]);
    setCompareInput('');
  }

  function removeCompare(name) {
    setCompareList(compareList.filter(n => n !== name));
  }

  const allStateNames = stateData.map(d => d.state_name).sort();
  const suggestions = compareInput
    ? allStateNames.filter(n => n.toLowerCase().includes(compareInput.toLowerCase()) && !compareList.includes(n)).slice(0, 5)
    : [];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="status-message">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="status-message error">
          Couldn't load dashboard data: {error}
          <br />
          Make sure the backend server is running at {API_BASE_URL}.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-inner">

        <div className="header">
          <h1>Nigeria Health Indicators Explorer</h1>
          <p>Source: DHS Program, Nigeria Subnational Survey Data &middot; State-level indicators, all 36 states + FCT</p>
        </div>

        <div className="dashboard-grid">

          {/* LEFT COLUMN */}
          <div>
            <div className="card indicator-bar">
              <div className="indicator-buttons">
                {INDICATORS.map(ind => (
                  <button
                    key={ind.key}
                    onClick={() => setIndicator(ind.key)}
                    className={`indicator-btn ${indicator === ind.key ? 'active' : ''}`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
              {nationalAvg && (
                <div className="national-avg">
                  National average<br />
                  <span className="value">{nationalAvg[indicator].toFixed(1)}%</span>
                  <span className="label"> ({currentIndicator.label})</span>
                </div>
              )}
            </div>

            <div className="card map-card">
              <div className="map-desc">{currentIndicator.desc}</div>
              {geojson && pathGen && (
                <svg ref={svgRef} width="100%" height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`}>
                  {geojson.features.map((feature, i) => {
                    const name = feature.properties.adm1_name;
                    const d = dataByName[name];
                    const val = d ? d[indicator] : null;
                    const isSelected = name === selected;
                    const isHovered = name === hovered;
                    return (
                      <path
                        key={i}
                        d={pathGen(feature)}
                        fill={val != null ? colorScale(val) : '#eee'}
                        stroke={isSelected ? '#1c1917' : '#fff'}
                        strokeWidth={isSelected ? 2 : 0.75}
                        opacity={isHovered && !isSelected ? 0.85 : 1}
                        onClick={() => setSelected(name)}
                        onMouseEnter={() => setHovered(name)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })}
                </svg>
              )}

              {hoveredData && (
                <div className="map-tooltip">
                  <div className="tooltip-title">{hoveredData.state_name}</div>
                  <div>{currentIndicator.label}: {hoveredData[indicator].toFixed(1)}%</div>
                </div>
              )}

              <div className="legend">
                <span className="legend-label">Map Legend</span>
                <div
                  className="legend-bar"
                  style={{ background: `linear-gradient(to right, ${COLOR_RAMPS[indicator][0]}, ${COLOR_RAMPS[indicator][1]})` }}
                />
                <span className="legend-range">Low &rarr; High</span>
              </div>
            </div>

            <div className="footer-note">
              Source: DHS Program subnational survey data for Nigeria. Map boundaries: OCHA/geoBoundaries administrative level 1 (states). Figures are survey estimates and may not reflect real-time conditions.
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="panel-label">State Search &amp; Select</div>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="state-select"
              >
                {allStateNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {selectedData && nationalAvg && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="state-title">{selectedData.state_name} State Overview</div>
                <div className="stat-grid">
                  {INDICATORS.map(ind => {
                    const val = selectedData[ind.key];
                    const avg = nationalAvg[ind.key];
                    const d = diffLabel(val, avg, ind.key);
                    return (
                      <div key={ind.key} className="stat-card">
                        <div className="stat-label">{ind.label} Rate</div>
                        <div className="stat-value">{val.toFixed(1)}%</div>
                        <div className="stat-avg">Nat'l Avg {avg.toFixed(1)}%</div>
                        <div className={`stat-diff ${d.isBetter ? 'better' : 'worse'}`}>{d.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card">
              <div className="compare-title">Multi-State Comparison</div>
              <div className="compare-sub">Compare up to 4 states side by side</div>

              <div className="compare-tags">
                {compareList.map(name => (
                  <span key={name} className="compare-tag">
                    {name}
                    <span className="compare-tag-remove" onClick={() => removeCompare(name)}>&times;</span>
                  </span>
                ))}
              </div>

              {compareList.length < 4 && (
                <div className="compare-input-wrap">
                  <input
                    value={compareInput}
                    onChange={e => setCompareInput(e.target.value)}
                    placeholder="Add state to compare..."
                    className="compare-input"
                  />
                  {suggestions.length > 0 && (
                    <div className="compare-suggestions">
                      {suggestions.map(name => (
                        <div
                          key={name}
                          onClick={() => addCompare(name)}
                          onMouseDown={e => e.preventDefault()}
                          className="compare-suggestion-item"
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {compareList.length > 0 && (
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th></th>
                      {compareList.map(name => <th key={name}>{name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {INDICATORS.map(ind => (
                      <tr key={ind.key}>
                        <td>{ind.label}</td>
                        {compareList.map(name => (
                          <td key={name}>{dataByName[name][ind.key].toFixed(1)}%</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
