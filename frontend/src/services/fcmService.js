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
      console.log('FCM Token:', fcmToken);
      // Lưu token vào localStorage để dùng sau
      localStorage.setItem('fcmToken', fcmToken);
      
      // Gọi API để lưu token vào Backend
      await saveTokenToBackend(fcmToken);
      
      return fcmToken;
    } else {
      console.warn('Không thể lấy FCM Token. Có thể người dùng chưa cấp quyền.');
      return null;
    }
  } catch (error) {
    console.error('Lỗi đăng ký FCM Token:', error);
    return null;
  }
}

// Lưu FCM Token vào Backend
async function saveTokenToBackend(token) {
  const username = localStorage.getItem('username');
  
  if (!username) {
    console.warn('Chưa đăng nhập, không thể lưu FCM token');
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
      console.log('Đã lưu FCM Token vào Backend:', data);
    } else {
      console.error('Lỗi lưu FCM Token vào Backend:', await response.text());
    }
  } catch (error) {
    console.error('Lỗi gọi API save-fcm-token:', error);
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


