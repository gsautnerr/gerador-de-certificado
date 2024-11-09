const amqp = require('amqplib/callback_api');
const puppeteer = require("puppeteer");
const path = require("path");

// const queue = 'diplomasQueue';
// setTimeout(() => {
//     console.log(`Aguardando o rabbitmq iniciar`);
// }, 10000);


async function downloadPdfFromHtmlFile(htmlFilePath, outputPath) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
   
  const absolutePath = path.resolve(htmlFilePath);
  await page.goto(`file://${absolutePath}`, { waitUntil: "networkidle0" });
     
  await page.pdf({ path: outputPath, format: "A4" });
  
  await browser.close();
}
const inputHtmlFile = "template.html";
const { v4: uuidv4 } = require('uuid');
const random_uuid = uuidv4();
const outputFile = "C:/Diplomas/"+random_uuid +".pdf";

downloadPdfFromHtmlFile(inputHtmlFile, outputFile)
  .then(() => console.log(`PDF salvo com sucessp em: ${outputFile}`)
)
  .catch((error) => console.error("Erro ao salvar diploma: ", error));


// amqp.connect('amqp://rabbitmq', function (error0, connection) {
//     if (error0) {
//         throw error0;
//     }
//     connection.createChannel(function (error1, channel) {
//         if (error1) {
//             throw error1;
//         }

//         channel.assertQueue(queue, {
//             durable: true
//         });

//         console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

//         channel.consume(queue, function (msg) {
//             console.log(" [x] Received %s", msg.content.toString());
//             const inicio = Date.now();

//             const randomInt = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
//             setTimeout(() => {
//                 console.log(`Processamento de 5 segundos concluído. \r\nNome${ msg.content.toString()}\r\nInício: ${inicio}\r\nFim: ${Date.now()}`);
//                 channel.ack(msg);
//             }, randomInt);
//         }, {
//             noAck: false
//         });
//     });
// });