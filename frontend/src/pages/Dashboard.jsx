import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import DeviceCard from '../components/DeviceCard';
import VoiceButton from '../components/VoiceButton';
import { useNavigate } from 'react-router-dom';

const initialDevices = [
  { id: 'light', name: 'Light', type: 'light', state: 'OFF', level: '100%', image: '' },
  { id: 'fan', name: 'Fan', type: 'fan', state: 'OFF', image: '' },
  { id: 'door', name: 'Door', type: 'door', state: 'OFF', image: '' }
];

export default function Dashboard(){
  const [devices, setDevices] = useState(() => {
    try {
      const raw = localStorage.getItem('dashboard:devices');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return initialDevices;
  });
  const nav = useNavigate();

  useEffect(()=>{
    // fetch or update real device list if available
  },[]);

  // persist devices to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem('dashboard:devices', JSON.stringify(devices)); } catch (e) {}
  }, [devices]);

  // Listen to voice command results and update device states
  useEffect(()=>{
    function onVoiceResult(e){
      const d = e.detail || {};
      if (d && d.ok && d.device) {
        setDevices(devs => devs.map(x => x.id === d.device ? { ...x, state: d.state || x.state } : x));
      }
    }
    window.addEventListener('voice-command-result', onVoiceResult);
    return ()=> window.removeEventListener('voice-command-result', onVoiceResult);
  },[]);

  async function toggleDevice(d) {
    const newState = d.state === 'ON' ? 'OFF' : 'ON';

    // optimistic UI
    setDevices(devs =>
      devs.map(x => x.id === d.id ? { ...x, state: newState } : x)
    );

    try {
      const res = await apiFetch(`/api/device/${d.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });

      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      
      setDevices(devs =>
        devs.map(x => x.id === d.id ? { ...x, state: d.state } : x)
      );
      console.warn('Device command failed:', e);
    }
  }


  async function allOn(){
    
    setDevices(ds => ds.map(d=> ({...d, state:'ON'})));
    await Promise.all(devices.map(async (d)=>{
      try{
        const res = await apiFetch(`/api/device/${d.id}`, { method: 'POST', body: JSON.stringify({ state: 'ON' }) });
        if (!res.ok) console.warn('allOn failed for', d.id, await res.text().catch(()=>null));
      }catch(e){ console.warn('allOn network error for', d.id, e); }
    }));
  }

  async function allOff(){
    setDevices(ds => ds.map(d=> ({...d, state:'OFF'})));
    await Promise.all(devices.map(async (d)=>{
      try{
        const res = await apiFetch(`/api/device/${d.id}`, { method: 'POST', body: JSON.stringify({ state: 'OFF' }) });
        if (!res.ok) console.warn('allOff failed for', d.id, await res.text().catch(()=>null));
      }catch(e){ console.warn('allOff network error for', d.id, e); }
    }));
  }

  function openSensors(){ nav('/sensors'); }

  return (
    <div className="app-container">
      <div className="hero">
        
        <div>
          <div className="hero-title">Welcome Home</div>
          <div className="actions-row">
            <button className="pill primary" onClick={allOn}>All On</button>
            <button className="pill" onClick={allOff}>All Off</button>
          </div>
        </div>
        {/* <div style={{marginLeft:'auto'}}>
          <button style={{background:'transparent',border:'none',color:'#fff',fontSize:20}}>⚙️</button>
        </div> */}
      </div>

      <section style={{display:'flex',flexWrap:'wrap',gap:18,marginTop:18}}>
        {devices.map(d => <DeviceCard key={d.id} device={d} onToggle={toggleDevice} />)}
      </section>

      <div className="voice-button"><VoiceButton onClick={()=>alert('Voice control')} /></div>
    </div>
  );
}
