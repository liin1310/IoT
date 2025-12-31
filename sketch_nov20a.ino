 #include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>

// Cấu hình Wifi và MQTT
const char* ssid = "Liin";
const char* password = "25102004";
const char* mqtt_server = "954aa7485e03459f8a6ba21673896477.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "user1";
const char* mqtt_pass = "Linh13102004";

//Khai báo chân 
#define DHT_TYPE 11
#define MQ2_PIN     32   
#define LED_ALARM_PIN     2
#define LED_LIGHT_PIN     4
#define BUZZER_PIN  15
#define DHT_PIN     13

#define RELAY1_PIN  25 //Giả lập QUẠT
#define RELAY2_PIN  26 //Giả lập Cửa
#define RELAY3_PIN  27
#define RELAY4_PIN  14

//TOPIC
//1. topic gửi dữ liệu (publish)
#define TOPIC_DATA_TEMP   "home/data/temp"
#define TOPIC_DATA_HUMID  "home/data/humid"
#define TOPIC_DATA_GAS    "home/data/gas"
#define TOPIC_STATUS_FIRE "home/status/fire"

//2. topic nhận lệnh điều khiển (subscribe)
#define TOPIC_CMD_FAN   "home/cmd/fan"   // Lệnh: ON/OFF
#define TOPIC_CMD_DOOR    "home/cmd/door"    // Lệnh: OPEN/CLOSE
#define TOPIC_CMD_ALARM  "home/cmd/alarm"  // Lệnh tắt còi 
#define TOPIC_CMD_LIGHT  "home/cmd/light"

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure espClient;
PubSubClient client(espClient);

int gasThreshold = 2000;
float tempThreshold = 45.0; 
unsigned long lastMsg = 0;
bool isAlarmActive = false;   // Trạng thái đang báo động
bool isAlarmSilenced = false; // Trạng thái đã bấm nút tắt còi

// HÀM XỬ LÝ LỆNH TỪ SERVER
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) message += (char)payload[i];
  String strTopic = String(topic);

  Serial.print("Nhận lệnh MQTT ["); Serial.print(strTopic);
  Serial.print("]: "); Serial.println(message);

  // 1. Điều khiển QUẠT (Relay 1)
  if (strTopic == TOPIC_CMD_FAN) {
    if (message == "ON") digitalWrite(RELAY1_PIN, LOW); // low = bật
    else if (message == "OFF") digitalWrite(RELAY1_PIN, HIGH);
  }
  
  // 2. Điều khiển CỬA (Relay 2)
  else if (strTopic == TOPIC_CMD_DOOR) {
    if (message == "OPEN") digitalWrite(RELAY2_PIN, LOW); 
    else if (message == "CLOSE") digitalWrite(RELAY2_PIN, HIGH);
  }

  // 3. Tắt báo động từ Web
  else if (strTopic == TOPIC_CMD_ALARM && message == "OFF") {
    stopAlarm();
  }

  // 4. Điều khiển đèn
  else if (strTopic == TOPIC_CMD_LIGHT) {
    if (message == "ON") {
        digitalWrite(LED_LIGHT_PIN, HIGH); // Bật LED
        Serial.println("-> DA BAT DEN (LED 4)");
    } 
    else if (message == "OFF") {
        digitalWrite(LED_LIGHT_PIN, LOW);  // Tắt LED
        Serial.println("-> DA TAT DEN (LED 4)");
    }
  }
}

// HÀM KẾT NỐI
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("SUCCESS!");
      client.subscribe(TOPIC_CMD_FAN);
      client.subscribe(TOPIC_CMD_LIGHT);
      client.subscribe(TOPIC_CMD_DOOR);
      client.subscribe(TOPIC_CMD_ALARM);
    } else {
      delay(5000);
    }
  }
}

// HÀM BẬT BÁO ĐỘNG
void triggerAlarm() {
  if (!isAlarmActive && !isAlarmSilenced) {
    isAlarmActive = true;
    digitalWrite(BUZZER_PIN, HIGH); // Còi kêu
    digitalWrite(LED_ALARM_PIN, HIGH);    // Đèn trên mạch sáng
    client.publish(TOPIC_STATUS_FIRE, "WARNING");
    Serial.println("-> CANH BAO CHAY KICH HOAT!");
  }
}

// --- HÀM TẮT BÁO ĐỘNG ---
void stopAlarm() {
  if (isAlarmActive) {
    isAlarmActive = false;
    isAlarmSilenced = true; // Ghi nhớ là đã tắt thủ công
    digitalWrite(BUZZER_PIN, LOW); // Tắt còi
    digitalWrite(LED_ALARM_PIN, LOW);
    client.publish(TOPIC_STATUS_FIRE, "SAFE");
    Serial.println("-> DA TAT COI TU WEB.");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  //Cấu hình chân
  pinMode(LED_ALARM_PIN, OUTPUT);
  pinMode(LED_LIGHT_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);

  //Trạng thái ban đầu
  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(RELAY2_PIN, HIGH);
  digitalWrite(RELAY3_PIN, HIGH);
  digitalWrite(RELAY4_PIN, HIGH);
  digitalWrite(LED_ALARM_PIN, LOW);
  digitalWrite(LED_LIGHT_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Kết nối Wifi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWifi Connected");

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}
void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  unsigned long now = millis();
  if (now - lastMsg > 2000){//Cách 2 giây
    lastMsg = now;
    int gasVal = analogRead(MQ2_PIN);
    float temperature = dht.readTemperature(); 
    float humidity = dht.readHumidity(); 
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("không thể đọc dữ  liệu");
      delay(1000);
      return;
    }

    // Gửi lên MQTT
    char strVal[10];
    itoa(gasVal, strVal, 10);
    client.publish(TOPIC_DATA_GAS, strVal);

    dtostrf(temperature, 1, 2, strVal);
    client.publish(TOPIC_DATA_TEMP, strVal);
    
    dtostrf(humidity, 1, 2, strVal);
    client.publish(TOPIC_DATA_HUMID, strVal);

    Serial.printf("Gas: %d | Temp: %.1f | Hum: %.1f\n", gasVal, temperature, humidity);

    // 3. Logic Báo động tại chỗ
    if (gasVal > gasThreshold || temperature > tempThreshold) {
      triggerAlarm();
    } else {
      if (isAlarmSilenced && gasVal < (gasThreshold - 100)) {
        isAlarmSilenced = false;
        isAlarmActive = false;
        Serial.println("->SAFE (reset).");
      }
    }
  }
}
