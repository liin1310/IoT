import React, { useEffect, useState } from 'react';
import { startSignalR, onSensorData } from '../ws';
import SensorChart from '../components/SensorChart';
import BarChart from '../components/BarChart';
import QuickControls from '../components/QuickControls';
import AlertCard from '../components/AlertCard';
import StatCard from '../components/StatCard';
import BottomNav from '../components/BottomNav';

export default function Sensors(){
  const [historyTemp, setHistoryTemp] = useState([]); // array of {value, time}
  const [historyGas, setHistoryGas] = useState([]);
  const [fire, setFire] = useState(false);
  const [controls, setControls] = useState([
    { id:'vent', title: 'Quạt thông gió', desc: 'Tự động khi có khói', state: 'OFF' },
    { id:'ac', title: 'Máy lạnh', desc: 'Đang tắt', state: 'OFF' }
  ]);

  useEffect(()=>{
    startSignalR().then(()=>console.log('SignalR connected')).catch(e=>console.warn(e));
    const off = onSensorData((d)=>{
      if (d.type === 'Temperature'){
        setHistoryTemp(h => {
          const t = { value: Number(d.value), time: new Date(d.time) };
          const filtered = [...h, t].filter(p => (Date.now() - p.time.getTime()) <= 6*3600*1000);
          return filtered;
        });
      } else if (d.type === 'Gas'){
        setHistoryGas(h => {
          const t = { value: Number(d.value), time: new Date(d.time) };
          const filtered = [...h, t].filter(p => (Date.now() - p.time.getTime()) <= 6*3600*1000);
          return filtered;
        });
      } else if (d.type === 'FireStatus'){
        const isFire = d.value === 1 || d.value === 1.0 || d.value === '1';
        setFire(isFire);
        if (isFire){
          // auto-enable vent as demo
          setControls(cs => cs.map(c=> c.id==='vent' ? {...c, state:'ON'} : c));
        }
      }
    });
    return ()=> off();
  },[]);

  function handleToggle(control){
    setControls(cs => cs.map(c=> c.id===control.id ? {...c, state: c.state==='ON'?'OFF':'ON'} : c));
  }

  return (
    <div className="app-container">
      <header style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <button onClick={()=>window.history.back()} style={{background:'transparent',border:'none',color:'#fff',fontSize:20}}>←</button>
        <h2 style={{margin:0}}>Giám sát phòng khách</h2>
        <div style={{marginLeft:'auto',padding:'4px 10px',background:'#0b3b20',borderRadius:12,color:'#8ff0a5'}}>Online</div>
      </header>

      <div style={{marginTop:8}}>
        <AlertCard visible={fire} onAction={()=>alert('Kích hoạt vòi phun (demo)')} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
        <StatCard title="Nhiệt độ" value={historyTemp.length? historyTemp[historyTemp.length-1].value : '--'} unit="°C" small={historyTemp.length?'+1.2%':''} />
        <StatCard title="Chất lượng KK" value={historyGas.length? historyGas[historyGas.length-1].value : '--'} unit="PPM" small={historyGas.length?'Cao':''} />
      </div>

      <div style={{marginTop:16}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Biểu đồ nhiệt</div>
        <div className="card"><SensorChart points={historyTemp} /></div>
      </div>

      <div style={{marginTop:16}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Nồng độ khói/CO2 <span style={{color:'#ff6b6b',fontSize:12,fontWeight:600,marginLeft:8}}>Cảnh báo: Tăng đột biến</span></div>
        <div className="card" style={{padding:16}}>
          <BarChart points={historyGas} height={120} />
        </div>
      </div>

      <div style={{marginTop:16}}>
        <QuickControls controls={controls} onToggle={handleToggle} />
      </div>

      <div style={{height:80}} />
      <div className="bottom-nav"><BottomNav /></div>
    </div>
  );
}
