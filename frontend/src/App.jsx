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
import './utils/fcmDebug'; // Import để load debug function vào window

function App() {
  const isAuth = !!localStorage.getItem('token');
  const [alarmPopup, setAlarmPopup] = useState({ isOpen: false, title: '', message: '' });

  // Khởi tạo FCM khi user đã đăng nhập
  useEffect(() => {
    if (!isAuth) return;

    let unsubscribe = null;

    const setupFCM = async () => {
      try {
        // Yêu cầu quyền thông báo
        const granted = await requestNotificationPermission();
        if (!granted) {
          console.warn('Người dùng chưa cấp quyền thông báo');
          return;
        }

        // Khởi tạo FCM
        if (!initializeFCM()) {
          console.warn('Không thể khởi tạo FCM');
          return;
        }

        // Đăng ký và lưu token (đợi hoàn thành)
        const token = await registerFCMToken();
        if (!token) {
          console.warn('Không thể lấy FCM token');
          return;
        }

        console.log('FCM đã sẵn sàng, token:', token);

        // Retry pending tokens nếu có
        retryPendingTokens();

        // Lắng nghe thông báo khi app đang mở (sau khi token đã đăng ký)
        unsubscribe = onForegroundMessage((payload) => {
          console.log('Nhận thông báo foreground:', payload);
          
          // Kiểm tra nếu là ALARM
          if (payload.data?.type === 'ALARM') {
            const title = payload.notification?.title || '🚨 BÁO ĐỘNG KHẨN CẤP';
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

    // Cleanup khi unmount hoặc logout
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
