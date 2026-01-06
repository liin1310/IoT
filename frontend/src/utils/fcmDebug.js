// Utility để debug FCM và Service Worker
// Gọi từ Console: window.fcmDebug()

export function fcmDebug() {
  console.log('=== FCM DEBUG INFO ===');
  
  // 1. Kiểm tra Service Worker
  console.log('\n1. Service Worker Status:');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`   - Có ${registrations.length} Service Worker đã đăng ký`);
      registrations.forEach((reg, idx) => {
        console.log(`   - SW #${idx + 1}:`, reg.scope, reg.active ? 'ACTIVE' : 'INACTIVE');
      });
    });
  } else {
    console.log('   ❌ Browser không hỗ trợ Service Worker');
  }

  // 2. Kiểm tra Notification Permission
  console.log('\n2. Notification Permission:');
  if ('Notification' in window) {
    console.log(`   - Permission: ${Notification.permission}`);
  } else {
    console.log('   ❌ Browser không hỗ trợ Notifications');
  }

  // 3. Kiểm tra FCM Token
  console.log('\n3. FCM Token:');
  const token = localStorage.getItem('fcmToken');
  if (token) {
    console.log(`   ✅ Token trong localStorage: ${token.substring(0, 50)}...`);
  } else {
    console.log('   ❌ Không có token trong localStorage');
  }

  // 4. Kiểm tra Username
  console.log('\n4. User Info:');
  const username = localStorage.getItem('username');
  const authToken = localStorage.getItem('token');
  console.log(`   - Username: ${username || 'CHƯA ĐĂNG NHẬP'}`);
  console.log(`   - Auth Token: ${authToken ? 'Có' : 'Không có'}`);

  // 5. Test Service Worker message
  console.log('\n5. Test Service Worker:');
  navigator.serviceWorker.ready.then(registration => {
    console.log('   ✅ Service Worker ready');
    registration.showNotification('Test Notification', {
      body: 'Nếu bạn thấy notification này, Service Worker hoạt động tốt!',
      icon: '/vite.svg',
      tag: 'test'
    }).then(() => {
      console.log('   ✅ Test notification đã được hiển thị');
    }).catch(err => {
      console.error('   ❌ Lỗi hiển thị test notification:', err);
    });
  }).catch(err => {
    console.error('   ❌ Service Worker chưa ready:', err);
  });

  console.log('\n=== KẾT THÚC DEBUG ===');
  console.log('Để test FCM từ Firebase Console:');
  console.log('1. Vào Firebase Console > Cloud Messaging > Send test message');
  console.log('2. Dán FCM token từ trên');
  console.log('3. Thêm Custom data: type = ALARM');
  console.log('4. Gửi và kiểm tra notification');
}

// Export để dùng trong Console
if (typeof window !== 'undefined') {
  window.fcmDebug = fcmDebug;
}

