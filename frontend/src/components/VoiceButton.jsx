import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import {
  startRecognition,
  stopRecognition,
  sendCommandFromText
} from '../voice/voiceControl';

export default function VoiceButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    function onStart() { setListening(true); }
    function onEnd() { setListening(false); }
    function onResult(e) { setLastResult(e.detail); }
    function onTranscript(e) {
      const { text, intent } = e.detail;
      setTranscript(text || '');
      setPending({ text, intent });
      setLastResult(null);
    }

    window.addEventListener('voice-listen-started', onStart);
    window.addEventListener('voice-listen-ended', onEnd);
    window.addEventListener('voice-command-result', onResult);
    window.addEventListener('voice-transcript', onTranscript);

    return () => {
      window.removeEventListener('voice-listen-started', onStart);
      window.removeEventListener('voice-listen-ended', onEnd);
      window.removeEventListener('voice-command-result', onResult);
      window.removeEventListener('voice-transcript', onTranscript);
    };
  }, []);

  function toggle() {
    if (!listening) {
      startRecognition();
    } else {
      stopRecognition();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        onClick={toggle}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: listening ? '#ff3b30' : '#0a84ff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: listening
            ? '0 0 0 6px rgba(255,59,48,0.2)'
            : '0 8px 24px rgba(10,132,255,0.24)',
          transition: 'all .2s ease'
        }}
      >
        {listening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      <div style={{ fontSize: 12, color: '#9fb4d1', marginTop: 6, textAlign: 'center', maxWidth: 220 }}>
        {listening ? (transcript || 'Đang lắng nghe...') : ''}
      </div>

      {pending && (
        <div style={{
          marginTop: 8,
          background: '#071726',
          padding: 8,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.03)',
          maxWidth: 240,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>Nhận diện:</strong> {pending.text}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={async () => {
                const res = await sendCommandFromText(pending.text);
                setLastResult(res);
                setPending(null);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#0a84ff',
                color: '#fff',
                border: 'none'
              }}
            >
              Xác nhận
            </button>
            <button
              onClick={() => {
                setPending(null);
                setTranscript('');
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: 'transparent',
                color: '#9fb4d1',
                border: '1px solid rgba(255,255,255,0.04)'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {!listening && !pending && lastResult && (
        <div style={{ fontSize: 12, color: '#9fb4d1', marginTop: 6, textAlign: 'center' }}>
          {lastResult.ok ? 'Lệnh gửi thành công' : `Lỗi: ${lastResult.message}`}
        </div>
      )}
    </div>
  );
}
