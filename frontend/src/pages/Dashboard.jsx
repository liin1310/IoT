import React, { useEffect, useState } from 'react';
import { apiFetch, HOST } from '../api';
import DeviceCard from '../components/DeviceCard';
import VoiceButton from '../components/VoiceButton';
import { useNavigate } from 'react-router-dom';

const initialDevices = [
  { id: 'light', name: 'Light', type: 'light', state: 'OFF', level: '100%', image: '' },
  { id: 'fan', name: 'Fan', type: 'fan', state: 'OFF', image: '' },
  { id: 'door', name: 'Door', type: 'door', state: 'OFF', image: '' }
];

const typeToDeviceId = {
  'LightStatus': 'light',
  'FanStatus': 'fan',
  'DoorStatus': 'door'
};

const valueToState = (value) => value === 1 ? 'ON' : 'OFF';

export default function Dashboard(){
  const [devices, setDevices] = useState(() => {
    try {
      const raw = localStorage.getItem('dashboard:devices');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return initialDevices;
  });
  const nav = useNavigate();

  useEffect(() => {
    const pollDeviceStatus = async () => {
      try {
        const res = await fetch(`${HOST}/api/device/status`);
        if (res.ok) {
          const statuses = await res.json();
          console.debug(' Polling device status:', statuses);

          setDevices(prevDevices => {
            const updated = prevDevices.map(device => {
              const status = statuses.find(s => {
                const deviceId = typeToDeviceId[s.type];
                return deviceId === device.id;
              });
              
              if (status) {
                const newState = valueToState(status.value);
                if (device.state !== newState) {
                  console.log(`🔄 Cập nhật ${device.id}: ${device.state} → ${newState}`);
                  return {
                    ...device,
                    state: newState
                  };
                }
              }
              return device;
            });
            return updated;
          });
        }
      } catch (error) {
        console.error('Lỗi polling device status:', error);
      }
    };


    pollDeviceStatus();
    const intervalId = setInterval(pollDeviceStatus, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('dashboard:devices', JSON.stringify(devices)); } catch (e) {}
  }, [devices]);

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

    setDevices(devs =>
      devs.map(x => x.id === d.id ? { ...x, state: newState } : x)
    );

    try {
      const endpoint = `/api/device/${d.id}`; 
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      console.log(`Đã gửi lệnh ${newState} cho ${d.id}`);
    } catch (e) {
    
      setDevices(devs =>
        devs.map(x => x.id === d.id ? { ...x, state: d.state } : x)
      );
      console.error(' Device command failed:', e);
      alert(`Không thể ${newState === 'ON' ? 'bật' : 'tắt'} ${d.name}. Vui lòng thử lại.`);
    }
  }


  async function allOn(){
 
    setDevices(ds => ds.map(d=> ({...d, state:'ON'})));
    
    await Promise.all(devices.map(async (d)=>{
      try{
        const res = await apiFetch(`/api/device/${d.id}`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'ON' }) 
        });
        if (!res.ok) {
          const errorText = await res.text().catch(()=>null);
          console.warn(` allOn failed for ${d.id}:`, errorText);
        } else {
          console.log(` Đã bật ${d.id}`);
        }
      }catch(e){ 
        console.error(` allOn network error for ${d.id}:`, e); 
      }
    }));

  }

  async function allOff(){
    setDevices(ds => ds.map(d=> ({...d, state:'OFF'})));
    
    await Promise.all(devices.map(async (d)=>{
      try{
        const res = await apiFetch(`/api/device/${d.id}`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'OFF' }) 
        });
        if (!res.ok) {
          const errorText = await res.text().catch(()=>null);
          console.warn(` allOff failed for ${d.id}:`, errorText);
        } else {
          console.log(`Đã tắt ${d.id}`);
        }
      }catch(e){ 
        console.error(` allOff network error for ${d.id}:`, e); 
      }
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
      </div>

      <section style={{display:'flex',flexWrap:'wrap',gap:18,marginTop:18}}>
        {devices.map(d => <DeviceCard key={d.id} device={d} onToggle={toggleDevice} />)}
      </section>

      <div className="voice-button"><VoiceButton onClick={()=>alert('Voice control')} /></div>
    </div>
  );
}
