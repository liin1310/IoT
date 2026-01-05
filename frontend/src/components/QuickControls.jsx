import React from 'react';

function Toggle({checked, onChange}){
  return (
    <label style={{display:'inline-block',width:44,height:24,background: checked? '#0a84ff' : '#2f3b45',borderRadius:14,position:'relative'}}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{display:'none'}} />
      <span style={{position:'absolute',left: checked? 22:4,top:3,width:18,height:18,background:'#fff',borderRadius:18,transition:'left 0.15s'}} />
    </label>
  );
}

export default function QuickControls({controls, onToggle}){
  return (
    <div style={{background:'#0d1a23',padding:14,borderRadius:12}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Điều khiển nhanh</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {controls.map(c=> (
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{c.title}</div>
              <div style={{fontSize:12,color:'#9fb4d1'}}>{c.desc}</div>
            </div>
            <Toggle checked={c.state === 'ON'} onChange={()=>onToggle(c)} />
          </div>
        ))}
      </div>
    </div>
  );
}
