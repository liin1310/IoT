iot-project/
├── backend/
│   ├── package.json
│   ├── .env
│   ├── src/
│   │   ├── index.js              # entry
│   │   ├── mqtt/
│   │   │   ├── mqttClient.js     # kết nối broker
│   │   │   ├── sensorListener.js # subscribe sensor
│   │   │   ├── fireListener.js   # cảnh báo cháy
│   │   │   └── deviceControl.js  # publish bật/tắt
│   │   ├── api/
│   │   │   ├── deviceRoute.js    # REST API điều khiển
│   │   │   ├── sensorRoute.js    # API đọc dữ liệu
│   │   │   └── voiceRoute.js     # API giọng nói → MQTT
│   │   ├── ws/
│   │   │   └── gateway.js        # MQTT → WebSocket
│   │   ├── db.js
│   │   └── utils/
│   └── README.md
│
├── mock-sensor/
│   ├── src/
│   │   ├── publisher.js         # DHT11 + LDR
│   │   ├── fire-simulator.js    # cảnh báo cháy giả lập
│   │   └── commandTester.js     # test nhận lệnh bật/tắt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SensorCard.jsx
│   │   │   ├── FireAlert.jsx
│   │   │   └── DeviceSwitch.jsx # bật/tắt quạt/đèn
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FirePage.jsx
│   │   │   └── VoicePage.jsx
│   │   └── ws.js                # kết nối WebSocket
│
├── voice-control/
│   ├── speech-to-text.js        # Web Speech API (browser) hoặc API backend
│   └── intent-mapping.js        # ánh xạ giọng nói → lệnh MQTT
│
├── docs/
│   ├── data-format.md
│   ├── topics.md                # phân loại topic
│   ├── architecture.md          # mô tả hệ thống
│   └── api-spec.md
