import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!username || !password) { setError('Vui lòng nhập tên và mật khẩu'); return; }
    localStorage.setItem('iot_token', 'mock-token');
    nav('/dashboard');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-inner">
          <div className="app-icon">🏠</div>
          <h1 className="login-title">Chào mừng quay trở lại</h1>
          <div className="login-sub">Điều khiển ngôi nhà thông minh của bạn</div>

          <form onSubmit={submit} style={{marginTop:18}}>
            <div className="form-row">
              <label className="form-label">Tên đăng nhập</label>
              <input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="email@domain.com" />
            </div>

            <div className="form-row">
              <label className="form-label">Mật khẩu</label>
              <input type="password" className="form-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu" />
            </div>

            <div className="forgot">Quên mật khẩu?</div>

            {error && <div style={{color:'#ff6b6b',marginTop:8}}>{error}</div>}

            <button type="submit" className="primary-btn">Đăng nhập</button>
          </form>

          <div className="or-row">HOẶC ĐĂNG NHẬP VỚI</div>
          <div className="social-row">
            <button className="social-btn">🌐 Google</button>
            <button className="social-btn"> Apple</button>
          </div>

          <div className="register">Chưa có tài khoản? <a href="#">Đăng ký ngay</a></div>
        </div>
      </div>
    </div>
  );
}
