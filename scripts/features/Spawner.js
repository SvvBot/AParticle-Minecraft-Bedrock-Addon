import { MathInterpreter } from '../core/MathInterpreter.js';
import { VectorPool } from '../core/ObjectPool.js';
import { PerformanceMonitor } from '../performance/PerformanceMonitor.js';
import { Matrix } from './Matrix.js';

export class Spawner {
    /**
     * Creates a generator that spawns particles based on parametric math expressions (strings).
     * Tokenizes + converts to RPN once, then delegates to spawnFromRPN.
     * 
     * @param {import("@minecraft/server").Dimension} dimension 
     * @param {string} particleId 
     * @param {string} exprX 
     * @param {string} exprY 
     * @param {string} exprZ 
     * @param {{x:number, y:number, z:number}} centerPos 
     * @param {number} step 
     * @param {number} range 
     * @param {Object} options 
     */
    static *spawnParametric(dimension, particleId, exprX, exprY, exprZ, centerPos, step, range, options = {}) {
        // Tokenize and convert to RPN once at start
        const rpnX = MathInterpreter.toRPN(MathInterpreter.tokenize(exprX));
        const rpnY = MathInterpreter.toRPN(MathInterpreter.tokenize(exprY));
        const rpnZ = MathInterpreter.toRPN(MathInterpreter.tokenize(exprZ));

        yield* Spawner.spawnFromRPN(dimension, particleId, rpnX, rpnY, rpnZ, centerPos, step, range, options);
    }

    /**
     * Creates a generator using pre-parsed RPN arrays.
     * Used by Registry saved functions to avoid re-tokenizing/parsing.
     * 
     * @param {import("@minecraft/server").Dimension} dimension
     * @param {string} particleId
     * @param {Array} rpnX
     * @param {Array} rpnY
     * @param {Array} rpnZ
     * @param {{x:number, y:number, z:number}} centerPos
     * @param {number} step
     * @param {number} range
     * @param {Object} options
     */
    static *spawnFromRPN(dimension, particleId, rpnX, rpnY, rpnZ, centerPos, step, range, options = {}) {
        let count = 0;
        let startTime = Date.now();

        // Snapshot center position to prevent mutation if original object changes
        const cx = centerPos.x;
        const cy = centerPos.y;
        const cz = centerPos.z;

        // Safety: enforce minimum step and maximum points (Hard Limits from plan)
        const safeStep = Math.max(step, 0.05);
        const maxPoints = Math.min(Math.ceil(range / safeStep), 10000);

        for (let i = 0; i <= maxPoints; i++) {
            const t = i * safeStep;

            // 1. Evaluate expressions for local offsets
            const localX = MathInterpreter.evaluateRPN(rpnX, t);
            const localY = MathInterpreter.evaluateRPN(rpnY, t);
            const localZ = MathInterpreter.evaluateRPN(rpnZ, t);

            // Guard against NaN from bad expressions
            if (!isFinite(localX) || !isFinite(localY) || !isFinite(localZ)) {
                continue; // Skip this point instead of crashing
            }

            // 2. Determine final position
            let fx, fy, fz;

            if (options.rotationMatrix) {
                // Apply rotation to the local offset, THEN add center
                const vec = VectorPool.acquireVectorFrom(localX, localY, localZ);
                Matrix.applyRotation(vec, options.rotationMatrix);
                fx = cx + vec.x;
                fy = cy + vec.y;
                fz = cz + vec.z;
                VectorPool.releaseVector(vec);
            } else {
                fx = cx + localX;
                fy = cy + localY;
                fz = cz + localZ;
            }

            // 3. Acquire final position vector from pool
            const finalPos = VectorPool.acquireVectorFrom(fx, fy, fz);

            // 4. Spawn the particle
            try {
                dimension.spawnParticle(particleId, finalPos);
            } catch (e) {
                // Ignore chunk-unloaded or invalid particle errors, just skip
            }

            // 5. Release vector immediately
            VectorPool.releaseVector(finalPos);

            // 6. Check performance budget and yield if batch is full
            count++;
            if (count >= PerformanceMonitor.getCurrentBatchSize()) {
                const elapsedMs = Date.now() - startTime;
                PerformanceMonitor.recordExecutionTime(elapsedMs);

                count = 0;
                yield; // Yield control back to the Timeline tick loop

                startTime = Date.now(); // Reset timer for next batch
            }
        }
    }
}
