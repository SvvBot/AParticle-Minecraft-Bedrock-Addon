export class Matrix {
    /**
     * Creates a 3x3 rotation matrix using Euler angles (yaw, pitch).
     * @param {number} yawDegrees 
     * @param {number} pitchDegrees 
     * @returns {Float64Array} 9-element array representing 3x3 matrix
     */
    static createRotationMatrix(yawDegrees, pitchDegrees) {
        // Convert to radians
        const yaw = yawDegrees * (Math.PI / 180);
        const pitch = pitchDegrees * (Math.PI / 180);

        // Rotation around Y axis (Yaw)
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);

        // Rotation around X axis (Pitch)
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);

        const m = new Float64Array(9);

        // Combined Ry * Rx
        m[0] = cy;
        m[1] = sy * sp;
        m[2] = sy * cp;

        m[3] = 0;
        m[4] = cp;
        m[5] = -sp;

        m[6] = -sy;
        m[7] = cy * sp;
        m[8] = cy * cp;

        return m;
    }

    /**
     * Extracts pitch and yaw from a player and returns a rotation matrix.
     * @param {Player} player 
     * @returns {Float64Array}
     */
    static createRotationFromFacing(player) {
        const rot = player.getRotation(); // { x: pitch, y: yaw }
        return this.createRotationMatrix(-rot.y, rot.x);
    }

    /**
     * Applies a 3x3 rotation matrix to a Vector3 in-place.
     * @param {Vector3} vec 
     * @param {Float64Array} m 
     */
    static applyRotation(vec, m) {
        const rx = vec.x;
        const ry = vec.y;
        const rz = vec.z;
        
        vec.x = m[0]*rx + m[1]*ry + m[2]*rz;
        vec.y = m[3]*rx + m[4]*ry + m[5]*rz;
        vec.z = m[6]*rx + m[7]*ry + m[8]*rz;
    }

    /**
     * Generator for a 2D grid of points (useful for pixel art style effects).
     * Yields relative {x, y, z} offsets.
     */
    static *generateGridPoints(width, height, spacing) {
        const startX = -(width * spacing) / 2;
        const startY = -(height * spacing) / 2;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                yield {
                    x: startX + (x * spacing),
                    y: startY + (y * spacing),
                    z: 0
                };
            }
        }
    }
}
