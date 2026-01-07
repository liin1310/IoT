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

// Map type từ API response sang device id
const typeToDeviceId = {
  'LightStatus': 'light',
  'FanStatus': 'fan',
  'DoorStatus': 'door'
};

// Map value từ API (1 = ON, 0 = OFF) sang state string
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

  // Polling để cập nhật trạng thái thiết bị realtime
  useEffect(() => {
    const pollDeviceStatus = async () => {
      try {
        const res = await fetch(`${HOST}/api/device/status`);
        if (res.ok) {
          const statuses = await res.json();
          console.debug('📡 Polling device status:', statuses);
          
          // Cập nhật devices dựa trên API response
          setDevices(prevDevices => {
            const updated = prevDevices.map(device => {
              // Tìm status tương ứng với device này
              const status = statuses.find(s => {
                const deviceId = typeToDeviceId[s.type];
                return deviceId === device.id;
              });
              
              if (status) {
                const newState = valueToState(status.value);
                // Chỉ cập nhật nếu state thay đổi
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

    // Gọi ngay lần đầu
    pollDeviceStatus();

    // Polling mỗi 2 giây để cập nhật realtime
    const intervalId = setInterval(pollDeviceStatus, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

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

    // Optimistic UI update
    setDevices(devs =>
      devs.map(x => x.id === d.id ? { ...x, state: newState } : x)
    );

    try {
      // Gọi đúng API endpoint theo device id
      const endpoint = `/api/device/${d.id}`; // light, fan, door
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      console.log(`✅ Đã gửi lệnh ${newState} cho ${d.id}`);
      // Polling sẽ tự động cập nhật lại trạng thái từ API
    } catch (e) {
      // Rollback nếu lỗi
      setDevices(devs =>
        devs.map(x => x.id === d.id ? { ...x, state: d.state } : x)
      );
      console.error('❌ Device command failed:', e);
      alert(`Không thể ${newState === 'ON' ? 'bật' : 'tắt'} ${d.name}. Vui lòng thử lại.`);
    }
  }


  async function allOn(){
    // Optimistic UI update
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
          console.warn(`❌ allOn failed for ${d.id}:`, errorText);
        } else {
          console.log(`✅ Đã bật ${d.id}`);
        }
      }catch(e){ 
        console.error(`❌ allOn network error for ${d.id}:`, e); 
      }
    }));
    // Polling sẽ tự động cập nhật lại trạng thái từ API
  }

  async function allOff(){
    // Optimistic UI update
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
          console.warn(`❌ allOff failed for ${d.id}:`, errorText);
        } else {
          console.log(`✅ Đã tắt ${d.id}`);
        }
      }catch(e){ 
        console.error(`❌ allOff network error for ${d.id}:`, e); 
      }
    }));
    // Polling sẽ tự động cập nhật lại trạng thái từ API
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
