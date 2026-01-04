import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import VoiceButton from './VoiceButton';

export default function Layout(){
  return (
    <div style={{display:'flex',gap:20}}>
      <Sidebar />
      <main style={{flex:1}}>
        <Outlet />
      </main>
      <div className="voice-button"><VoiceButton onClick={()=>alert('Voice control placeholder')} /></div>
    </div>
  );
}
