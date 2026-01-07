using System.Text;
using MQTTnet;
using MQTTnet.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using SensorApi.Models;
using SensorApi.Realtime;

using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;


namespace SensorApi.Services
{
    public class MqttWorker : BackgroundService
    {
        private readonly IConfiguration _cfg;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<MqttWorker> _logger;
        private readonly IHubContext<SensorHub> _hubContext;

        public MqttWorker(
            IConfiguration cfg,
            IServiceScopeFactory scopeFactory,
            ILogger<MqttWorker> logger,
            IHubContext<SensorHub> hubContext)
        {//
            _cfg = cfg;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _hubContext = hubContext;

            //Khởi tạo Firebase nếu chưa có
            if (FirebaseApp.DefaultInstance == null)
            {
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile("firebase_key.json")
                });
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var mqttFactory = new MqttFactory();

            var mqttClient = mqttFactory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer(_cfg["MqttSettings:Broker"], 8883)
                .WithCredentials(
                    _cfg["MqttSettings:User"],
                    _cfg["MqttSettings:Pass"]
                )
                .WithTlsOptions(o =>
                {
                    o.UseTls();
                    // Cho phép TLS không kiểm tra cert 
                    o.WithCertificateValidationHandler(_ => true);
                })
                .Build();

            mqttClient.ApplicationMessageReceivedAsync += async e =>
            {
                try
                {
                    var topic = e.ApplicationMessage.Topic;
                    var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);

                    await SaveToDatabaseAndPushRealtime(topic, payload);
                }
                catch (Exception ex)
                {
                    _logger.LogError($">>> MQTT Message Error: {ex.Message}");
                }
            };

            // Vòng đời BackgroundService
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (!mqttClient.IsConnected)
                    {
                        await mqttClient.ConnectAsync(options, stoppingToken);

                        await mqttClient.SubscribeAsync("home/data/#");
                        await mqttClient.SubscribeAsync("home/status/fire");

                        _logger.LogInformation(">>> [MQTT Worker] Connected & Listening for Hardware data...");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($">>> [MQTT Error]: {ex.Message}");
                }

                await Task.Delay(5000, stoppingToken);
            }
        }

        private async Task SaveToDatabaseAndPushRealtime(string topic, string payload)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Lấy thiết bị đầu tiên (ESP32 mặc định)
            var device = await context.Devices.OrderBy(d => d.id).FirstOrDefaultAsync();
            if (device == null)
            {
                _logger.LogWarning(">>> No device found in database");
                return;
            }

            string type;
            double value;

            if (topic == "home/status/fire")
            {
                type = "FireStatus";
                value = payload == "WARNING" ? 1.0 : 0.0;
            }
            else
            {
                type = topic switch
                {
                    "home/data/temp" => "Temperature",
                    "home/data/humid" => "Humidity",
                    "home/data/gas" => "Gas",
                    _ => "Unknown"
                };

                if (!double.TryParse(payload, out value))
                    return;
            }

            var data = new SensorData
            {
                DeviceId = device.id,
                type = type,
                value = value,
                received_at = DateTimeOffset.UtcNow
            };

            //Lưu lịch sử vào DB
            context.SensorDataEntries.Add(data);
            await context.SaveChangesAsync();

            _logger.LogInformation($"[smarthome-db] Saved {type}: {value}");

            //Push realtime lên Web (SignalR)
            await _hubContext.Clients.All.SendAsync(
                "ReceiveSensorData",
                new
                {
                    type = data.type,
                    value = data.value,
                    time = data.received_at
                }
            );

            //Gửi thông báo đẩy qua Firebase khi có cảnh báo
            if (type == "FireStatus" && value == 1.0)
            {
                await SendFirebaseNotification("🚨 CẢNH BÁO CHÁY!", "Phát hiện hỏa hoạn! Kiểm tra ngay lập tức!");
            }
            else if (type == "Gas" && value >= 2000.0)
            {
                await SendFirebaseNotification("⚠️ RÒ RỈ GAS!", $"Nồng độ Gas nguy hiểm đo được: {value}");
            }
        }

        //ham gửi thông báo đẩy Firebase
        private async Task SendFirebaseNotification(string title, string body)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Lấy tất cả token trong nhà (filter null/empty)
                var tokens = await context.UserDevices
                    .Where(d => !string.IsNullOrEmpty(d.FcmToken))
                    .Select(d => d.FcmToken)
                    .ToListAsync();

                if (tokens.Count == 0) return;

                var message = new MulticastMessage()
                {
                    Tokens = tokens,
                    Notification = new Notification() { Title = title, Body = body },
                    Data = new Dictionary<string, string>() {
                        { "type", "ALARM" },
                        { "click_action", "FLUTTER_NOTIFICATION_CLICK" }
                    }
                };

                await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
                _logger.LogInformation(">>> Đã đẩy thông báo tới toàn bộ thiết bị trong nhà.");
            }
            catch (Exception ex)
            {
                _logger.LogError($">>> Lỗi gửi Firebase: {ex.Message}");
            }
        }

    }
}
