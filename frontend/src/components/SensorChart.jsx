import React from 'react';

function SimpleLine({points, width=520, height=140, color='#0a84ff'}){
  if (!points || points.length===0) return <div style={{height}} />;
  // points: [{value, time: Date}]
  const now = Date.now();
  const start = now - 6*3600*1000; // 6 hours ago
  const pts = points.map(p=>({v: p.value, t: p.time.getTime()})).filter(p=>p.t >= start);
  if (pts.length===0) return <div style={{height}} />;
  const values = pts.map(p=>p.v);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const timeRange = Math.max(1, pts[pts.length-1].t - pts[0].t);
  const pointsAttr = pts.map(p=>{
    const x = ((p.t - pts[0].t)/timeRange)*(width-12)+6;
    const y = height - ((p.v - min)/(max-min||1))*(height-12) -6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{display:'block'}}>
      <polyline fill="none" stroke={color} strokeWidth={3} points={pointsAttr} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SensorChart({points}){
  return (
    <div style={{background:'#071726',padding:12,borderRadius:12}}>
      <SimpleLine points={points} width={520} height={140} />
    </div>
  );
}
