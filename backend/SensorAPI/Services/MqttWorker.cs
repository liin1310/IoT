using System.Text;
using MQTTnet;
using MQTTnet.Client;
using SensorApi.Models;
using Microsoft.EntityFrameworkCore;

namespace SensorApi.Services
{
    public class MqttWorker : BackgroundService
    {
        private readonly IConfiguration _cfg;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<MqttWorker> _logger;

        public MqttWorker(IConfiguration cfg, IServiceScopeFactory scopeFactory, ILogger<MqttWorker> logger)
        {
            _cfg = cfg;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var mqttFactory = new MqttFactory();
            using var mqttClient = mqttFactory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer(_cfg["MqttSettings:Broker"], 8883)
                .WithCredentials(_cfg["MqttSettings:User"], _cfg["MqttSettings:Pass"])
                .WithTlsOptions(o =>
                {
                     o.UseTls(); // Kích hoạt TLS 
                    // Cho phép kết nối mà không cần kiểm tra chứng chỉ (tương đương setInsecure bên ESP32)
                    o.WithCertificateValidationHandler(_ => true);
                })
                .Build();

            mqttClient.ApplicationMessageReceivedAsync += async e =>
            {
                var topic = e.ApplicationMessage.Topic;
                var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
                await SaveToSmarthomeDb(topic, payload);
            };

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (!mqttClient.IsConnected)
                    {
                        await mqttClient.ConnectAsync(options, stoppingToken);
                        await mqttClient.SubscribeAsync("home/data/#");
                        await mqttClient.SubscribeAsync("home/status/fire");
                        _logger.LogInformation(">>> MQTT Connected & Synced with Hardware!");
                    }
                }
                catch (Exception ex) { _logger.LogError($"MQTT Error: {ex.Message}"); }
                await Task.Delay(5000, stoppingToken);
            }
        }

        private async Task SaveToSmarthomeDb(string topic, string payload)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Lấy ID tự tăng của thiết bị đầu tiên
            var device = await context.Devices.OrderBy(d => d.id).FirstOrDefaultAsync();
            if (device == null) return;

            double val = 0;
            string type = "";

            if (topic == "home/status/fire")
            {
                type = "FireStatus";
                val = (payload == "WARNING") ? 1.0 : 0.0; // Đồng bộ với code P.Linh
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
                if (!double.TryParse(payload, out val)) return;
            }

            context.SensorDataEntries.Add(new SensorData
            {
                DeviceId = device.id,
                type = type,
                value = val,
                received_at = DateTimeOffset.UtcNow
            });
            await context.SaveChangesAsync(); 
            _logger.LogInformation($"[smarthome-db] Saved {type}: {payload}");
        }
    }
}