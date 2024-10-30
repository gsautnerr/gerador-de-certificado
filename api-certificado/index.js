const express = require('express');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();
app.use(bodyParser.json());

// Conexão com o Redis
const redisClient = redis.createClient();
redisClient.on('error', (err) => {
  console.error('Erro ao conectar ao Redis:', err);
});

redisClient.connect().then(() => {
  console.log('Conectado ao Redis');
});

// Função para enviar mensagem para a fila RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log("Mensagem enviada para a fila:", message);
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Erro ao enviar mensagem para a fila:", error);
  }
}

// Endpoint para receber JSON e enviar à fila
app.post('/diploma', async (req, res) => {
  const {
    nome_aluno,
    data_conclusao,
    nome_curso,
    data_emissao,
    template_diploma
  } = req.body;

  try {
    // Verificar se o certificado já foi gerado e está no cache
    const cacheKey = `certificado_${nome_aluno}_${nome_curso}`;
    const cachedCertPath = await redisClient.get(cacheKey);

    if (cachedCertPath) {
      // Certificado já foi gerado, retornar o caminho do certificado
      return res.status(200).json({ message: 'Certificado já gerado.', certPath: cachedCertPath });
    }

    // Enviar dados para a fila RabbitMQ
    await sendToQueue(req.body);

    // Responde ao cliente confirmando que a requisição foi recebida
    res.status(200).send('Dados recebidos e enviados à fila para processamento.');
  } catch (error) {
    console.error("Erro ao enviar dados para a fila:", error);
    res.status(500).send('Erro ao enviar dados para a fila.');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
