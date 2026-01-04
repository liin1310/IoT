import React from 'react';

export default function BarChart({points, height=120}){
  // points: array of {value, time}
  if (!points || points.length===0) return <div style={{height}} />;
  const values = points.map(p=>p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const barWidth = Math.max(8, Math.floor(520 / Math.max(1, points.length)) - 4);

  return (
    <div style={{display:'flex',alignItems:'end',gap:6,height}}>
      {points.map((p, i)=>{
        const h = ((p.value - min) / (max - min || 1)) * (height - 20) + 6;
        const danger = p.value > (max * 0.7);
        return (
          <div key={i} title={`${p.value}`} style={{width:barWidth, height: h, background: danger ? '#ff6b6b' : '#2f3b45', borderRadius:6}} />
        );
      })}
    </div>
  );
}
