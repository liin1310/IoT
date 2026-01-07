import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { API_BASE } from '../api';

// ⚠️ QUAN TRỌNG: Bạn cần thay thế các giá trị này bằng Firebase config của bạn
// Lấy từ Firebase Console > Project Settings > Your apps > Web app config
const firebaseConfig = {
  apiKey: "AIzaSyAvbKWE4cfIZHdMDwubjvEY8aYBanqHHHQ",
  authDomain: "smarthome-alertfire.firebaseapp.com",
  projectId: "smarthome-alertfire",
  storageBucket: "smarthome-alertfire.firebasestorage.app",
  messagingSenderId: "16022525154",
  appId: "1:16022525154:web:f1f6674dab383c2fafbabb"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

let messaging = null;
let fcmToken = null;

// Khởi tạo messaging (chỉ khi browser hỗ trợ)
export function initializeFCM() {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      messaging = getMessaging(app);
      return true;
    } else {
      console.warn('Browser không hỗ trợ Push Notifications');
      return false;
    }
  } catch (error) {
    console.error('Lỗi khởi tạo FCM:', error);
    return false;
  }
}

// Đăng ký Service Worker và lấy FCM Token
export async function registerFCMToken() {
  if (!messaging) {
    console.warn('FCM chưa được khởi tạo');
    return null;
  }

  try {
    // Đăng ký Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker đã đăng ký:', registration);

    // Lấy FCM Token
    fcmToken = await getToken(messaging, {
      vapidKey: "BA-xqNTaXzvjvQQXrO70xWoXfntmgY02T81o7nfov_fmGRXRFg6cJhNRK2yDfDYabn3OHsslex2cgjPqBq2ZjtU", 
      serviceWorkerRegistration: registration
    });

    if (fcmToken) {
      console.log('✅ FCM Token đã lấy được:', fcmToken);
      console.log('📋 Token (copy để test):', fcmToken);
      // Lưu token vào localStorage để dùng sau
      localStorage.setItem('fcmToken', fcmToken);
      
      // Gọi API để lưu token vào Backend
      await saveTokenToBackend(fcmToken);
      
      return fcmToken;
    } else {
      console.warn('❌ Không thể lấy FCM Token. Có thể người dùng chưa cấp quyền.');
      return null;
    }
  } catch (error) {
    console.error('Lỗi đăng ký FCM Token:', error);
    return null;
  }
}

// Lưu FCM Token vào Backend với retry logic
async function saveTokenToBackend(token, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 giây

  const username = localStorage.getItem('username');
  
  if (!username) {
    console.warn('Chưa đăng nhập, không thể lưu FCM token');
    // Lưu vào queue để retry sau
    const pendingTokens = JSON.parse(localStorage.getItem('pendingFcmTokens') || '[]');
    if (!pendingTokens.includes(token)) {
      pendingTokens.push(token);
      localStorage.setItem('pendingFcmTokens', JSON.stringify(pendingTokens));
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/save-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        Username: username,
        FcmToken: token
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Đã lưu FCM Token vào Backend thành công:', data);
      
      // Xóa token khỏi pending queue nếu có
      const pendingTokens = JSON.parse(localStorage.getItem('pendingFcmTokens') || '[]');
      const filtered = pendingTokens.filter(t => t !== token);
      localStorage.setItem('pendingFcmTokens', JSON.stringify(filtered));
    } else {
      const errorText = await response.text();
      console.error('❌ Lỗi lưu FCM Token vào Backend:', response.status, errorText);
      
      // Retry nếu chưa vượt quá số lần thử
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retry lưu FCM token (${retryCount + 1}/${MAX_RETRIES}) sau ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          saveTokenToBackend(token, retryCount + 1);
        }, RETRY_DELAY);
      } else {
        // Lưu vào queue để retry sau khi user login lại
        const pendingTokens = JSON.parse(localStorage.getItem('pendingFcmTokens') || '[]');
        if (!pendingTokens.includes(token)) {
          pendingTokens.push(token);
          localStorage.setItem('pendingFcmTokens', JSON.stringify(pendingTokens));
          console.warn('⚠️ Đã lưu token vào queue để retry sau');
        }
      }
    }
  } catch (error) {
    console.error('Lỗi gọi API save-fcm-token:', error);
    
    // Retry nếu chưa vượt quá số lần thử
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retry lưu FCM token (${retryCount + 1}/${MAX_RETRIES}) sau ${RETRY_DELAY}ms...`);
      setTimeout(() => {
        saveTokenToBackend(token, retryCount + 1);
      }, RETRY_DELAY);
    } else {
      // Lưu vào queue
      const pendingTokens = JSON.parse(localStorage.getItem('pendingFcmTokens') || '[]');
      if (!pendingTokens.includes(token)) {
        pendingTokens.push(token);
        localStorage.setItem('pendingFcmTokens', JSON.stringify(pendingTokens));
        console.warn('⚠️ Đã lưu token vào queue để retry sau');
      }
    }
  }
}

// Retry pending tokens khi user login
export function retryPendingTokens() {
  const pendingTokens = JSON.parse(localStorage.getItem('pendingFcmTokens') || '[]');
  if (pendingTokens.length > 0) {
    console.log(`🔄 Retry ${pendingTokens.length} pending FCM tokens...`);
    pendingTokens.forEach(token => {
      saveTokenToBackend(token);
    });
  }
}

// Lắng nghe thông báo khi app đang mở (foreground)
export function onForegroundMessage(callback) {
  if (!messaging) {
    console.warn('FCM chưa được khởi tạo');
    return () => {}; // Return empty unsubscribe function
  }

  return onMessage(messaging, (payload) => {
    console.log('Nhận thông báo foreground:', payload);
    callback(payload);
  });
}

// Lấy FCM Token hiện tại
export function getCurrentFCMToken() {
  return fcmToken || localStorage.getItem('fcmToken');
}

// Yêu cầu quyền thông báo từ người dùng
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser không hỗ trợ Notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Người dùng đã từ chối thông báo');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}


