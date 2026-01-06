import React from 'react';

export default function AlertCard({visible, onAction}){
  if (!visible) return null;
  return (
    <div style={{display:'flex',gap:16,background:'#3b0a0a',padding:16,borderRadius:12,alignItems:'center'}}>
      <div style={{flex:1}}>
        <div style={{fontSize:12,color:'#ffb3b3',fontWeight:700}}>CẢNH BÁO KHẨN CẤP</div>
        <div style={{fontSize:20,fontWeight:800,marginTop:6}}>Phát hiện nhiệt độ tăng cao bất thường!</div>
        <div style={{color:'#ffdede',marginTop:6}}>Có cháy tại khu vực cảm biến!</div>
        <div style={{marginTop:12}}>
          <button onClick={onAction} style={{background:'#ff4b4b',border:'none',color:'#fff',padding:'10px 14px',borderRadius:10}}>Tắt alarm</button>
        </div>
      </div>
      <div style={{width:120,height:80,background:'linear-gradient(90deg,#7a0b0b,#ff3b3b)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:56,height:56,background:'#fff1f1',borderRadius:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#b30000',fontWeight:800}}>!</div>
      </div>
    </div>
  );
}
