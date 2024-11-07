const express = require('express');
const mysql = require('mysql2');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();
app.use(bodyParser.json());

// Conexão com o MySQL
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'root',
  password: 'secret',
  database: 'prog_diplomas'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Conectado ao MySQL!');
});

// Função para enviar mensagem para a fila RabbitMQ
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

// Conexão com o Redis
const client = redis.createClient({
  host: 'redis'
});

client.on('error', (err) => {
    console.error('Erro ao conectar ao Redis:', err);
});

client.connect().then(() => {
    console.log('Conectado ao Redis');
});

// Endpoint para receber JSON e enviar à fila
app.post('/diplomas', async (req, res) => {
  const {
    nome_aluno,
    data_conclusao,
    nome_curso,
    nacionalidade,
    naturalidade,
    data_nascimento,
    numero_rg,
    data_emissao,
    assinaturas,
    template_diploma

  } = req.body;

// Salvando os dados no MySQL
const query = `INSERT INTO diplomas (nome_aluno, data_conclusao, nome_curso, nacionalidade, naturalidade, data_nascimento, numero_rg, data_emissao, template_diploma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

connection.query(query, [
  nome_aluno,
  data_conclusao,
  nome_curso,
  nacionalidade,
  naturalidade,
  data_nascimento,
  numero_rg,
  data_emissao,
  template_diploma
], (err, result) => {
  if (err) {
    console.error("Erro ao salvar no MySQL:", err);
    return res.status(500).send('Erro ao salvar no banco de dados.');
  }

  // Adicionar assinaturas
  assinaturas.forEach(({ cargo, nome }) => {
    const queryAssinatura = `INSERT INTO assinaturas (diploma_id, cargo, nome) VALUES (?, ?, ?)`;
    connection.query(queryAssinatura, [result.insertId, cargo, nome], (err) => {
      if (err) console.error("Erro ao salvar assinatura:", err);
    });
  });

  // Enviar os dados para a fila RabbitMQ
  sendToQueue(req.body);

  res.status(200).send('Dados recebidos e processados com sucesso.');
});
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
