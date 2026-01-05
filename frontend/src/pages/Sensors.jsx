import React, { useEffect, useState } from 'react';
import { startPolling, stopPolling, onSensorData } from '../ws';
import { HOST } from '../api';
import SensorChart from '../components/SensorChart';
import GasChart from '../components/GasChart';
import BarChart from '../components/BarChart';
import QuickControls from '../components/QuickControls';
import AlertCard from '../components/AlertCard';
import StatCard from '../components/StatCard';
import BottomNav from '../components/BottomNav';

export default function Sensors(){
  const MAX_HISTORY = 1000;
  const loadHistory = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.slice(-MAX_HISTORY).map(p => ({ value: Number(p.value), time: Number(p.time) }));
    } catch (e) {
      return [];
    }
  };

  const [historyTemp, setHistoryTemp] = useState(() => loadHistory('sensors:historyTemp'));
  const [historyGas, setHistoryGas] = useState(() => loadHistory('sensors:historyGas'));
  const [historyHumid, setHistoryHumid] = useState(() => loadHistory('sensors:historyHumid'));
  const [fire, setFire] = useState(false);
  const [controls, setControls] = useState(() => {
    try {
      const raw = localStorage.getItem('sensors:controls');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id:'vent', title: 'Quạt thông gió', desc: 'Tự động khi có khói', state: 'OFF' },
      { id:'ac', title: 'Máy lạnh', desc: 'Đang tắt', state: 'OFF' }
    ];
  });

  // 1. Start polling (centralized in ../ws.js) and subscribe to emitted sensor items
  useEffect(() => {
    // subscribe first
    const off = onSensorData((d) => {
      // use numeric ms if provided by emitter (preferred), otherwise normalize string
      const raw = d.timeMs || d.time || d.received_at || d.receivedAt;
      let tsMs = null;
      if (typeof raw === 'number') tsMs = raw;
      else if (typeof raw === 'string') {
        // truncate microseconds if present
        const normalized = raw.replace(/\.(\d{3})\d+/, '.$1');
        tsMs = Date.parse(normalized);
      }
      const ts = tsMs ? new Date(tsMs).toISOString() : new Date().toISOString();
      console.debug('[Sensors] onSensorData received', { type: d.type, value: d.value, time: ts, timeMs: tsMs });
      if (d.type === 'Temperature'){
        setHistoryTemp(h => {
          // determine numeric ms timestamp
          const timeMs = (typeof d.timeMs === 'number') ? d.timeMs : Date.parse((d.time || d.received_at || d.receivedAt || new Date().toISOString()).toString().replace(/\.(\d{3})\d+/, '.$1'));
          const t = { value: Number(d.value), time: Number(timeMs) };
          const updated = [...h, t].filter(p => (Date.now() - Number(p.time)) <= 6*3600*1000);
          console.debug('[Sensors] historyTemp updated', { len: updated.length, last: updated[updated.length-1] });
          return updated;
        });
      } else if (d.type === 'Gas'){
        setHistoryGas(h => {
          const timeMs = (typeof d.timeMs === 'number') ? d.timeMs : Date.parse((d.time || d.received_at || d.receivedAt || new Date().toISOString()).toString().replace(/\.(\d{3})\d+/, '.$1'));
          const t = { value: Number(d.value), time: Number(timeMs) };
          const updated = [...h, t].filter(p => (Date.now() - Number(p.time)) <= 6*3600*1000);
          console.debug('[Sensors] historyGas updated', { len: updated.length, last: updated[updated.length-1] });
          return updated;
        });
        console.debug('[Sensors] updated Gas last', d.value);
      } else if (d.type === 'Humidity'){
        setHistoryHumid(h => {
          const timeMs = (typeof d.timeMs === 'number') ? d.timeMs : Date.parse((d.time || d.received_at || d.receivedAt || new Date().toISOString()).toString().replace(/\.(\d{3})\d+/, '.$1'));
          const t = { value: Number(d.value), time: Number(timeMs) };
          const updated = [...h, t].filter(p => (Date.now() - Number(p.time)) <= 6*3600*1000);
          console.debug('[Sensors] historyHumid updated', { len: updated.length, last: updated[updated.length-1] });
          return updated;
        });
        console.debug('[Sensors] updated Humidity last', d.value);
      }
    });
    // then start polling backend (so subscriber catches initial batch)
    console.debug('[Sensors] starting polling');
    startPolling();

    return () => {
      off();
      stopPolling();
    };
  }, []);

  // persist controls when user toggles them
  useEffect(() => {
    try { localStorage.setItem('sensors:controls', JSON.stringify(controls)); } catch (e) {}
  }, [controls]);

  // 2. THÊM MỚI: Logic Polling API Check Fire liên tục
  useEffect(() => {
    const checkFireStatus = async () => {
      try {
        const response = await fetch(`${HOST}/api/SensorData/check-fire`);
        if (response.ok) {
          const data = await response.json();
          // Theo ảnh Postman: data trả về là { "isFire": false/true }
          const isFireDetected = data.isFire;

          setFire(isFireDetected);

          if (isFireDetected) {
            console.warn("CẢNH BÁO CHÁY TỪ API!");
            // Tự động bật quạt (Logic cũ của bạn)
            setControls(cs => cs.map(c => c.id === 'vent' ? {...c, state: 'ON'} : c));
          }
        }
      } catch (error) {
        console.error("Lỗi khi check fire:", error);
      }
    };

    // Gọi ngay lập tức lần đầu
    checkFireStatus();

    // Thiết lập gọi lại mỗi 2 giây (2000ms)
    const intervalId = setInterval(checkFireStatus, 2000);

    // Dọn dẹp khi component unmount
    return () => clearInterval(intervalId);
  }, []);

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

      {/* 3. Hiển thị cảnh báo: AlertCard sẽ hiện khi state fire = true */}
      <div style={{marginTop:8}}>
        <AlertCard 
            visible={fire} 
            title="CẢNH BÁO CHÁY!"
            description="Phát hiện hỏa hoạn. Hệ thống phun nước đã kích hoạt."
            onAction={()=>alert('Đã gửi tín hiệu khẩn cấp!')} 
        />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
        <StatCard title="Nhiệt độ" value={historyTemp.length? historyTemp[historyTemp.length-1].value : '--'} unit="°C" small={historyTemp.length?'+1.2%':''} />
        <StatCard title="Độ ẩm" value={historyHumid.length? historyHumid[historyHumid.length-1].value : '--'} unit="%" small={historyHumid.length? 'Ổn':''} />
      </div>

      <div style={{marginTop:16}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Biểu đồ nhiệt</div>
        <div className="card"><SensorChart points={historyTemp} /></div>
      </div>

      <div style={{marginTop:16}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Biểu đồ độ ẩm</div>
        <div className="card"><SensorChart points={historyHumid} /></div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <GasChart points={historyGas} />
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