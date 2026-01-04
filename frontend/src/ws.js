import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection = null;
const listeners = [];
let mockInterval = null;

function emitMock() {
  const types = ['Temperature', 'Gas', 'Humidity', 'FireStatus'];
  // emit a temperature and gas value
  const temp = (20 + Math.random() * 8).toFixed(1);
  const gas = Math.floor(50 + Math.random() * 200);
  const humid = Math.floor(40 + Math.random() * 40);
  const time = new Date().toISOString();

  const samples = [
    { type: 'Temperature', value: Number(temp), time },
    { type: 'Gas', value: Number(gas), time },
    { type: 'Humidity', value: Number(humid), time }
  ];

  // Randomly emit a fire warning sometimes
  if (Math.random() < 0.03) samples.push({ type: 'FireStatus', value: 1.0, time });

  samples.forEach(s => listeners.forEach(l => l(s)));
}

export async function startSignalR() {
  if (connection) return connection;
  connection = new HubConnectionBuilder()
    .withUrl('/sensorhub')
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveSensorData', (data) => {
    listeners.forEach(l => l(data));
  });

  try {
    await connection.start();
    console.log('SignalR connected');
    // if there was a mock interval running, stop it
    if (mockInterval) { clearInterval(mockInterval); mockInterval = null; }
    return connection;
  } catch (ex) {
    console.warn('SignalR start failed, using mock data:', ex?.message || ex);
    // fallback: emit mock sensor data periodically
    if (!mockInterval) mockInterval = setInterval(emitMock, 2000);
    return null; // indicate mock mode
  }
}

export function onSensorData(cb){
  listeners.push(cb);
  return ()=>{
    const idx = listeners.indexOf(cb);
    if (idx >=0) listeners.splice(idx,1);
  }
}

export function stopSignalR(){
  if (connection) {
    connection.stop();
    connection = null;
  }
  if (mockInterval) { clearInterval(mockInterval); mockInterval = null; }
}
