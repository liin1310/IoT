import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar(){
  return (
    <aside style={{width:220,background:'#071726',padding:18,borderRadius:12,color:'#fff',height:'calc(100vh - 56px)',boxSizing:'border-box',position:'sticky',top:16}}>
      <div style={{fontWeight:800,fontSize:18,marginBottom:18}}>My Home</div>
      <nav style={{display:'flex',flexDirection:'column',gap:8}}>
        <NavLink to="/dashboard" style={({isActive})=>({padding:10,borderRadius:8,background:isActive? '#0b3850':'transparent',color:'#fff',textDecoration:'none'})}>Dashboard</NavLink>
        <NavLink to="/sensors" style={({isActive})=>({padding:10,borderRadius:8,background:isActive? '#0b3850':'transparent',color:'#fff',textDecoration:'none'})}>Sensors</NavLink>
        <a href="#" onClick={()=>{localStorage.removeItem('iot_token'); window.location.href='/login'}} style={{padding:10,borderRadius:8,display:'block',color:'#fff',textDecoration:'none'}}>Logout</a>
      </nav>
    </aside>
  );
}
