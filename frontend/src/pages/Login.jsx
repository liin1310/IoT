import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../auth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (isRegister) {
      if (!username || !password || !email) { setError('Vui lòng điền đầy đủ thông tin đăng ký'); return; }
      try {
        await register({ username, password, email });
        setInfo('Đăng ký thành công. Vui lòng đăng nhập.');
        setIsRegister(false);
        setPassword('');
      } catch (ex) {
        setError(ex?.message || 'Đăng ký thất bại');
      }
      return;
    }

    // Login flow
    if (!username || !password) { setError('Vui lòng nhập tên và mật khẩu'); return; }
    try {
      await login({ username, password });
      nav('/dashboard');
    } catch (ex) {
      setError(ex?.message || 'Đăng nhập thất bại');
    }
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

            {isRegister && (
              <div className="form-row">
                <label className="form-label">Email</label>
                <input className="form-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@domain.com" />
              </div>
            )}

            <div className="forgot">Quên mật khẩu?</div>

            {error && <div style={{color:'#ff6b6b',marginTop:8}}>{error}</div>}
            {info && <div style={{color:'#7ad394',marginTop:8}}>{info}</div>}

            <button type="submit" className="primary-btn">
              {isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </form>

          <div className="or-row">HOẶC {isRegister ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'} VỚI</div>
          <div className="social-row">
            <button className="social-btn">🌐 Google</button>
            <button className="social-btn"> Apple</button>
          </div>

          <div className="register">
            {isRegister ? (
              <span>
                Đã có tài khoản? <a href="#" onClick={(e)=>{e.preventDefault(); setIsRegister(false); setError(''); setInfo('');}}>Quay lại đăng nhập</a>
              </span>
            ) : (
              <span>
                Chưa có tài khoản? <a href="#" onClick={(e)=>{e.preventDefault(); setIsRegister(true); setError(''); setInfo('');}}>Đăng ký ngay</a>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
