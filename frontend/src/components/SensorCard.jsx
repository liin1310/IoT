import React from 'react';

export default function SensorCard({data}) {
  // data = { temp, humidity, light, timestamp }
  return (
    <div style={{
      width: 320, padding: 16, borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      background: '#fff'
    }}>
      <h3>Phòng 1</h3>
      <div style={{fontSize: 28, fontWeight: 700}}>
        {data.temp} °C
      </div>
      <div style={{marginTop:8}}>
        <div>💧 Độ ẩm: {data.humidity}%</div>
        <div>💡 Ánh sáng: {data.light}</div>
        <div style={{fontSize:12, color:'#666', marginTop:8}}>
          {new Date(data.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
