import React from 'react';
import SensorCard from './components/SensorCard';

function App() {
  const sample = { temp: '28.3', humidity: 63, light: 420, timestamp: new Date().toISOString() };
  return (
    <div style={{padding:40, background:'#f5f7fb', minHeight:'100vh'}}>
      <SensorCard data={sample} />
    </div>
  );
}

export default App;
