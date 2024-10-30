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

// Função para gerar o caminho do certificado
function generateCertificate(nome_aluno, nome_curso) {
  // Gerar um GUID para o nome do arquivo
  const guid = uuidv4();
  const certPath = path.join(__dirname, 'certificados', `${guid}.pdf`);
  
  // Simulação da criação do PDF
  // Aqui você deve adicionar o código real para criar o PDF
  fs.writeFileSync(certPath, `Certificado de ${nome_aluno} - Curso: ${nome_curso}`);
  
  return certPath;
}

// Função para processar mensagens da fila
async function processQueueMessage(message) {
  const { nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma } = JSON.parse(message.content.toString());

  try {
    // Conexão com o banco de dados
    const connection = await mysql.createConnection(dbConfig);

    // Gerar o certificado
    const certPath = generateCertificate(nome_aluno, nome_curso);

    // Inserção no banco
    const query = `INSERT INTO diplomas (nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma) VALUES (?, ?, ?, ?, ?)`;
    await connection.execute(query, [nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma]);
    
    // Salvar o caminho do certificado no Redis
    const cacheKey = `certificado_${nome_aluno}_${nome_curso}`;
    await redisClient.setEx(cacheKey, 3600, certPath); // 1 hora de TTL

    await connection.end();

    console.log("Dados inseridos no banco de dados:", { nome_aluno, data_conclusao, nome_curso, data_emissao, template_diploma });
    console.log("Certificado gerado e salvo em:", certPath);

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
