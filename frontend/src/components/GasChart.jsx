import React, { useEffect, useRef, useState } from 'react';
import SensorChart from './SensorChart';
import { GAS_LEVELS } from '../constants/gasLevels';

export default function GasChart({ points = [] }) {
  const latest = points.at(-1)?.value ?? 0;
  const latestTime = points.at(-1)?.time ?? Date.now();
  const audioRef = useRef(null);
  const prevDangerRef = useRef(false);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('gas:muted') === '1'; } catch(e){return false} });
  const [alertHistory, setAlertHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('sensors:gasAlerts')||'[]'); } catch(e){return []} });
  const [showAlerts, setShowAlerts] = useState(false);
  const [flash, setFlash] = useState(false);

  const status =
    latest > GAS_LEVELS.DANGER
      ? 'DANGER'
      : latest > GAS_LEVELS.WARNING
      ? 'WARNING'
      : 'SAFE';

  const statusText = { SAFE: 'AN TOÀN', WARNING: 'CẢNH BÁO', DANGER: 'NGUY HIỂM' };
  const statusColor = { SAFE: '#3fb950', WARNING: '#f2cc60', DANGER: '#ff4d4f' };

  // play sound + record alert + flash when entering DANGER
  useEffect(()=>{
    if (status === 'DANGER' && !prevDangerRef.current && !muted) {
      audioRef.current?.play().catch(()=>{});
      prevDangerRef.current = true;
      const ev = { time: Date.now(), level: status, value: latest };
      setAlertHistory(h => { const next = [...h, ev].slice(-200); try{ localStorage.setItem('sensors:gasAlerts', JSON.stringify(next)); }catch(e){}; return next; });
    }
    if (status !== 'DANGER') {
      prevDangerRef.current = false;
    }
  }, [status, muted, latest]);

  // Flash liên tục khi ở trạng thái DANGER
  useEffect(() => {
    if (status === 'DANGER') {
      setFlash(true);
    } else {
      setFlash(false);
    }
  }, [status]);

  useEffect(()=>{ try{ localStorage.setItem('gas:muted', muted? '1':'0') }catch(e){} }, [muted]);

  // compute delta vs N minutes ago for header display
  const DELTA_MINUTES = 5;
  let deltaText = '';
  if (points && points.length>1){
    const lastT = typeof latestTime === 'number' ? latestTime : Date.parse(String(latestTime));
    const cutoff = lastT - DELTA_MINUTES*60*1000;
    // find nearest point before cutoff
    let prev = null;
    for (let i = points.length-1; i>=0; i--){ const t = typeof points[i].time === 'number' ? points[i].time : Date.parse(String(points[i].time)); if (t <= cutoff) { prev = points[i]; break; } }
    if (!prev) {
      // fallback: take earliest point within window
      for (let i = points.length-1; i>=0; i--){ const t = typeof points[i].time === 'number' ? points[i].time : Date.parse(String(points[i].time)); if (t <= lastT - 1000) { prev = points[i]; break; } }
    }
    if (prev) {
      const d = Math.round((latest - Number(prev.value))*10)/10;
      deltaText = (d>=0? '+'+d : d) + ' ppm';
    }
  }

  const thresholds = [
    { label: 'SAFE', max: GAS_LEVELS.SAFE, color: '#3fb950' },
    { label: 'WARNING', max: GAS_LEVELS.WARNING, color: '#f2cc60' },
    { label: 'DANGER', max: GAS_LEVELS.DANGER, color: '#ff4d4f' }
  ];

  return (
    <div>
      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      <div style={{ marginBottom: 12, position:'relative' }}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Nồng độ khí Gas</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          {latest} ppm
          <span style={{ marginLeft:12, color: statusColor[status], fontSize:16 }}>{statusText[status]}</span>
          {deltaText && <span style={{ marginLeft:10, fontSize:12, opacity:0.9 }}>{deltaText} ({DELTA_MINUTES}m)</span>}
        </div>
        <div style={{position:'absolute', right:0, top:0, display:'flex', gap:8}}>
          <button className="pill" onClick={()=>setMuted(m=>!m)}>{muted? 'Unmute':'Mute'}</button>
          <button className="pill" onClick={()=>setShowAlerts(s=>!s)}>{showAlerts? 'Hide alerts':'Alerts'}</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, fontSize:12, marginBottom:8 }}>
        <span style={{ color: '#3fb950' }}>🟢 &lt; {GAS_LEVELS.SAFE}</span>
        <span style={{ color: '#f2cc60' }}>🟡 {GAS_LEVELS.SAFE}–{GAS_LEVELS.WARNING}</span>
        <span style={{ color: '#ff4d4f' }}>🔴 &gt; {GAS_LEVELS.DANGER}</span>
      </div>

      <div style={{ borderRadius:12, padding:6, transition:'box-shadow 200ms', ...(flash? { boxShadow: '0 0 18px rgba(255,77,79,0.9)'} : {}) }}>
        <SensorChart points={points} height={140} color={statusColor[status]} showLatestMarker={true} showDeltaMinutes={DELTA_MINUTES} thresholds={thresholds} />
      </div>

      {showAlerts && (
        <div style={{marginTop:12, background:'#06141a', padding:8, borderRadius:8, maxHeight:160, overflow:'auto'}}>
          {alertHistory.length===0 ? <div style={{opacity:0.6}}>No alerts</div> : alertHistory.slice().reverse().map((a,idx)=> (
            <div key={idx} style={{padding:6,borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:12}}>{new Date(a.time).toLocaleString()}</div>
              <div style={{fontSize:13,fontWeight:700,color: a.level==='DANGER'? '#ff4d4f' : '#f2cc60'}}>{a.level} — {a.value} ppm</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
