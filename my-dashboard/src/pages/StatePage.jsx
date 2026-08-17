import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData, INDICATORS } from '../context/DataContext';

function diffLabel(stateVal, avgVal, key) {
  const diff = stateVal - avgVal;
  const good = INDICATORS.find(i => i.key === key).good;
  const isBetter = good === 'high' ? diff > 0 : diff < 0;
  const arrow = diff === 0 ? '\u2192' : (diff > 0 ? '\u2191' : '\u2193');
  const label = isBetter ? 'Better than avg' : (diff === 0 ? 'At avg' : 'Worse than avg');
  return { text: `${arrow} ${Math.abs(diff).toFixed(1)} pts \u00b7 ${label}`, isBetter };
}

export default function StatePage() {
  const { stateData, nationalAvg, dataByName, allStateNames, loading, error } = useData();
  const routerLocation = useLocation();
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  // If we arrived here from a map click, pre-select that state
  useEffect(() => {
    if (routerLocation.state?.selected) {
      setSelected(routerLocation.state.selected);
    }
  }, [routerLocation.state]);

  const filteredNames = query
    ? allStateNames.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : allStateNames;

  const selectedData = dataByName[selected];

  if (loading) return <div className="status-message">Loading state data...</div>;
  if (error) return <div className="status-message error">Couldn't load data: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>State Search</h1>
        <p>Look up any state to see how it compares to the national average.</p>
      </div>

      <div className="state-search-layout">
        <div className="card state-list-card">
          <div className="panel-label">All States</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search states..."
            className="compare-input"
            style={{ marginBottom: 10 }}
          />
          <div className="state-list">
            {filteredNames.map(name => (
              <div
                key={name}
                onClick={() => setSelected(name)}
                className={`state-list-item ${selected === name ? 'active' : ''}`}
              >
                {name}
              </div>
            ))}
            {filteredNames.length === 0 && (
              <div className="state-list-empty">No states match "{query}"</div>
            )}
          </div>
        </div>

        {!selected && (
          <div className="card state-detail-card state-placeholder">
            <div className="state-placeholder-icon">&#128269;</div>
            <div className="state-placeholder-title">Search a state</div>
            <p className="state-placeholder-text">
              Choose a state from the list on the left to see its immunization, stunting,
              facility delivery, and education rates compared to the national average.
            </p>
          </div>
        )}

        {selected && selectedData && nationalAvg && (
          <div className="card state-detail-card">
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
            <p className="state-summary">
              {selectedData.state_name} {diffLabel(selectedData.stunting_rate, nationalAvg.stunting_rate, 'stunting_rate').isBetter
                ? 'has a lower-than-average child stunting rate'
                : 'has a higher-than-average child stunting rate'}, and its immunization coverage is
              {' '}{diffLabel(selectedData.immunization_rate, nationalAvg.immunization_rate, 'immunization_rate').isBetter
                ? ' above'
                : ' below'} the national average.
            </p>
          </div>
        )}
      </div>

      <div className="footer-note">
        Source: DHS Program subnational survey data for Nigeria. Figures are survey estimates and may not reflect real-time conditions.
      </div>
    </div>
  );
}