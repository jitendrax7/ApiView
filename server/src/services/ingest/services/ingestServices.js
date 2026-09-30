import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import { v4 as uuidv4 } from 'uuid';

export class IngestService {
    constructor({eventProducer}) {
        if(!eventProducer){
            throw new Error('EventProducer is required');
        }
        this.eventProducer = eventProducer;
    }

    validateHitData(hitData) {
        const requiredFields = [
            'serviceName',
            'endpoint',
            'method',
            'statusCode',
            'latencyMs',
            'clientId',
        ];

        const missingFields = requiredFields.filter((field) => !hitData[field]);

        if (missingFields.length > 0) {
            throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
        };

        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

        if (!validMethods.includes(hitData.method.toUpperCase())) {
            throw new AppError(`Invalid method: ${hitData.method}`, 400);
        };

        const statusCode = parseInt(hitData.statusCode, 10);
        if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
            throw new AppError(`Invalid status code: ${hitData.statusCode}`, 400);
        };

        const latency = parseFloat(hitData.latencyMs);
        if (isNaN(latency) || latency < 0) {
            throw new AppError(`Invalid latency: ${hitData.latencyMs}`, 400);
        };
    }


    async ingestApiHit(hitData) {
        try {
            this.validateHitData(hitData);

            const event = {
                eventId: uuidv4(),
                timestamp: new Date(),
                serverName: hitData.serviceName,
                endpoint: hitData.endpoint,
                method: hitData.method.toUpperCase(),
                statusCode: parseInt(hitData.statusCode, 10),
                latencyMs: parseFloat(hitData.latencyMs),
                clientId: hitData.clientId,
                apiKeyId: hitData.apiKeyId,
                ip: hitData.ip || 'unknown',
                userAgent: hitData.userAgent || '',
            };  

            await this.eventProducer.publishApiHit(event);
            logger.info('API hit ingested', {
                eventId: event.eventId,
                clientId: event.clientId,
                endpoint: event.endpoint,
                method: event.method,
            });

            return {
                eventId: event.eventId,
                status: 'queued',
                timestamp: event.timestamp,
            };
        } catch (error) {
            logger.error('Error ingesting API hit', error);
            throw error;
        }
    }


}