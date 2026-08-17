import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, INDICATORS, COLOR_RAMPS } from '../context/DataContext';
import staticPaths from '../context/staticStatePaths.json';

export default function MapPage() {
  const { stateData, dataByName, loading, error } = useData();
  const [indicator, setIndicator] = useState('immunization_rate');
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const currentIndicator = INDICATORS.find(i => i.key === indicator);

  const colorScale = useMemo(() => {
    if (stateData.length === 0) return () => '#eee';
    const vals = stateData.map(d => d[indicator]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const [loColor, hiColor] = COLOR_RAMPS[indicator];

    // Simple manual linear interpolation between two hex colors — no external scale library needed
    function hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const [r1, g1, b1] = hexToRgb(loColor);
    const [r2, g2, b2] = hexToRgb(hiColor);

    return (val) => {
      const t = max === min ? 0 : (val - min) / (max - min);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r},${g},${b})`;
    };
  }, [indicator, stateData]);

  const hoveredData = hovered ? dataByName[hovered] : null;

  if (loading) return <div className="status-message">Loading map data...</div>;
  if (error) return <div className="status-message error">Couldn't load data: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Nigeria Health Access Map</h1>
        <p>Click any state to view its full details on the State Search page.</p>
      </div>

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
      </div>

      <div className="card map-card">
        <div className="map-desc">{currentIndicator.desc}</div>
        <div className="map-svg-wrapper">
          <svg
            width="100%"
            viewBox={`0 0 ${staticPaths.width} ${staticPaths.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {staticPaths.states.map((state) => {
              const d = dataByName[state.name];
              const val = d ? d[indicator] : null;
              const isHovered = state.name === hovered;
              return (
                <path
                  key={state.name}
                  d={state.d}
                  fill={val != null ? colorScale(val) : '#eee'}
                  stroke="#fff"
                  strokeWidth={0.8}
                  opacity={isHovered ? 0.85 : 1}
                  onClick={() => navigate('/states', { state: { selected: state.name } })}
                  onMouseEnter={() => setHovered(state.name)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>
        </div>

        {hoveredData && (
          <div className="map-tooltip">
            <div className="tooltip-title">{hoveredData.state_name}</div>
            <div>{currentIndicator.label}: {hoveredData[indicator].toFixed(1)}%</div>
            <div className="tooltip-hint">Click to view full details</div>
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
  );
}