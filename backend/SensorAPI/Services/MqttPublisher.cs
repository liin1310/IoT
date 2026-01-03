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
                if (!_client.IsConnected)
                {
                    var options = new MqttClientOptionsBuilder()
                        .WithTcpServer(_cfg["MqttSettings:Broker"], 8883)
                        .WithCredentials(_cfg["MqttSettings:User"], _cfg["MqttSettings:Pass"])
                        .WithTlsOptions(o => {
                            o.UseTls();
                            o.WithCertificateValidationHandler(_ => true); // Insecure mode giống ESP32
                        })
                        .Build();

                    await _client.ConnectAsync(options);
                }

                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(Encoding.UTF8.GetBytes(payload))
                    .Build();

                await _client.PublishAsync(message);
                Console.WriteLine($"📤 MQTT Publish: [{topic}] {payload}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> Lỗi MqttPublisher: {ex.Message}");
            }
        }
    }
}