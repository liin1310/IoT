using MQTTnet;
using MQTTnet.Client;
using System.Text;

namespace SensorApi.Services // <--- THÊM DÒNG NÀY
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
            if (!_client.IsConnected)
            {
                var options = new MqttClientOptionsBuilder()
                    .WithTcpServer(_cfg["MqttSettings:Broker"] ?? "broker.hivemq.com", 1883)
                    .Build();
                await _client.ConnectAsync(options);
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(payload))
                .Build();

            await _client.PublishAsync(message);
            Console.WriteLine($"📤 Sent MQTT: [{topic}] {payload}");
        }
    }
}