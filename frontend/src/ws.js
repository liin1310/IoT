import { HOST } from "./api";

const listeners = [];
const lastTimeMap = {}; 
let timer = null;
const POLL_INTERVAL = 30000; 

async function poll(type) {
  try {
    let url = `${HOST}/api/SensorData/history/${type}`;

    if (lastTimeMap[type]) {
      url += `?after=${encodeURIComponent(lastTimeMap[type])}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    // debug: how many items returned
    console.debug(`Polling ${type} -> ${data.length} items`, { type, url: url, returned: data.length });

    // helper: normalize ISO string to milliseconds precision (some servers send microseconds)
    const normalizeIso = (s) => {
      if (!s) return s;
      // replace fractional seconds >3 digits with 3 digits (truncate extra microseconds)
      return s.replace(/\.(\d{3})\d+/, '.$1');
    };

    // Sort ascending by received_at so we emit oldest->newest
    const items = data.slice().sort((a, b) => {
      const ta = Date.parse(normalizeIso(a.received_at));
      const tb = Date.parse(normalizeIso(b.received_at));
      return ta - tb;
    });

    let emitted = 0;
    for (const item of items) {
      const norm = normalizeIso(item.received_at);
      const t = Date.parse(norm);
      // if we have a last timestamp, only emit newer items
      if (!lastTimeMap[type] || t > lastTimeMap[type]) {
        lastTimeMap[type] = t;
        // per-item debug
        console.debug(`[ws] emit ${type}`, { id: item.id, received_at: norm, value: item.value });
        listeners.forEach(cb => cb({ type: item.type, value: Number(item.value), time: norm, timeMs: t }));
        emitted++;
      }
    }

    if (emitted) console.debug(`Emitted ${emitted} new ${type} items`);
  } catch (err) {
    console.error("Polling error:", err);
  }
}

export function startPolling(types = ["Gas", "Temperature", "Humidity"]) {
  if (timer) return;

  // initial immediate poll
  types.forEach(poll);

  timer = setInterval(() => {
    types.forEach(poll);
  }, POLL_INTERVAL);
}

export function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function onSensorData(cb) {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}
