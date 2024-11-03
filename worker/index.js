const amqp = require('amqplib');
const mysql = require('mysql2/promise'); // Para usar async/await com MySQL
const redis = require('redis'); // Adicionando a biblioteca Redis
const fs = require('fs');
const path = require('path'); // Para manipulação de caminhos de arquivos
const { v4: uuidv4 } = require('uuid'); // Importando a função para gerar GUID

// Configuração do MySQL
const dbConfig = {
  host: 'mysql',
  user: 'user',
  password: 'certificado',
  database: 'prog_diplomas'
};

// Conexão com o Redis
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Erro ao conectar ao Redis:', err));

redisClient.connect().then(() => {
  console.log('Conectado ao Redis');
});

// Função para processar mensagens da fila
async function processQueueMessage(message) {
  const { nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma } = JSON.parse(message.content.toString());

  try {
    // Conexão com o banco de dados
    const connection = await mysql.createConnection(dbConfig);

    // Inserção no banco
    const query = `INSERT INTO diplomas (nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma) VALUES (?, ?, ?, ?, ?)`;
    await connection.execute(query, [nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma]);
    await connection.end();

    console.log("Dados inseridos no banco de dados:", { nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma });

    // Confirma que a mensagem foi processada
    channel.ack(message);
  } catch (error) {
    console.error("Erro ao inserir dados no banco de dados:", error);
  }
}

// Conectar ao RabbitMQ e consumir a fila
async function consumeQueue() {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    console.log("Aguardando mensagens na fila...");

    channel.consume(queue, (message) => {
      processQueueMessage(message);
    });
  } catch (error) {
    console.error("Erro ao consumir a fila:", error);
  }
}

consumeQueue();
