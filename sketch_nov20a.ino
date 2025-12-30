#include <Adafruit_Sensor.h> 
#include <DHT.h>
#include <DHT_U.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// SET WIFI
const char* ssid = "4D"; //Tên wifi kết nối(SỬA KHI DOWNLOAD VỀ)
const char* password = "777788884"; //Mật khẩu wifi
// THÔNG TIN HIVEMQ CLOUD
const char* mqtt_server   = "2855c0cbdaa243e19e19b5b00d6dcc25.s1.eu.hivemq.cloud";  // URL
const char* mqtt_username = "test-data";           // Username
const char* mqtt_password = "Linh2612@";

#define MQTT_PORT 8883 // Cổng server mqtt
#define DHT_PIN 13 // Chân DATA của DHT11 (D13) (THAY ĐỔI NẾU CẮM SANG CHÂN KHÁC)
#define DHT_TYPE DHT11
#define LED_PIN 15 //Chân data của LED (chân dài) (THAY ĐỔI NẾU CẮM SANG CHÂN KHÁC)

#define TOPIC_TEMP "iot/sensor/temperature"
#define TOPIC_HUM "iot/sensor/humidity"
#define TOPIC_LED  "iot/sensor/led/control"

DHT_Unified dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long lastSend = 0;
const long interval = 5000;   // Gửi dữ liệu mỗi 5 giây


void setup() {
  Serial.begin(115200); 
  pinMode(LED_PIN, OUTPUT); //
  digitalWrite(LED_PIN, LOW); //Set đèn sáng khi khởi động
  dht.begin(); //Bắt đầu khởi tạo

  connectWiFi();
  
  // Cấu hình TLS cho HiveMQ Cloud
  espClient.setInsecure();       // Bỏ qua xác thực cert
  client.setServer(mqtt_server, MQTT_PORT);
  // client.setCallback(callback);
  
  Serial.println("=== Hệ thống sẵn sàng ===");
}
   

void loop() {
  if(!client.connected()){ //Kết nối lại nếu kết nối thất bại
    reconnectMQTT();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastSend > interval) {
    lastSend = now;
    readAndSendDHT();    // Đọc DHT11 và gửi lên HiveMQ
    client.setCallback(callback);
  }
}

// =============    CÁC HÀM HỖ TRỢ  ============================
void connectWiFi() {
  Serial.print("Đang kết nối WiFi ");
  Serial.print(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi đã kết nối!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Đang kết nối HiveMQ Cloud...");
    if (client.connect("ESP32_Client", mqtt_username, mqtt_password)) {
      Serial.println(" Đã kết nối MQTT!");
      client.subscribe(TOPIC_LED);
      // client.publish(TOPIC_LED,""); 
    } else {
      Serial.print(" Lỗi, rc=");
      Serial.print(client.state());
      Serial.println(" Thử lại sau 5 giây...");
      delay(5000);
    }
  }
}
void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];

  if (String(topic) == TOPIC_LED) {
    int value;
    if (msg == "ON") value=100;
    else if (msg == "OFF") value=0;
    else value = msg.toInt();
    setBrightnessPercent(value); //Chỉnh độ sáng theo %
  }
}
void readAndSendDHT() {
  sensors_event_t event;
  float temp = -999;
  float hum  = -999;

  dht.temperature().getEvent(&event);
  if (!isnan(event.temperature)) {
    temp = event.temperature;
    client.publish(TOPIC_TEMP, String(temp, 1).c_str());
    Serial.printf("{ Nhiệt độ: %.1f°C ,", temp);
  }

  dht.humidity().getEvent(&event);
  if (!isnan(event.relative_humidity)) {
    hum = event.relative_humidity;
    client.publish(TOPIC_HUM, String(hum, 1).c_str());
    Serial.printf(" Độ ẩm: %.1f%% }\n", hum);
  }

  if (temp == -999 || hum == -999) {
    Serial.println("Lỗi đọc cảm biến DHT11!");
  }
}
// Hàm chỉnh độ sáng
void setBrightnessPercent(int percent) {
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  int pwmValue = map(percent, 0, 100, 0, 255);
  analogWrite(LED_PIN, pwmValue);
}
