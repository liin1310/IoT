require('dotenv').config();
const mqtt = require('mqtt');

const url = process.env.MQTT_URL;
const topic = process.env.MQTT_TOPIC || 'iot/sensor/room1';
const interval = parseInt(process.env.PUBLISH_INTERVAL_MS || '5000', 10);

const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: 'mock-sensor-' + Math.random().toString(16).substr(2, 8) // đảm bảo clientId unique
});

client.on('connect', () => {
  console.log('Mock sensor connected to MQTT broker:', url);

  setInterval(() => {
    const payload = {
      temp: (20 + Math.random() * 10).toFixed(1),    // 20.0 - 30.0
      humidity: Math.floor(40 + Math.random() * 40), // 40 - 80 %
      light: Math.floor(200 + Math.random() * 800),  // arbitrary lux value
      timestamp: new Date().toISOString()
    };
    const str = JSON.stringify(payload);

    client.publish(topic, str, { qos: 0 }, err => {
      if (err) console.error('Publish error', err);
      else console.log('Published →', topic, str);
    });
  }, interval);
});

client.on('error', err => {
  console.error('MQTT error', err);
});
