import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import { DataProvider } from './context/DataContext';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import StatePage from './pages/StatePage';
import ComparePage from './pages/ComparePage';
import './styles.css';

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <div className="app-shell">
          <NavBar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/states" element={<StatePage />} />
              <Route path="/compare" element={<ComparePage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </DataProvider>
  );
}
