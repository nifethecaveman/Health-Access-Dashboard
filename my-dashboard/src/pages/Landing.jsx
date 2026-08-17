import React from 'react';
import { Link } from 'react-router-dom';
import { useData, INDICATORS } from '../context/DataContext';

export default function Landing() {
  const { nationalAvg, loading, error, stateData } = useData();

  if (loading) return <div className="status-message">Loading dashboard data...</div>;
  if (error) return <div className="status-message error">Couldn't load data: {error}</div>;

  // Find the state with the biggest gap from the national average on stunting, as a quick "priority state" callout
  const worstStunting = [...stateData].sort((a, b) => b.stunting_rate - a.stunting_rate)[0];
  const bestImmunization = [...stateData].sort((a, b) => b.immunization_rate - a.immunization_rate)[0];

  return (
    <div className="page landing-page">
      <section className="hero">
        <h1>Understand child and maternal health access, state by state.</h1>
        <p className="hero-sub">
          This tool turns Nigeria's DHS survey data into something anyone can use — pick a state,
          compare it to others, and see where children and mothers have the least access to basic health care.
        </p>
        <div className="hero-actions">
          <Link to="/map" className="btn btn-primary">Explore the Map</Link>
          <Link to="/states" className="btn btn-secondary">Search a State</Link>
        </div>
      </section>

      {nationalAvg && (
        <section className="national-snapshot">
          <h2>National Snapshot</h2>
          <div className="snapshot-grid">
            {INDICATORS.map(ind => (
              <div key={ind.key} className="snapshot-card">
                <div className="snapshot-label">{ind.label}</div>
                <div className="snapshot-value">{nationalAvg[ind.key].toFixed(1)}%</div>
                <div className="snapshot-desc">{ind.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {worstStunting && bestImmunization && (
        <section className="callouts">
          <div className="callout-card callout-warning">
            <div className="callout-label">Highest stunting rate</div>
            <div className="callout-state">{worstStunting.state_name}</div>
            <div className="callout-value">{worstStunting.stunting_rate.toFixed(1)}%</div>
            <Link to="/states" className="callout-link">View state details &rarr;</Link>
          </div>
          <div className="callout-card callout-positive">
            <div className="callout-label">Highest immunization rate</div>
            <div className="callout-state">{bestImmunization.state_name}</div>
            <div className="callout-value">{bestImmunization.immunization_rate.toFixed(1)}%</div>
            <Link to="/states" className="callout-link">View state details &rarr;</Link>
          </div>
        </section>
      )}

      <section className="about-data">
        <h2>About this data</h2>
        <p>
          Figures are drawn from the DHS Program's subnational survey data for Nigeria, covering all 36 states
          and the Federal Capital Territory. This is survey-based data collected periodically, not a real-time feed &mdash;
          treat it as a snapshot of conditions at the time of the underlying survey, not up-to-the-minute statistics.
        </p>
      </section>
    </div>
  );
}
