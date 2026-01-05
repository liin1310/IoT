#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <WiFiManager.h> 
#include <ESP32Servo.h>

// Cấu hình MQTT
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
#define SERVO_PIN  26 

#define SW_LIGHT_PIN  27
#define SW_ALARM_PIN  14
#define SW_DOOR_PIN   33 
//TOPIC
//1. topic gửi dữ liệu (publish)
#define TOPIC_DATA_TEMP   "home/data/temp"
#define TOPIC_DATA_HUMID  "home/data/humid"
#define TOPIC_DATA_GAS    "home/data/gas"

//2. topic gửi trạng thái (publish)
#define TOPIC_STATUS_FAN    "home/status/fan"
#define TOPIC_STATUS_DOOR   "home/status/door"
#define TOPIC_STATUS_FIRE   "home/status/fire"
#define TOPIC_STATUS_LIGHT  "home/status/light"

//3. topic nhận lệnh điều khiển (subscribe)
#define TOPIC_CMD_FAN   "home/cmd/fan"   // Lệnh: ON/OFF
#define TOPIC_CMD_DOOR    "home/cmd/door"    // Lệnh: OPEN/CLOSE
#define TOPIC_CMD_ALARM  "home/cmd/alarm"  // Lệnh tắt còi 
#define TOPIC_CMD_LIGHT  "home/cmd/light"

DHT dht(DHT_PIN, DHT_TYPE);
Servo doorServo;
WiFiClientSecure espClient;
PubSubClient client(espClient);

int gasThreshold = 2000;
float tempThreshold = 45.0; 
unsigned long lastMsg = 0;
bool isAlarmActive = false;   // Trạng thái đang báo động
bool isAlarmSilenced = false; // Trạng thái đã bấm nút tắt còi

int lastLightSwState = HIGH; //Trạng thái ban đầu của công tắc
int lastStopSwState = HIGH;
int lastDoorSwState = HIGH;
// HÀM XỬ LÝ LỆNH TỪ SERVER
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) message += (char)payload[i];
  String strTopic = String(topic);

  Serial.print("Nhận lệnh MQTT ["); Serial.print(strTopic);
  Serial.print("]: "); Serial.println(message);

  // 1. Điều khiển QUẠT (Relay 1)
  if (strTopic == TOPIC_CMD_FAN) {
    if (message == "ON") {
      digitalWrite(RELAY1_PIN, LOW); // low = bật
      client.publish(TOPIC_STATUS_FAN, "ON");
    }
    else if (message == "OFF") {
      digitalWrite(RELAY1_PIN, HIGH);
      client.publish(TOPIC_STATUS_FAN, "OFF");
    }
  }
  
  // 2. Điều khiển CỬA 
  else if (strTopic == TOPIC_CMD_DOOR) {
    if (message == "ON") {
      doorServo.write(90); 
      client.publish(TOPIC_STATUS_DOOR, "ON");
    }
    else if (message == "OFF") {
      doorServo.write(0);
      client.publish(TOPIC_STATUS_DOOR, "OFF");
    }
  }

  // 3. Tắt báo động từ Web
  else if (strTopic == TOPIC_CMD_ALARM && message == "OFF") {
    stopAlarm();
  }

  // 4. Điều khiển đèn
  else if (strTopic == TOPIC_CMD_LIGHT) {
    if (message == "ON") {
        digitalWrite(LED_LIGHT_PIN, HIGH); // Bật LED
        client.publish(TOPIC_STATUS_LIGHT, "ON");
    } 
    else if (message == "OFF") {
        digitalWrite(LED_LIGHT_PIN, LOW);  // Tắt LED
        client.publish(TOPIC_STATUS_LIGHT, "OFF");
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
    digitalWrite(LED_ALARM_PIN, HIGH);    // Đèn sáng

    doorServo.write(90); //Cửa tự động mở
    client.publish(TOPIC_STATUS_DOOR, "ON");

    client.publish(TOPIC_STATUS_FIRE, "WARNING");
    Serial.println("-> CẢNH BÁO CHÁY ĐƯỢC KÍCH HOẠT!");
  }
}

// HÀM TẮT BÁO ĐỘNG
void stopAlarm() {
  if (isAlarmActive) {
    isAlarmActive = false;
    isAlarmSilenced = true; // Ghi nhớ là đã tắt thủ công
    digitalWrite(BUZZER_PIN, LOW); // Tắt còi
    digitalWrite(LED_ALARM_PIN, LOW);
    client.publish(TOPIC_STATUS_FIRE, "SAFE");
    Serial.println("-> ĐÃ TẮT CẢNH BÁO CHÁY TỪ WEB.");
  }
}

// HÀM KIỂU TRA CÔNG TẮC 
void checkSwitches() {
  // CÔNG TẮC ĐÈN  
  int currentLightState = digitalRead(SW_LIGHT_PIN);

  if (currentLightState != lastLightSwState) { //Có người gạt công tắc??
    delay(30); //Chống nhiễu
    if (digitalRead(SW_LIGHT_PIN) == currentLightState) {
      
      bool ledState = digitalRead(LED_LIGHT_PIN);
      digitalWrite(LED_LIGHT_PIN, !ledState); 

      if (!ledState) { 
        client.publish(TOPIC_STATUS_LIGHT, "ON");
        Serial.println("-> Switch: Đã bật đèn");
      } else {
        client.publish(TOPIC_STATUS_LIGHT, "OFF");
        Serial.println("-> Switch: Đã tắt đèn");
      }
      lastLightSwState = currentLightState;
    }
  }

  // CÔNG TẮC TẮT BÁO ĐỘNG
  int currentStopState = digitalRead(SW_ALARM_PIN);

  if (currentStopState != lastStopSwState) {
     delay(30);
     if (digitalRead(SW_ALARM_PIN) == currentStopState) {
        stopAlarm(); 
        Serial.println("-> Switch: Đã tắt báo động.");
        lastStopSwState = currentStopState;
     }
  }

  //CÔNG TẮC CỬA
  int currentDoorState = digitalRead(SW_DOOR_PIN);
  if (currentDoorState != lastDoorSwState) {
    delay(30);
    if (digitalRead(SW_DOOR_PIN) == currentDoorState) {
      
      // Logic đảo chiều Cửa (Đang đóng -> Mở, Đang Mở -> Đóng)
      int currentAngle = doorServo.read();
      
      if (currentAngle < 45) {
         doorServo.write(90);
         client.publish(TOPIC_STATUS_DOOR, "ON");
         Serial.println("-> Switch: MO CUA");
      } else { 
         doorServo.write(0);  
         client.publish(TOPIC_STATUS_DOOR, "OFF");
         Serial.println("-> Switch: DONG CUA");
      }
      lastDoorSwState = currentDoorState;
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  doorServo.attach(SERVO_PIN);
  doorServo.write(0); //Mặc định đóng cửa

  //Cấu hình chân
  pinMode(LED_ALARM_PIN, OUTPUT);
  pinMode(LED_LIGHT_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(SW_LIGHT_PIN, INPUT_PULLUP);
  pinMode(SW_ALARM_PIN, INPUT_PULLUP);
  pinMode(SW_DOOR_PIN, INPUT_PULLUP);

  //Trạng thái ban đầu
  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(LED_ALARM_PIN, LOW);
  digitalWrite(LED_LIGHT_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Đọc trạng thái ban đầu
  lastLightSwState = digitalRead(SW_LIGHT_PIN);
  lastStopSwState = digitalRead(SW_ALARM_PIN);
  lastDoorSwState = digitalRead(SW_DOOR_PIN);

  WiFiManager vm;
  vm.setConfigPortalTimeout(180); //Set timeout 3ph
  Serial.println("Đang kết nối Wifi...");
  bool res = vm.autoConnect("ESP32-Nhom27");
  if(!res){
    Serial.println("Kết nối thất bại. ESP32 sẽ khởi động lại");
    ESP.restart();
  }
  else Serial.println("\nWifi kết nối thành công");

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}
void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  checkSwitches();

  unsigned long now = millis();
  if (now - lastMsg > 2000){//Cách 2 giây
    lastMsg = now;
    int gasVal = analogRead(MQ2_PIN);
    float temperature = dht.readTemperature(); 
    float humidity = dht.readHumidity(); 
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("không thể đọc dữ liệu");
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
        Serial.println("->AN TOÀN (reset).");
      }
    }
  }
}
