import { Logger } from "../utils/Logger.js";

export class TimelineManager {
    constructor() {
        this.activeJobs = new Map();
        this.pendingJobs = [];
        this.tickCount = 0;
        this.nextJobId = 1;
    }

    /**
     * Adds a new generator job to the timeline.
     * @param {Generator} generator 
     * @param {string} label 
     * @param {number} delayTicks 
     * @returns {string} jobId
     */
    addJob(generator, label = "unnamed", delayTicks = 0) {
        const jobId = `job_${this.nextJobId++}`;
        const job = { generator, label, id: jobId };

        if (delayTicks <= 0) {
            this.activeJobs.set(jobId, job);
        } else {
            this.pendingJobs.push({
                ...job,
                startTick: this.tickCount + delayTicks
            });
            // Sort ascending by startTick so we can efficiently pop from the end (if we reverse) 
            // or just iterate and filter
            this.pendingJobs.sort((a, b) => a.startTick - b.startTick);
        }

        return jobId;
    }

    /**
     * Called every game tick (50ms).
     */
    tick() {
        this.tickCount++;

        // 1. Move due pending jobs to active
        while (this.pendingJobs.length > 0 && this.pendingJobs[0].startTick <= this.tickCount) {
            const job = this.pendingJobs.shift();
            this.activeJobs.set(job.id, job);
        }

        // 2. Iterate active jobs and advance generators
        for (const [jobId, job] of this.activeJobs.entries()) {
            try {
                const result = job.generator.next();
                if (result.done) {
                    this.activeJobs.delete(jobId);
                }
            } catch (e) {
                Logger.warn(`Error in job ${job.label} (${jobId}): ${e.message}`);
                this.activeJobs.delete(jobId);
            }
        }
    }

    cancelJob(jobId) {
        if (this.activeJobs.has(jobId)) {
            this.activeJobs.delete(jobId);
            return true;
        }
        
        const initialLen = this.pendingJobs.length;
        this.pendingJobs = this.pendingJobs.filter(j => j.id !== jobId);
        return this.pendingJobs.length < initialLen;
    }

    cancelAll() {
        this.activeJobs.clear();
        this.pendingJobs = [];
    }

    getActiveCount() {
        return this.activeJobs.size;
    }

    getPendingCount() {
        return this.pendingJobs.length;
    }

    isRunning(jobId) {
        return this.activeJobs.has(jobId) || this.pendingJobs.some(j => j.id === jobId);
    }
}

export const Timeline = new TimelineManager();
