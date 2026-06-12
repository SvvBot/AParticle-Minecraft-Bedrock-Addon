/**
 * PerformanceMonitor: Monitors tick budget usage and dynamically
 * adjusts particle batch sizing to prevent server lag.
 */
class Monitor {
    constructor() {
        this.currentBatchSize = 30; // Default safe starting size
        
        // Configuration
        this.MIN_BATCH = 5;
        this.MAX_BATCH = 100;
        this.TARGET_LOW_MS = 1.0;  // Under this time = server is idle, increase load
        this.TARGET_HIGH_MS = 3.0; // Over this time = danger zone, decrease load
        this.SMOOTHING_FACTOR = 0.3; // EMA smoothing
        
        // State
        this.rollingAvgMs = 1.5;
        this.totalRecordings = 0;
    }

    /**
     * Records the execution time of a particle spawn batch and
     * adjusts the batch size for the next yield cycle.
     * @param {number} ms 
     */
    recordExecutionTime(ms) {
        this.totalRecordings++;

        // Exponential Moving Average
        this.rollingAvgMs = (ms * this.SMOOTHING_FACTOR) + (this.rollingAvgMs * (1 - this.SMOOTHING_FACTOR));

        if (this.rollingAvgMs < this.TARGET_LOW_MS) {
            this.currentBatchSize = Math.min(this.currentBatchSize + 2, this.MAX_BATCH);
        } else if (this.rollingAvgMs > this.TARGET_HIGH_MS) {
            this.currentBatchSize = Math.max(this.currentBatchSize - 5, this.MIN_BATCH);
        }
    }

    /**
     * Returns the current dynamically adjusted batch size.
     * @returns {number}
     */
    getCurrentBatchSize() {
        return Math.floor(this.currentBatchSize);
    }

    /**
     * Gets current performance stats for debugging.
     */
    getStats() {
        return {
            currentBatchSize: Math.floor(this.currentBatchSize),
            rollingAvgMs: this.rollingAvgMs.toFixed(2),
            totalRecordings: this.totalRecordings
        };
    }

    reset() {
        this.currentBatchSize = 30;
        this.rollingAvgMs = 1.5;
        this.totalRecordings = 0;
    }
}

export const PerformanceMonitor = new Monitor();
