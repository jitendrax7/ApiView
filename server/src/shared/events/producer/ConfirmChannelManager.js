import {EventEmitter} from 'node:events';

export class ConfirmChannelManager extends EventEmitter {
    constructor({rabbitmq,logger}) {
        super();

        if(!rabbitmq) throw new Error("ConfirmChannelManager requires a rabbitmq connection instance");

        this._rabbitmq = rabbitmq;
        this._logger = logger || console;
        this._channel = null;
        this._connecting = false;
        this._connectWaiters = [];
    }

    async getChannel() {
        if(this._channel) return this._channel;
        
        if(this._connecting) {
            return new Promise((resolve, reject) => {
                this._connectWaiters.push({resolve, reject});
            });
        }

        return this._connect();
    }

    async _connect() {
        this._connecting = true;
        try {
            let connection;
            if(this._rabbitmq.connection) {
                connection = this._rabbitmq.connection;
            } else {
                this._rabbitmq.connect();
                if(!this._rabbitmq.connection) {
                    throw new Error("Failed to establish a connection to RabbitMQ");
                }
                connection = this._rabbitmq.connection;
            }

            const confirmChannel = await connection.createConfirmChannel();
            confirmChannel.on('drain', () => this.emit('drain'));
            confirmChannel.on('close', () => {
                this._logger.warn("[ConfirmChannelManager] Channel closed unexpectedly");
                this._channel = null;
            });

            confirmChannel.on('error', (err) => {
                this._logger.error("[ConfirmChannelManager] Channel error: ", {
                    error: err.message,
                    stack: err.stack,
                    code: err.code
                });
                this._channel = null;
                this.emit('error', err);
            });

            this._channel = confirmChannel;
            this._logger.info("[ConfirmChannelManager] Confirm channel established successfully");

            this._connectWaiters.forEach(waiter => waiter.resolve(confirmChannel));
            this._connectWaiters = [];

            return confirmChannel;
        } catch (error) {
            this._connectWaiters.forEach(waiter => waiter.reject(error));
            this._connectWaiters = [];
            return error;
        }
        finally {
            this._connecting = false;
        }
    }
}