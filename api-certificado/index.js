const express = require('express');
const amqp = require('amqplib');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'mysql',
  user: 'user',
  password: 'certificado',
  database: 'prog_diplomas'
});

const client = redis.createClient();

client.on('error', (err) => {
    console.error('Erro ao conectar ao Redis:', err);
});

client.connect().then(() => {
    console.log('Conectado ao Redis');
});


app.get('/certificados', async (req, res) => {
  try {
      console.log('/certificados request begin');
      const key = 'certificado_list';

      // Verifica se os dados estão no cache
      const certificados = await client.get(key);  // Utilizando await para leitura de cache
      console.log('read from redis');

      if (certificados) {
          // Dados encontrados no cache, retorna imediatamente
          return res.json({ source: 'cache', data: JSON.parse(certificados) });
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

connection.connect((err) => {
  if (err) throw err;
  console.log('Conectado ao MySQL!');
});


// Conexão RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log("Mensagem enviada para fila:", message);
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila:", error);
  }
}

// Endpoint para receber JSON e salvar na fila
app.post('/diploma', async (req, res) => {

  const {
    nome_aluno,
    data_conclusao,
    nome_curso,
    data_emissao,
    template_diploma
  } = req.body;

  
  const query = `INSERT INTO diplomas (nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma) VALUES (?, ?, ?, ?, ?)`;


  connection.query(query, [
    nome_aluno,
    data_conclusao,
    nome_curso,
    data_emissao,
    template_diploma
  ], (err, result) => {
    if (err) {
      console.error("Erro ao salvar no MySQL:", err);
      return res.status(500).send('Erro ao salvar no banco de dados.');
    }
    // Enviar os dados para a fila RabbitMQ
    sendToQueue(req.body);

    res.status(200).send('Dados recebidos e adicionados a fila.');
  
});

});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});