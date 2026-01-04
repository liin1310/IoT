import React, { useEffect, useState } from 'react';
import DeviceCard from '../components/DeviceCard';
import VoiceButton from '../components/VoiceButton';
import { useNavigate } from 'react-router-dom';

const initialDevices = [
  { id: 'living', name: 'Living Room', type: 'Light', state: 'ON', level: '80%', image: '' },
  { id: 'bedroom', name: 'Bedroom Fan', type: 'Fan', state: 'OFF', image: '' },
  { id: 'kitchen', name: 'Kitchen Spots', type: 'Light', state: 'ON', level: '100%', image: '' },
  { id: 'hall', name: 'Hallway', type: 'Light', state: 'OFF', image: '' },
  { id: 'tv', name: 'Living TV', type: 'TV', state: 'OFF', image: '' },
  { id: 'ac', name: 'AC Unit', type: 'AC', state: 'ON', level: '22°C', image: '' }
];

export default function Dashboard(){
  const [devices, setDevices] = useState(initialDevices);
  const nav = useNavigate();

  useEffect(()=>{
    // fetch or update real device list if available
  },[]);

  function toggleDevice(d){
    const newState = d.state === 'ON' ? 'OFF' : 'ON';
    setDevices(devs => devs.map(x => x.id===d.id ? {...x, state: newState} : x));
    // send command to backend if available (best-effort)
    try{ fetch(`/api/device/${d.id==='living'?'light':'fan'}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ State: newState }) }); }catch(e){}
  }

  function allOn(){ setDevices(ds => ds.map(d=> ({...d, state:'ON'}))); }
  function allOff(){ setDevices(ds => ds.map(d=> ({...d, state:'OFF'}))); }

  function openSensors(){ nav('/sensors'); }

  return (
    <div className="app-container">
      <div className="hero">
        <div className="avatar">A</div>
        <div>
          <div className="hero-title">Welcome Home, Alex</div>
          <div className="hero-sub">You have 4 devices active today.</div>
          <div className="actions-row">
            <button className="pill primary" onClick={allOn}>All On</button>
            <button className="pill" onClick={allOff}>All Off</button>
            <button className="pill" onClick={()=>alert('Night mode')} >Night Mode</button>
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
