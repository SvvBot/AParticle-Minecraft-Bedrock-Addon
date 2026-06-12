/**
 * RawVectorPool: A memory pool for `{x, y, z}` objects to prevent 
 * garbage collection spikes from vector allocations.
 */
class RawVectorPool {
    constructor(initialSize = 256, maxSize = 1000) {
        this.maxSize = maxSize;
        this._pool = new Array(initialSize);
        for (let i = 0; i < initialSize; i++) {
            this._pool[i] = { x: 0, y: 0, z: 0 };
        }
        this.acquireCount = 0;
        this.releaseCount = 0;
        this.missCount = 0;
    }

    acquireVector() {
        this.acquireCount++;
        if (this._pool.length > 0) {
            const vec = this._pool.pop();
            vec.x = 0; vec.y = 0; vec.z = 0;
            return vec;
        }
        this.missCount++;
        return { x: 0, y: 0, z: 0 };
    }

    acquireVectorFrom(x, y, z) {
        this.acquireCount++;
        if (this._pool.length > 0) {
            const vec = this._pool.pop();
            vec.x = x; vec.y = y; vec.z = z;
            return vec;
        }
        this.missCount++;
        return { x, y, z };
    }

    releaseVector(vec) {
        this.releaseCount++;
        if (this._pool.length < this.maxSize) {
            this._pool.push(vec);
        }
    }

    getStats() {
        return {
            poolSize: this._pool.length,
            acquireCount: this.acquireCount,
            releaseCount: this.releaseCount,
            missCount: this.missCount
        };
    }
}

/**
 * ArrayPool: A memory pool for evaluation stacks to prevent
 * allocating new arrays during hot-path RPN evaluations.
 */
class ArrayPool {
    constructor(initialSize = 20, maxSize = 100) {
        this.maxSize = maxSize;
        this._pool = new Array(initialSize);
        for (let i = 0; i < initialSize; i++) {
            this._pool[i] = [];
        }
        this.acquireCount = 0;
        this.releaseCount = 0;
        this.missCount = 0;
    }

    acquireArray() {
        this.acquireCount++;
        if (this._pool.length > 0) {
            const arr = this._pool.pop();
            arr.length = 0; // ensure it's clean
            return arr;
        }
        this.missCount++;
        return [];
    }

    releaseArray(arr) {
        this.releaseCount++;
        if (this._pool.length < this.maxSize) {
            arr.length = 0; // clear contents to prevent memory leaks of contents
            this._pool.push(arr);
        }
    }

    getStats() {
        return {
            poolSize: this._pool.length,
            acquireCount: this.acquireCount,
            releaseCount: this.releaseCount,
            missCount: this.missCount
        };
    }
}

export const VectorPool = new RawVectorPool(256, 1000);
export const StackPool = new ArrayPool(20, 100);
