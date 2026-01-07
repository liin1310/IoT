// Service Worker cho Firebase Cloud Messaging
// File này sẽ nhận thông báo khi tab web bị đóng
// Version: 1.0.0 - Update này để force refresh Service Worker

const SW_VERSION = '1.0.0';
console.log(`[firebase-messaging-sw.js] Service Worker version ${SW_VERSION} đã load`);

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

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

// Khởi tạo Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase đã được khởi tạo');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Lỗi khởi tạo Firebase:', error);
}

// Lấy instance của messaging
const messaging = firebase.messaging();
console.log('[firebase-messaging-sw.js] Messaging instance đã sẵn sàng');

// Xử lý thông báo khi app ở background (tab đóng)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Thông báo';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/vite.svg', // Icon của bạn
    badge: '/vite.svg',
    data: payload.data || {},
    vibrate: [200, 100, 200, 100, 200, 100, 200] // Rung khi có ALARM
  };

  // Kiểm tra nếu là ALARM thì thêm âm thanh và priority cao
  if (payload.data?.type === 'ALARM') {
    notificationOptions.requireInteraction = true; // Bắt buộc người dùng tương tác
    notificationOptions.silent = false; // Phát âm thanh
    notificationOptions.tag = 'alarm'; // Tag để nhóm thông báo
    notificationOptions.priority = 'high'; // Độ ưu tiên cao
    notificationOptions.renotify = true; // Cho phép thông báo lại
  }

  console.log('[firebase-messaging-sw.js] Showing notification:', notificationTitle);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  // Mở hoặc focus vào tab của ứng dụng
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu đã có tab mở, focus vào đó
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa có tab, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});


