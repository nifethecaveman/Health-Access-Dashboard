import React, { useState } from 'react';
import { useData, INDICATORS } from '../context/DataContext';

export default function ComparePage() {
  const { dataByName, allStateNames, loading, error } = useData();
  const [compareList, setCompareList] = useState([]);
  const [compareInput, setCompareInput] = useState('');

  function addCompare(name) {
    if (!name || compareList.includes(name) || compareList.length >= 4) return;
    setCompareList([...compareList, name]);
    setCompareInput('');
  }

  function removeCompare(name) {
    setCompareList(compareList.filter(n => n !== name));
  }

  const suggestions = compareInput
    ? allStateNames.filter(n => n.toLowerCase().includes(compareInput.toLowerCase()) && !compareList.includes(n)).slice(0, 6)
    : [];

  if (loading) return <div className="status-message">Loading comparison data...</div>;
  if (error) return <div className="status-message error">Couldn't load data: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Compare States</h1>
        <p>Select 2-4 states to compare side by side across all indicators.</p>
      </div>

      <div className="card">
        {compareList.length > 0 && (
          <div className="compare-tags">
            {compareList.map(name => (
              <span key={name} className="compare-tag">
                {name}
                <span className="compare-tag-remove" onClick={() => removeCompare(name)}>&times;</span>
              </span>
            ))}
          </div>
        )}

        {compareList.length < 4 && (
          <div className="compare-input-wrap">
            <input
              value={compareInput}
              onChange={e => setCompareInput(e.target.value)}
              placeholder="Add a state to compare..."
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

        {compareList.length >= 2 ? (
          <table className="compare-table compare-table-large">
            <thead>
              <tr>
                <th></th>
                {compareList.map(name => <th key={name}>{name}</th>)}
              </tr>
            </thead>
            <tbody>
              {INDICATORS.map(ind => {
                const values = compareList.map(name => dataByName[name][ind.key]);
                const best = ind.good === 'high' ? Math.max(...values) : Math.min(...values);
                return (
                  <tr key={ind.key}>
                    <td>{ind.label}</td>
                    {compareList.map(name => {
                      const val = dataByName[name][ind.key];
                      const isBest = val === best;
                      return (
                        <td key={name} className={isBest ? 'compare-best' : ''}>
                          {val.toFixed(1)}%
                          {isBest && <span className="compare-best-badge">best</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="compare-hint">
            <div className="compare-hint-icon">&#128202;</div>
            <div className="compare-hint-title">Compare states side by side</div>
            <div className="compare-hint-text">
              Add 2-4 states above to see how they stack up across immunization, stunting,
              facility delivery, and education rates.
            </div>
          </div>
        )}
      </div>

      <div className="footer-note">
        "Best" is shown relative to the selected states only, not all 37 &mdash; and reflects the direction that
        indicates a better outcome for each indicator (e.g. lower is better for stunting, higher is better for immunization).
      </div>
    </div>
  );
}