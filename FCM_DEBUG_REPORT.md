# BÁO CÁO PHÂN TÍCH LOGIC CẢNH BÁO CHÁY KHI TAB ĐÓNG

## 📋 TỔNG QUAN LUỒNG HOẠT ĐỘNG

### 1. Khi Tab Đang Mở (Foreground)
```
Backend phát hiện cháy 
  → Gửi FCM với data.type = "ALARM"
  → Frontend nhận qua onMessage()
  → Hiển thị AlarmPopup + âm thanh
```

### 2. Khi Tab Đã Đóng (Background)
```
Backend phát hiện cháy
  → Gửi FCM với data.type = "ALARM"  
  → Service Worker (firebase-messaging-sw.js) nhận qua onBackgroundMessage()
  → Hiển thị Notification hệ thống
```

---

## 🔍 CÁC ĐIỂM GỬI FCM TRONG BACKEND

### 1. **MqttWorker.cs** - Khi nhận MQTT message
- **Trigger**: `FireStatus = 1.0` hoặc `Gas >= 2000.0`
- **Gửi ngay lập tức** khi nhận message
- ✅ Có `data.type = "ALARM"`

### 2. **SensorDataController.ReceiveData()** - Khi POST data
- **Trigger**: `FireStatus = 1.0` hoặc `Gas >= 2000.0`
- **Gửi ngay lập tức** khi POST
- ✅ Có `data.type = "ALARM"`

### 3. **SensorDataController.CheckFire()** - Khi polling
- **Trigger**: `isFire == true` (trong 60 giây gần nhất)
- **Gửi định kỳ**: 
  - Lần đầu khi chuyển từ `false` → `true`
  - Sau đó mỗi 30 giây khi vẫn còn cháy
- ✅ Có `data.type = "ALARM"`

---

## ⚠️ VẤN ĐỀ PHÁT HIỆN

### 🔴 VẤN ĐỀ 1: MqttWorker không filter token null
**File**: `MqttWorker.cs:183`
```csharp
var tokens = await context.UserDevices.Select(d => d.FcmToken).ToListAsync();
```
**Vấn đề**: Không filter `!string.IsNullOrEmpty(d.FcmToken)` như trong `SensorDataController`
**Hậu quả**: Có thể gửi FCM với token null → lỗi

### 🔴 VẤN ĐỀ 2: Static variables trong CheckFire
**File**: `SensorDataController.cs:75-76`
```csharp
private static bool _lastFireState = false;
private static DateTime _lastFireNotificationTime = DateTime.MinValue;
```
**Vấn đề**: Nếu deploy multiple instances, mỗi instance có state riêng → có thể gửi duplicate notifications
**Giải pháp**: Dùng distributed cache (Redis) hoặc database để track state

### 🟡 VẤN ĐỀ 3: Service Worker có thể không update
**File**: `firebase-messaging-sw.js`
**Vấn đề**: Service Worker được cache, nếu code thay đổi có thể không update ngay
**Giải pháp**: Cần unregister và register lại

### 🟡 VẤN ĐỀ 4: FCM Token có thể không được lưu
**File**: `fcmService.js:saveTokenToBackend()`
**Vấn đề**: Nếu API fail, token không được lưu → backend không thể gửi FCM
**Giải pháp**: Retry logic hoặc queue để lưu lại

---

## ✅ CÁC ĐIỂM ĐÚNG

1. ✅ Service Worker được đăng ký đúng cách
2. ✅ FCM config đúng
3. ✅ `data.type = "ALARM"` được set đúng
4. ✅ Service Worker xử lý `onBackgroundMessage` đúng
5. ✅ Có try-catch để tránh crash
6. ✅ CORS đã được cấu hình

---

## 🧪 HƯỚNG DẪN TEST CHI TIẾT

### **TEST 1: Kiểm tra FCM Setup**

1. **Mở app và đăng nhập**
2. **Mở DevTools Console**
3. **Gõ**: `fcmDebug()`
4. **Kiểm tra**:
   - ✅ Service Worker đã đăng ký
   - ✅ Notification Permission = "granted"
   - ✅ Có FCM Token trong localStorage
   - ✅ Username và Auth Token có đúng

5. **Kiểm tra Database**:
   ```sql
   SELECT * FROM "UserDevices" WHERE "Username" = 'your_username';
   ```
   - Phải có record với `FcmToken` không null

### **TEST 2: Test FCM từ Firebase Console**

1. **Copy FCM Token** từ Console (log `📋 Token (copy để test):`)
2. **Vào Firebase Console** → Cloud Messaging → Send test message
3. **Chọn "Single device"** → dán token
4. **Nhập**:
   - Title: `🚨 Test Alarm`
   - Body: `Test notification khi tab đóng`
5. **Additional options** → Custom data:
   - Key: `type`
   - Value: `ALARM`
6. **Gửi message**
7. **Đóng tab app** (nhưng giữ browser mở)
8. **Kiểm tra**: Phải nhận notification hệ thống

**Nếu không nhận được**:
- Mở DevTools → Application → Service Workers
- Click vào `firebase-messaging-sw.js` → Inspect
- Xem Console của Service Worker có log không

### **TEST 3: Test Backend gửi FCM khi check-fire**

1. **Đảm bảo có dữ liệu cháy trong DB**:
   ```sql
   INSERT INTO "SensorDataEntries" ("DeviceId", "type", "value", "received_at")
   VALUES (1, 'FireStatus', 1.0, NOW());
   ```

2. **Mở app và đăng nhập** (để FCM token được lưu)

3. **Đóng tab app**

4. **Đợi 2-5 giây** (để frontend polling gọi `/check-fire`)

5. **Kiểm tra Backend logs**:
   - Phải có: `>>> Đã gửi FCM notification tới X thiết bị`
   - Nếu không có: Kiểm tra Firebase đã khởi tạo chưa

6. **Kiểm tra Notification hệ thống**: Phải nhận được

### **TEST 4: Test MQTT Worker gửi FCM**

1. **Gửi MQTT message**:
   - Topic: `home/status/fire`
   - Payload: `WARNING`

2. **Kiểm tra Backend logs**:
   - Phải có: `>>> Đã đẩy thông báo tới toàn bộ thiết bị trong nhà.`

3. **Đóng tab app**

4. **Kiểm tra Notification hệ thống**: Phải nhận được

### **TEST 5: Test khi Browser hoàn toàn đóng**

1. **Đảm bảo Edge có setting**: 
   - Settings → System → "Continue running background apps when Microsoft Edge is closed"

2. **Đóng tất cả cửa sổ Edge**

3. **Gửi test message từ Firebase Console**

4. **Kiểm tra Windows Notification Center**: Phải có notification

---

## 🔧 SỬA CÁC VẤN ĐỀ

### Sửa MqttWorker không filter token null:

```csharp
// Trong MqttWorker.cs:183
var tokens = await context.UserDevices
    .Where(d => !string.IsNullOrEmpty(d.FcmToken))
    .Select(d => d.FcmToken)
    .ToListAsync();
```

### Kiểm tra Service Worker update:

1. DevTools → Application → Service Workers
2. Tick "Update on reload"
3. Unregister service worker cũ
4. Reload trang (Ctrl+F5)

---

## 📊 CHECKLIST DEBUG

- [ ] `fcmDebug()` chạy thành công
- [ ] Service Worker đã đăng ký và ACTIVE
- [ ] Notification Permission = "granted"
- [ ] FCM Token có trong localStorage
- [ ] FCM Token đã lưu vào database
- [ ] Test notification từ Firebase Console hoạt động
- [ ] Backend logs hiển thị "Đã gửi FCM notification"
- [ ] Service Worker Console có log khi nhận message
- [ ] Notification hệ thống hiển thị khi tab đóng
- [ ] Click notification mở lại tab app

---

## 🚨 CÁC TRƯỜNG HỢP KHÔNG NHẬN ĐƯỢC NOTIFICATION

1. **Browser settings chặn notifications**
   - Kiểm tra: Settings → Site permissions → Notifications

2. **Windows settings chặn notifications**
   - Kiểm tra: Settings → System → Notifications

3. **Service Worker không active**
   - DevTools → Application → Service Workers → Unregister → Reload

4. **FCM Token không được lưu vào database**
   - Kiểm tra API `/api/auth/save-fcm-token` có trả về 200 không

5. **Firebase chưa được khởi tạo trên backend**
   - Kiểm tra backend logs: `>>> Firebase initialized via...`

6. **Backend không gửi FCM**
   - Kiểm tra backend logs có lỗi không
   - Kiểm tra database có FCM token không

---

## 📝 LOGS CẦN KIỂM TRA

### Frontend Console:
- `✅ FCM Token đã lấy được: ...`
- `✅ Đã lưu FCM Token vào Backend thành công: ...`
- `FCM đã sẵn sàng, token: ...`

### Backend Console:
- `>>> Firebase initialized via...`
- `>>> Đã gửi FCM notification tới X thiết bị`
- `>>> Đã đẩy thông báo tới toàn bộ thiết bị trong nhà.`

### Service Worker Console:
- `[firebase-messaging-sw.js] Firebase đã được khởi tạo`
- `[firebase-messaging-sw.js] Received background message`
- `[firebase-messaging-sw.js] Showing notification`

