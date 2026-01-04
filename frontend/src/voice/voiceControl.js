// Lightweight voice control helper using Web Speech API
// Exports: startRecognition(onResult), stopRecognition()

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recog = null;

export function startRecognition(onTranscript) {
  if (!SpeechRecognition) {
    alert('Trình duyệt không hỗ trợ Web Speech API');
    return;
  }

  if (recog) return;

  recog = new SpeechRecognition();
  recog.lang = 'vi-VN';
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    onTranscript && onTranscript(text);
    const intent = parseCommand(text);
    window.dispatchEvent(new CustomEvent('voice-transcript', { detail: { text, intent } }));
  };

  recog.onerror = (e) => {
    console.warn('Speech error', e);
    window.dispatchEvent(new CustomEvent('voice-command-result', { detail: { ok: false, message: e.error } }));
  };

  recog.onend = () => {
    // if user didn't explicitly stop, clear instance so it can be restarted
    recog = null;
    window.dispatchEvent(new CustomEvent('voice-listen-ended'));
  };

  recog.start();
  window.dispatchEvent(new CustomEvent('voice-listen-started'));
}

export function stopRecognition() {
  if (!recog) return;
  try { recog.stop(); } catch { }
  recog = null;
  window.dispatchEvent(new CustomEvent('voice-listen-ended'));
}

export function parseCommand(text) {
  const t = (text || '').toLowerCase();
  const intent = { device: null, state: null };

  if (t.includes('bật') || t.includes('bật lên') || t.includes('on')) intent.state = 'ON';
  if (t.includes('tắt') || t.includes('off')) intent.state = 'OFF';

  if (t.includes('đèn') || t.includes('ánh sáng') || t.includes('light')) intent.device = 'light';
  if (t.includes('quạt') || t.includes('fan')) intent.device = 'fan';
  if (t.includes('cửa') || t.includes('door')) intent.device = 'door';
  if (t.includes('chuông') || t.includes('báo động') || t.includes('alarm')) intent.device = 'alarm';

  return intent;
}
import { apiFetch } from '../api';

export async function sendCommandFromText(text) {
  return await handleCommand(text);
}

async function handleCommand(text) {
  const cmd = parseCommand(text);
  if (!cmd.device) {
    window.dispatchEvent(new CustomEvent('voice-command-result', { detail: { ok: false, message: 'Không xác định thiết bị', text } }));
    return { ok: false, message: 'Không xác định thiết bị' };
  }

    try {
    let res = null;
    if (cmd.device === 'alarm') {
      // stop alarm endpoint
      res = await apiFetch('/api/device/alarm/stop', { method: 'POST' });
    } else {
      const body = JSON.stringify({ State: cmd.state || 'ON' });
      const path = cmd.device === 'light' ? '/api/device/light' : (cmd.device === 'fan' ? '/api/device/fan' : (cmd.device === 'door' ? '/api/device/door' : '/'));
      res = await apiFetch(path, { method: 'POST', body });
    }

    if (res && (res.ok || res.status === 200 || res.status === 204)) {
      const detail = { ok: true, message: `Gửi lệnh ${cmd.device} ${cmd.state||''}`, text };
      window.dispatchEvent(new CustomEvent('voice-command-result', { detail }));
      return detail;
    } else {
      const detail = { ok: false, message: 'Lỗi khi gửi lệnh', text };
      window.dispatchEvent(new CustomEvent('voice-command-result', { detail }));
      return detail;
    }
  } catch (ex) {
    // network or backend not available: still notify the UI
    const detail = { ok: false, message: ex?.message || String(ex), text };
    window.dispatchEvent(new CustomEvent('voice-command-result', { detail }));
    return detail;
  }
}
