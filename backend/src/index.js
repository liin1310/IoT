// index.js
require('dotenv').config();
const mqttClient = require('./mqttClient');
const { connect } = require('./db');

async function start() {
  const db = await connect();
  const col = db.collection('sensor_data');

  const topic = process.env.MQTT_TOPIC || 'iot/sensor/#';
  mqttClient.on('connect', () => {
    console.log('Backend connected to MQTT, subscribing', topic);
    mqttClient.subscribe(topic, err => {
      if (err) console.error('Subscribe error', err);
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const str = message.toString();
      const data = JSON.parse(str);
      // bổ sung thông tin topic, timestamp server
      data._topic = topic;
      data._receivedAt = new Date();
      const res = await col.insertOne(data);
      console.log('Inserted', res.insertedId, data);
    } catch (err) {
      console.error('Message handling error', err, message.toString());
    }
  });

  mqttClient.on('error', err => console.error('MQTT error', err));
}

start().catch(console.error);
