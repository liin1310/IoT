import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Layout from './components/Layout';
import AlarmPopup from './components/AlarmPopup';
import { 
  initializeFCM, 
  registerFCMToken, 
  onForegroundMessage,
  requestNotificationPermission,
  retryPendingTokens
} from './services/fcmService';
import './utils/fcmDebug';

function App() {
  const isAuth = !!localStorage.getItem('token');
  const [alarmPopup, setAlarmPopup] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (!isAuth) return;

    let unsubscribe = null;

    const setupFCM = async () => {
      try {
        const granted = await requestNotificationPermission();
        if (!granted) {
          console.warn('Người dùng chưa cấp quyền thông báo');
          return;
        }

        if (!initializeFCM()) {
          console.warn('Không thể khởi tạo FCM');
          return;
        }
        const token = await registerFCMToken();
        if (!token) {
          console.warn('Không thể lấy FCM token');
          return;
        }

        console.log('FCM đã sẵn sàng, token:', token);

        retryPendingTokens();
        unsubscribe = onForegroundMessage((payload) => {
          console.log('Nhận thông báo foreground:', payload);
          if (payload.data?.type === 'ALARM') {
            const title = payload.notification?.title || 'BÁO ĐỘNG KHẨN CẤP';
            const message = payload.notification?.body || 'Có cảnh báo từ hệ thống!';
            
            setAlarmPopup({
              isOpen: true,
              title,
              message
            });
          }
        });
      } catch (error) {
        console.error('Lỗi khởi tạo FCM:', error);
      }
    };

    setupFCM();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuth]);

  return (
    <BrowserRouter>
      <AlarmPopup
        isOpen={alarmPopup.isOpen}
        onClose={() => setAlarmPopup({ ...alarmPopup, isOpen: false })}
        title={alarmPopup.title}
        message={alarmPopup.message}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route element={isAuth ? <Layout /> : <Navigate to="/login" /> }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sensors" element={<Sensors />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
