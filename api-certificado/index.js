const express = require('express');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const redis = require('redis');
const app = express();
app.use(bodyParser.json());

// Conexão com MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'secret',
  database: 'prog_diplomas'
});

// Conexão com o Redis
const client = redis.createClient();

client.on('error', (err) => {
    console.error('Erro ao conectar ao Redis:', err);
});

client.connect().then(() => {
    console.log('Conectado ao Redis');
});

app.get('/diplomas', async (req, res) => {
  try {
      console.log('/diplomas request begin');
      const key = 'diploma_list';

      // Verifica se os dados estão no cache
      const diplomas = await client.get(key);  // Utilizando await para leitura de cache
      console.log('read from redis');

      if (diplomas) {
          // Dados encontrados no cache, retorna imediatamente
          return res.json({ source: 'cache', data: JSON.parse(diplom) });
      }

      // Dados não encontrados no cache, consulta os produtos no MySQL
      const [rows] = await db.query('SELECT * FROM diplomas');
      const dbDiplomas = JSON.stringify(rows);

      // Armazena os resultados da consulta no cache com TTL de 1 hora
      await client.setEx(key, 3600, dbDiplomas);  // Utilizando await para setEx no Redis

      // Retorna os dados consultados do banco de dados
      res.json({ source: 'database', data: rows });
  } catch (error) {
      console.error('Erro ao acessar o cache ou banco de dados:', error);
      res.status(500).send('Erro interno');
  }
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
app.post('/diplomas', async (req, res) => {
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
