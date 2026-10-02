import amqp from 'amqplib';
import config from './index.js';
import logger from './logger.js';


class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnecting = false; // Flag to indicate if a connection attempt is in progress
    }


    async connect() {
        if(this.channel){
            return this.channel;
        }

        if(this.isConnecting) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!this.isConnecting) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });

            return this.channel;
        }

        try {
            this.isConnecting = true;
            
            logger.info("Connecting to RabbitMQ ", config.rabbitmq.url);
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();
            
            const dlqName = `${config.rabbitmq.queue}.dlq`;

            await this.channel.assertQueue(dlqName, { durable: true });

            await this.channel.assertQueue(config.rabbitmq.queue, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': "",
                    'x-dead-letter-routing-key': dlqName,
                },
            })
            logger.info("RabbitMQ connection established successfully, queue created: ", config.rabbitmq.queue);
            this.connection.on('close', () => {
                logger.warn("RabbitMQ connection closed: ");
                this.connection = null;
                this.channel = null;
            });

            this.connection.on('error', (err) => {
                logger.error("RabbitMQ connection error: ", err);
                this.connection = null;
                this.channel = null;
            });
            this.isConnecting = false;
            return this.channel;
        } catch (error) {
            this.isConnecting = false;
            logger.error("Error connecting to RabbitMQ: ", error);
            throw error;
        }  
    }
  
    getChannel() {
        return this.channel;
    }

    getStatus() {
        if(!this.connection || !this.channel) return "disconnected";
        if(this.connection.closing) return "closing";
        return "connected";
    }

    async close() {
        try {
            if(this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if(this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            logger.info("RabbitMQ connection closed successfully");
        } catch (error) {
            logger.error("Error closing RabbitMQ connection: ", error);
        }
    }
}


export default new RabbitMQConnection();