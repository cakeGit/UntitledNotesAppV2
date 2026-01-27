//Little utility, to ensure the function is not called more often than the wait time, and will always ensure the last call is executed,
// even though it may be delayed.
export class Debouncer {
    constructor(debouncedFunction, wait) {
        this.debouncedFunction = debouncedFunction;
        this.wait = wait;

        this.timeout = null;
        this.lastCallTime = 0;
    }

    invoke() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;

        if (timeSinceLastCall >= this.wait) {
            this.lastCallTime = now;
            this.debouncedFunction(...arguments);
        } else {
            this.timeout = setTimeout(
                () => {
                    this.debouncedFunction(...arguments);
                    this.timeout = null;
                },
                Math.max(this.wait - timeSinceLastCall, 0),
            );
        }
    }

    cancel() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}
