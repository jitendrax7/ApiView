
export const CircuitState = Object.freeze({
     CLOSED:'CLOSED',
     OPEN:"OPEN",
     HALF_OPEN:'HALF_OPEN'
})


export class CircuitBreaker {
    constructor(opts = {}){
        this.failureThreshold = opts.failureThreshold ?? 5;
        this.coolddownMs = opts.coolddownMs ?? 30_000;
        this.halfOpenMaxAttempts = opts.halfOpenMaxAttempts ?? 3;
        this.logger = opts.logger ?? console;

        this._state = CircuitState.CLOSED;
        this._failures = 0;
        this._lastFailureTime = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
    };

    _cooldownElapsed(){
        return Date.now() - this._lastFailureTime >= this.coolddownMs;
    };

    _transitionTo(newState){
        const prev = this._state;
        this._state = newState;
        
        if(newState === CircuitState.HALF_OPEN){
            this._halfOpenAttempts = 0;
            this._halfOpenSuccesses = 0;
            this.logger.info(`[CircuitBreaker] ${prev} => HALF_OEPN`)
        }
    };

    _openCircuit(){
        this._lastFailureTime = Date.now();
        this._transitionTo(CircuitState.OPEN);
        this.logger.error('[CircuitBreaker] OPEN', {
            failures:this._failures,
            cooldownMs:this.coolddownMs
        });
    };

    _reset(){
        this._state = CircuitState.CLOSED;
        this._failures = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0
    };


    get state(){
        if(this._state === CircuitState.OPEN && this._cooldownElapsed()){
            this._transitionTo(CircuitState.HALF_OPEN);
        }
        return this._state;
    };

    allowRequest(){
        const current = this.state;
        if(current === CircuitState.CLOSED) return true;
        if(current === CircuitState.HALF_OPEN){
            if(this._halfOpenAttempts < this.halfOpenMaxAttempts){
                this._halfOpenAttempts++;
                return true;
            }
            return false;
        }
        return false;
    };

    onSuccess(){
         if(this._state === CircuitState.HALF_OPEN){
            this._halfOpenSuccesses++;
            if(this._halfOpenSuccesses>= this.halfOpenMaxAttempts){
                this._reset();
                this.logger.info('[CircuitBreaker] HALF_OPEN => CLOSED');
            }

            return;
         }

         if(this._failures > 0){
            this._failures = 0;
            this.logger.info('[CircuitBreaker] failure counter reset after success');

         }
    };

    onFailure(){
        if(this._state=== CircuitState.HALF_OPEN){
            this._openCircuit();
            this.logger.info('[CircuitBreaker] HALF_OPEN => OPEN');
            return;
        }

        this._failures++;
        this._lastFailureTime = Date.now();

        if(this._failures >= this.failureThreshold){
            this._openCircuit();
        }
    };

    snapshot(){
        return {
            state:this._state,
            failures:this._failures,
            lastFailureTime:this._lastFailureTime,
            halfOpenAttempts:this._halfOpenAttempts,
            halfOpenSuccesses:this._halfOpenSuccesses
        }
    };
}