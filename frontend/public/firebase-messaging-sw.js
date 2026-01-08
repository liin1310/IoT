
const SW_VERSION = '1.0.0';
console.log(`[firebase-messaging-sw.js] Service Worker version ${SW_VERSION} đã load`);

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAvbKWE4cfIZHdMDwubjvEY8aYBanqHHHQ",
  authDomain: "smarthome-alertfire.firebaseapp.com",
  projectId: "smarthome-alertfire",
  storageBucket: "smarthome-alertfire.firebasestorage.app",
  messagingSenderId: "16022525154",
  appId: "1:16022525154:web:f1f6674dab383c2fafbabb"
};


try {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase đã được khởi tạo');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Lỗi khởi tạo Firebase:', error);
}

const messaging = firebase.messaging();
console.log('[firebase-messaging-sw.js] Messaging instance đã sẵn sàng');

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Thông báo';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/vite.svg', 
    badge: '/vite.svg',
    data: payload.data || {},
    vibrate: [200, 100, 200, 100, 200, 100, 200]
  };

  if (payload.data?.type === 'ALARM') {
    notificationOptions.requireInteraction = true; 
    notificationOptions.silent = false; 
    notificationOptions.tag = 'alarm'; 
    notificationOptions.priority = 'high'; 
    notificationOptions.renotify = true; 
  }

  console.log('[firebase-messaging-sw.js] Showing notification:', notificationTitle);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});


