using MQTTnet;
using MQTTnet.Client;
using System.Text;

namespace SensorApi.Services
{
    public class MqttPublisher
    {
        private readonly IMqttClient _client;
        private readonly IConfiguration _cfg;

        public MqttPublisher(IMqttClient client, IConfiguration cfg)
        {
            _client = client;
            _cfg = cfg;
        }

        public async Task PublishAsync(string topic, string payload)
        {
            try 
            {
                // Nếu chưa kết nối, tiến hành kết nối qua WebSocket để vượt tường lửa Render
                if (!_client.IsConnected)
                {
                    var options = new MqttClientOptionsBuilder()
                        .WithWebSocketServer(o => o.WithUri("ws://broker.hivemq.com:8000/mqtt")) // Dùng WebSocket cổng 8000
                        .WithCleanSession()
                        .Build();

                    // Timeout 10 giây để không làm treo API quá lâu
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    await _client.ConnectAsync(options, cts.Token);
                    Console.WriteLine(">>> MQTT Connected via WebSocket!");
                }

                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(Encoding.UTF8.GetBytes(payload))
                    .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtMostOnce)
                    .Build();

                await _client.PublishAsync(message);
                Console.WriteLine($"📤 Sent MQTT: [{topic}] {payload}");
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine(">>> LỖI: Kết nối MQTT bị Timeout (Render chặn cổng hoặc Broker quá tải)");
                throw new Exception("Kết nối MQTT quá hạn. Vui lòng thử lại.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> LỖI MQTT PUBLISH: {ex.Message}");
                throw;
            }
        }
    }
}