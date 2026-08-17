import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000';

const DataContext = createContext(null);

export const INDICATORS = [
  { key: 'immunization_rate', label: 'Immunization', good: 'high', desc: 'Children fully vaccinated (8 basic antigens)' },
  { key: 'stunting_rate', label: 'Stunting', good: 'low', desc: 'Children who are stunted (low height-for-age)' },
  { key: 'birth_facility_rate', label: 'Facility Delivery', good: 'high', desc: 'Births delivered at a health facility' },
  { key: 'education_rate', label: 'Education', good: 'high', desc: 'Women with secondary or higher education' },
];

export const COLOR_RAMPS = {
  immunization_rate: ['#fef9ec', '#0f5c4f'],
  stunting_rate: ['#fef2ec', '#9a2b1f'],
  birth_facility_rate: ['#eef6fb', '#0c4a6e'],
  education_rate: ['#f6f0fb', '#4c2d7a'],
};

export function DataProvider({ children }) {
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

  const dataByName = {};
  stateData.forEach(d => { dataByName[d.state_name] = d; });

  const allStateNames = stateData.map(d => d.state_name).sort();

  const value = {
    stateData,
    nationalAvg,
    geojson,
    loading,
    error,
    dataByName,
    allStateNames,
    API_BASE_URL,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
