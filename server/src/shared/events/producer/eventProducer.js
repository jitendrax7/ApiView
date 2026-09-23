import { EVENT_TYPES } from "../eventContracts.js";
import { isRetryable } from "./RetryStrategy.js";

export class EventProducer {
    constructor({channelManager, circuitBreaker, retryStrategy, logger, queueName }) {
        if(!channelManager) throw new Error("EventProducer requires a channelManager instance");
        if(!circuitBreaker) throw new Error("EventProducer requires a circuitBreaker instance");
        if(!retryStrategy) throw new Error("EventProducer requires a retryStrategy instance");
        if(!queueName) throw new Error("EventProducer requires a queueName");
        
        this._channelManager = channelManager;
        this._circuitBreaker = circuitBreaker;
        this._retryStrategy = retryStrategy;
        this._logger = logger || console;
        this._queueName = queueName;

        this._metrics = {
            publish: 0,
            failed: 0,
            retriesExceeded: 0
        }

        this._shuttingDown = false;
    }

    _incrementMetric(metricName) {
        this._metrics[metricName] = (this._metrics[metricName] || 0) + 1;
    };

    async _publish(eventData, {correlationId, attempt}){
        const channel = await this._channelManager.getChannel();
        
        const message = {
            type:EVENT_TYPES.API_HIT,
            data:eventData,
            publishedAt: new Date().toISOString(),
            attempt: attempt + 1,
        }

        const buffer = Buffer.from(JSON.stringify(message));

        const publishOptions = {
            persistent: true,
            contentType: 'application/json',
            messageId: eventData.eventId,
            correlationId: correlationId,
            timestamp: Math.floor(Date.now() / 1000),
        }

        return new Promise((resolve, reject) => {
            const written = channel.publish(
                '',
                this._queueName,
                buffer,
                publishOptions,
                (err)=>{
                    if(err) return reject(new Error(`Failed to publish event: ${err.message}`));
                    resolve();
                }
            )

            if(!written){
                this._logger.warn(`[EventProducer] back-pressure detected , waiting for drain`,{
                    eventId: eventData.eventId,
                });
            }

            const onDrain = () => {
                channel.removeListener('drain', onDrain);
                this._logger.info(`[EventProducer] drain event received, resuming publishing`,{
                    eventId: eventData.eventId,
                });
            }
            channel.on('drain', onDrain);
        });
    }

    async shutdown(){
        this._shuttingDown = true;
        this._logger.info(`[EventProducer] shutting down...`);
        await this._channelManager.close();
        this._logger.info(`[EventProducer] shutdown complete`);
    }
    
    getStats(){
        return {
            metrics: {...this._metrics},
            circuitBreakerState: this._circuitBreaker.snapshot(),
        }
    }

    async publishApiHit(eventData, opts ={}){
        if(this._shuttingDown){
            const error = new Error("EventProducer is shutting down");
            error.code = "SHOUTDOWN_IN_PROGRESS";
            this._logger.info(`[EventProducer] publish rejected - shutdown in progress`,{
                eventId: eventData.eventId,
            });
            throw error;
        }

        if(!this._circuitBreaker.allowRequest()){
            this._logger.info(`[EventProducer] circuit breaker rejected publish`,{
                eventId: eventData.eventId,
                state: this._circuitBreaker.state,
            });
            return false;
        }

        const correlationId = opts.correlationId ?? eventData.eventId;
        const startMs = Date.now();
        let attempt =  0;
        while(true){
            try {
                await this._publish(eventData, {correlationId, attempt});
                const latencyMs = Date.now() - startMs;
                this._circuitBreaker.onSuccess();
                this._incrementMetric('published');

                this._logger.info(`[EventProducer]  published`,{
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    latencyMs,
                    endpoint: eventData.endpoint,
                });
                return true;
            } catch (error) {
                this._logger.error(`[EventProducer] failed to publish`,{
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    error: error.message,
                });

                const canRetry = isRetryable(error) && this._retryStrategy.shouldRetry(attempt);
                if(!canRetry){
                    this._circuitBreaker.onFailure();
                    this._incrementMetric('failed');
                    if(this._retryStrategy.shouldRetry(attempt)){
                        this._incrementMetric('retriesExceeded');
                    }
                    throw error;
                }

                await this._retryStrategy.wait(attempt);
                attempt++;
                this._logger.info(`[EventProducer] retrying publish`,{
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                });
            }
        }
    }
      

}