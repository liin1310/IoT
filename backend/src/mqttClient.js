// mqttClient.js
const mqtt = require('mqtt');
require('dotenv').config();

const url = process.env.MQTT_URL || 'mqtts://2855c0cbdaa243e19e19b5b00d6dcc25.s1.eu.hivemq.cloud:8883';
const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000
});



module.exports = client;
