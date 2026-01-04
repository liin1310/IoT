import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav(){
  return (
    <nav style={{position:'fixed',left:0,right:0,bottom:0,background:'#071726',borderTop:'1px solid #122230',display:'flex',justifyContent:'space-around',padding:'10px 0'}}>
      <NavLink to="/dashboard" style={({isActive})=>({color:isActive? '#0a84ff':'#9fb4d1',textDecoration:'none'})}>Trang chủ</NavLink>
      <NavLink to="/sensors" style={({isActive})=>({color:isActive? '#0a84ff':'#9fb4d1',textDecoration:'none'})}>Dữ liệu</NavLink>
      <a href="#" style={{color:'#9fb4d1',textDecoration:'none'}}>Thiết bị</a>
      <a href="#" style={{color:'#9fb4d1',textDecoration:'none'}}>Tự động</a>
    </nav>
  );
}
