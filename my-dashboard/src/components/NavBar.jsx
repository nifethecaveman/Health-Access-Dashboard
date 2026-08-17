import React from 'react';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="navbar-title">Nigeria Health Indicators</span>
          <span className="navbar-subtitle">DHS Program, Subnational Survey Data</span>
        </div>
        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            Map
          </NavLink>
          <NavLink to="/states" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            State Search
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            Compare States
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
