

const RETRYABLE_PATTERNS = [
    'channel closed',
    'connection closed',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'buffer full',
    'heartbeat timeout',
    'not available',
    'server connection closed',
];


export function isRetryable(error) {
    if(!error){
        return false;
    }

    const msg = (error.message || error.toString() || '').toLowerCase();
    const code = (error.code || '').toLowerCase();

    return RETRYABLE_PATTERNS.some(
        pattern => msg.includes(pattern.toLowerCase()) || code.includes(pattern.toLowerCase())
    );
}


export class RetryStrategy {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 200;
        this.maxDelayMs = options.maxDelayMs ?? 5000;
        this.jitterFactor = options.jitterFactor ?? 0.3;
    }



    shouldRetry(attempt) {
        return attempt < this.maxRetries;
    };

    delay(attempt) {
        const exponential = this.baseDelayMs * Math.pow(2, attempt);
        const capped = Math.min(exponential, this.maxDelayMs);
        
        const jitterRange = capped * this.jitterFactor;
        const jitter = (Math.random()-0.5) * jitterRange;

        return Math.max(0, Math.round(capped + jitter));
    }

    wait(attempt) {
        const ms = this.delay(attempt);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}