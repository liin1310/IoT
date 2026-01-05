import React, { useState } from 'react';

function SimpleLine({points, width=520, height=140, color='#0a84ff', maxPoints=120, smooth=true, onPointHover, showLatestMarker=false, thresholds=null, showDeltaMinutes=0}){
  const [hover, setHover] = useState(null);
  if (!points || points.length===0) return <div style={{height}} />;
  // points: [{value, time: Date | number}]
  const now = Date.now();
  const start = now - 6*3600*1000; // 6 hours ago
  const raw = points
    .map(p => ({ v: p.value, t: (typeof p.time === 'number' ? p.time : (p.time instanceof Date ? p.time.getTime() : Date.parse(String(p.time)))) }))
    .filter(p => p.t >= start);
  if (raw.length===0) return <div style={{height}} />;

  // sort
  const pts = raw.slice().sort((a,b)=>a.t-b.t);

  // downsample to maxPoints using LTTB (largest triangle three buckets)
  const lttb = (data, threshold) => {
    if (threshold >= data.length || threshold === 0) return data.slice();
    const sampled = [];
    const every = (data.length - 2) / (threshold - 2);
    let a = 0; // a is the index of the previous selected point
    sampled.push(data[a]);

    for (let i = 0; i < threshold - 2; i++) {
      const avgRangeStart = Math.floor((i + 1) * every) + 1;
      const avgRangeEnd = Math.floor((i + 2) * every) + 1;
      const avgRangeEndClamped = Math.min(avgRangeEnd, data.length);
      let avgX = 0, avgY = 0, avgRangeLength = 0;
      for (let j = avgRangeStart; j < avgRangeEndClamped; j++) {
        avgX += data[j].t;
        avgY += data[j].v;
        avgRangeLength++;
      }
      avgX = avgRangeLength ? (avgX / avgRangeLength) : data[a].t;
      avgY = avgRangeLength ? (avgY / avgRangeLength) : data[a].v;

      const rangeOffs = Math.floor(i * every) + 1;
      const rangeTo = Math.floor((i + 1) * every) + 1;
      const rangeToClamped = Math.min(rangeTo, data.length - 1);

      let maxArea = -1;
      let nextIndex = rangeOffs;

      for (let j = rangeOffs; j <= rangeToClamped; j++) {
        const area = Math.abs((data[a].t - avgX) * (data[j].v - data[a].v) - (data[a].t - data[j].t) * (avgY - data[a].v)) / 2;
        if (area > maxArea) {
          maxArea = area;
          nextIndex = j;
        }
      }

      sampled.push(data[nextIndex]);
      a = nextIndex;
    }

    sampled.push(data[data.length - 1]);
    return sampled;
  };

  let sampled = pts;
  if (pts.length > maxPoints) sampled = lttb(pts, maxPoints);

  const values = pts.map(p=>p.v);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const leftMargin = 28;
  const paddingX = 6;
  const labelHeight = 18; // space for time labels
  const plotWidth = Math.max(40, width - leftMargin - paddingX*2);
  const plotHeight = Math.max(20, height - labelHeight - 12);

  const timeRange = Math.max(1, pts[pts.length-1].t - pts[0].t);
  // compute smoothed values if requested (moving average)
  const windowSize = Math.max(1, Math.floor(sampled.length / 20));
  const smoothVals = smooth && windowSize > 1 ? sampled.map((_, idx) => {
    const start = Math.max(0, idx - Math.floor(windowSize/2));
    const end = Math.min(sampled.length-1, idx + Math.floor(windowSize/2));
    let sum = 0, cnt = 0;
    for (let k = start; k <= end; k++) { sum += sampled[k].v; cnt++; }
    return sum / Math.max(1, cnt);
  }) : sampled.map(p => p.v);

  const pointsAttr = sampled.map((p, i)=>{
    const x = leftMargin + ((p.t - pts[0].t)/timeRange)*(plotWidth) + paddingX;
    const v = smoothVals[i];
    const y = (plotHeight - ((v - min)/(max-min||1))*(plotHeight-12)) + 6;
    return `${x},${y}`;
  }).join(' ');

  // threshold shading (array of { label, max, color } or object with SAFE/WARNING/DANGER)
  const thresholdRects = (() => {
    if (!thresholds || sampled.length===0) return null;
    const items = Array.isArray(thresholds)
      ? thresholds.slice().sort((a,b)=> (a.max||0)-(b.max||0))
      : Object.keys(thresholds).map(k=>({ label:k, max: thresholds[k], color: thresholds[k+'Color'] || undefined })).sort((a,b)=> (a.max||0)-(b.max||0));
    return items.map(it=>{
      const v = it.max;
      const y = (plotHeight - ((v - min)/(max-min||1))*(plotHeight-12)) + 6;
      return { ...it, y };
    });
  })();

  // area path for filled area under the curve
  const areaPath = (() => {
    if (sampled.length === 0) return '';
    const coords = sampled.map((p, i) => {
      const x = leftMargin + ((p.t - pts[0].t)/timeRange)*(plotWidth) + paddingX;
      const v = smoothVals[i];
      const y = (plotHeight - ((v - min)/(max-min||1))*(plotHeight-12)) + 6;
      return {x, y};
    });
    const first = coords[0];
    const last = coords[coords.length-1];
    let d = `M ${first.x} ${first.y}`;
    for (let i=1;i<coords.length;i++) d += ` L ${coords[i].x} ${coords[i].y}`;
    d += ` L ${last.x} ${plotHeight+6} L ${first.x} ${plotHeight+6} Z`;
    return d;
  })();

  // x-axis ticks: 4 ticks including ends
  const ticks = 4;
  const tickTimes = [];
  for (let i=0;i<ticks;i++){
    const tt = pts[0].t + Math.round((i/(ticks-1)) * timeRange);
    tickTimes.push(tt);
  }

  const formatTime = (ms) => {
    try{
      const d = new Date(Number(ms));
      return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }catch(e){ return '' }
  };

  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {/* threshold shading behind chart */}
      {thresholdRects && (()=>{
        const left = leftMargin + paddingX;
        const right = leftMargin + plotWidth + paddingX;
        const ys = [6, ...thresholdRects.map(r=>r.y).sort((a,b)=>a-b), plotHeight+6];
        const parts = [];
        for (let i=0;i<ys.length-1;i++){
          const y1 = ys[i];
          const y2 = ys[i+1];
          const fill = (thresholdRects[i] && thresholdRects[i].color) ? thresholdRects[i].color : '#ffffff';
          parts.push(<rect key={i} x={left} y={y1} width={right-left} height={Math.max(1,y2-y1)} fill={fill} opacity={0.06} />);
        }
        return parts;
      })()}

      {/* filled area */}
      {areaPath && <path d={areaPath} fill={color} opacity={0.06} />}

      <polyline fill="none" stroke={color} strokeWidth={2.5} points={pointsAttr} strokeLinecap="round" strokeLinejoin="round" />

      {/* y-axis (min/max) */}
      <line x1={leftMargin-20} x2={leftMargin-20} y1={6} y2={plotHeight+6} stroke="rgba(255,255,255,0.06)" />
      <text x={2} y={14} fill="#9fb4d1" fontSize={11} textAnchor="start">{max}</text>
      <text x={2} y={plotHeight+2} fill="#9fb4d1" fontSize={11} textAnchor="start">{min}</text>

      {/* x-axis line */}
      <line x1={leftMargin+paddingX} x2={leftMargin+plotWidth+paddingX} y1={plotHeight+6} y2={plotHeight+6} stroke="rgba(255,255,255,0.06)" />

      {/* ticks and labels */}
      {tickTimes.map((t, i)=>{
        const x = leftMargin + ((t - pts[0].t)/timeRange)*(plotWidth) + paddingX;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={plotHeight+3} y2={plotHeight+9} stroke="rgba(255,255,255,0.06)" />
            <text x={x} y={plotHeight+labelHeight} fill="#9fb4d1" fontSize={11} textAnchor="middle">{formatTime(t)}</text>
          </g>
        );
      })}

      {/* points (sampled) with hover handlers for tooltip */}
      {sampled.map((p, i) => {
        const x = leftMargin + ((p.t - pts[0].t)/timeRange)*(plotWidth) + paddingX;
        const v = smoothVals[i];
        const y = (plotHeight - ((v - min)/(max-min||1))*(plotHeight-12)) + 6;
        return (
          <circle key={i} cx={x} cy={y} r={2} fill={color} opacity={0.95}
            onMouseEnter={() => { setHover({ x, y, v: p.v, t: p.t }); if (onPointHover) onPointHover({ value: p.v, time: p.t }); }}
            onMouseLeave={() => { setHover(null); if (onPointHover) onPointHover(null); }} />
        );
      })}

      {/* latest marker and delta */}
      {showLatestMarker && sampled.length>0 && (()=>{
        const p = sampled[sampled.length-1];
        const i = sampled.length-1;
        const x = leftMargin + ((p.t - pts[0].t)/timeRange)*(plotWidth) + paddingX;
        const v = smoothVals[i];
        const y = (plotHeight - ((v - min)/(max-min||1))*(plotHeight-12)) + 6;
        // compute delta against N minutes before
        let deltaText = '';
        if (showDeltaMinutes > 0){
          const cutoff = p.t - (showDeltaMinutes*60*1000);
          // find earlier sampled point closest before cutoff
          let prev = null;
          for (let k=sampled.length-1;k>=0;k--){ if (sampled[k].t <= cutoff) { prev = sampled[k]; break; } }
          if (!prev) {
            // fallback: earliest point within window
            for (let k=sampled.length-1;k>=0;k--){ if (sampled[k].t <= p.t - 1000) { prev = sampled[k]; break; } }
          }
          if (prev){
            const d = Math.round((p.v - prev.v) * 10)/10;
            deltaText = (d>=0? '+'+d : d) + ' ppm';
          }
        }
        return (
          <g key="latest">
            <circle cx={x} cy={y} r={5} fill="#071726" stroke={color} strokeWidth={2.5} />
            {deltaText && <text x={x+14} y={y+4} fill="#fff" fontSize={11} fontWeight={700}>{deltaText}</text>}
          </g>
        );
      })()}

      {/* tooltip */}
      {hover && (
        <g>
          <rect x={Math.max(4, hover.x - 40)} y={Math.max(4, hover.y - 36)} width={84} height={30} rx={6} fill="#071726" stroke="rgba(255,255,255,0.06)" />
          <text x={hover.x} y={hover.y - 18} fill="#fff" fontSize={12} textAnchor="middle">{hover.v}</text>
          <text x={hover.x} y={hover.y - 6} fill="#9fb4d1" fontSize={10} textAnchor="middle">{formatTime(hover.t)}</text>
        </g>
      )}
    </svg>
  );
}

export default function SensorChart({points, color='#0a84ff', width=520, height=140, maxPoints=120, smooth=true, onPointHover, showLatestMarker=false, thresholds=null, showDeltaMinutes=0}){
  return (
    <div style={{background:'#071726',padding:12,borderRadius:12}}>
      <SimpleLine points={points} width={width} height={height} color={color} maxPoints={maxPoints} smooth={smooth} onPointHover={onPointHover} showLatestMarker={showLatestMarker} thresholds={thresholds} showDeltaMinutes={showDeltaMinutes} />
    </div>
  );
}
