import config from '../../config/index.js';
import logger from '../../config/logger.js';
import rabbitmq from '../../config/rabbitmq.js';

import { CircuitBreaker } from './CircuitBreaker.js';
import { RetryStrategy } from './RetryStrategy.js';
import { EventProducer } from './eventProducer.js';
import { ConfirmChannelManager } from './ConfirmChannelManager.js';

export function createEventProducer(overrides = {}) {
    const log = overrides.logger ?? logger;
    const rmq = overrides.rabbitmq ?? rabbitmq;
    const queueName = overrides.queueName ?? config.rabbitmq.queue;

    // validate required dependencies
    if(!rmq) throw new Error("createEventProducer requires a rabbitmq instance");
    if(!queueName) throw new Error("createEventProducer requires a queue name");
    if(!config.rabbitmq.retryAttempts || config.rabbitmq.retryAttempts < 0) throw new Error("createEventProducer requires a valid retryAttempts value in config");
    
    const channelManager = overrides.channelManager ?? new ConfirmChannelManager({rabbitmq: rmq, logger: log});

    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        failureThreshold: 5,
        cooldownMs:30_000,
        halfOpenMaxAttempts: 3,
        logger: log
    });
    
    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetries: config.rabbitmq.retryAttempts,
        baseDelayMs: config.rabbitmq.retryDelay,
        maxDelayMs: 5_000,
        jitterFactor: 0.3,
    });

    return new EventProducer({
        channelManager,
        circuitBreaker,
        retryStrategy,
        logger: log,
        queueName
    });
}