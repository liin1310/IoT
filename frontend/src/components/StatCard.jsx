import React from 'react';

export default function StatCard({title, value, unit, small}){
  return (
    <div style={{background:'#0d1a23',padding:14,borderRadius:12,minHeight:96,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:12,color:'#9fb4d1'}}>{title}</div>
        <div style={{fontSize:12,color:'#7fbf7a'}}>{small || ''}</div>
      </div>
      <div style={{fontSize:26,fontWeight:800,marginTop:8}}>{value} {unit}</div>
    </div>
  );
}
