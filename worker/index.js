const amqp = require('amqplib/callback_api');

const queue = 'alunos';
setTimeout(() => {
    console.log(`Aguardando o rabbitmq iniciar`);
}, 10000);

amqp.connect('amqp://rabbitmq', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue, {
            durable: true
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            const inicio = Date.now();

            const randomInt = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
            setTimeout(() => {
                console.log(`Processamento de 5 segundos concluído. \r\nNome${ msg.content.toString()}\r\nInício: ${inicio}\r\nFim: ${Date.now()}`);
                channel.ack(msg);
            }, randomInt);
        }, {
            noAck: false
        });
    });
});