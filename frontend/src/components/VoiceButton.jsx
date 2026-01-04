import React from 'react';
import { Mic } from 'lucide-react';

export default function VoiceButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        background: '#0a84ff',
        border: 'none',
        boxShadow: '0 8px 24px rgba(10,132,255,0.24)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <Mic size={28} />
    </button>
  );
}
