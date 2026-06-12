/**
 * Parses raw argument strings from custom commands.
 */
export class CommandParser {
    /**
     * Parses a string of key=value pairs into a Map.
     * Supports quoted strings like expr_x="cos(t) * 2"
     * 
     * @param {string} argsString 
     * @returns {Map<string, string|number|boolean>}
     */
    static parseArgs(argsString) {
        const result = new Map();
        if (!argsString) return result;

        // Regex to match key=value or key="value" or key='value'
        const regex = /([a-zA-Z0-9_]+)=((?:"[^"]*")|(?:'[^']*')|(?:[^\s]+))/g;
        let match;

        while ((match = regex.exec(argsString)) !== null) {
            const key = match[1].toLowerCase();
            let value = match[2];

            // Remove surrounding quotes if they exist
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }

            // Convert to number if applicable
            if (!isNaN(value) && value.trim() !== '') {
                result.set(key, Number(value));
            } else if (value.toLowerCase() === 'true') {
                result.set(key, true);
            } else if (value.toLowerCase() === 'false') {
                result.set(key, false);
            } else {
                result.set(key, value);
            }
        }

        return result;
    }

    /**
     * Validates and cleans a mathematical expression string.
     * 
     * @param {string} exprString 
     * @returns {string} Cleaned expression or throws Error if invalid
     */
    static parseExpression(exprString) {
        if (!exprString || typeof exprString !== 'string') {
            throw new Error("Invalid expression: Must be a non-empty string");
        }

        let cleaned = exprString.trim();

        // Check for suspicious characters (only allow math-related chars)
        // Allow: a-z, A-Z, 0-9, (), +, -, *, /, ^, ., comma, space
        const validCharsRegex = /^[a-zA-Z0-9().+\-*/^\s,]+$/;
        if (!validCharsRegex.test(cleaned)) {
            throw new Error(`Invalid expression: Contains unsupported characters. Allowed characters: alphanumeric, spaces, and ()+-*/^.,`);
        }

        // Specific blocklist just in case
        if (cleaned.includes('eval') || cleaned.includes('Function') || cleaned.includes('require')) {
            throw new Error("Invalid expression: Prohibited keywords detected.");
        }

        return cleaned;
    }

    /**
     * Parses Minecraft-style absolute (~ ~ ~) or local (^ ^ ^) coordinates relative to base position.
     * @param {string} xStr 
     * @param {string} yStr 
     * @param {string} zStr 
     * @param {{x: number, y: number, z: number}} pPos
     * @param {Float64Array} [rotationMatrix]
     * @returns {{x: number, y: number, z: number}}
     */
    static parseCoordinateTriple(xStr, yStr, zStr, pPos, rotationMatrix) {
        const isCaretX = xStr.startsWith('^');
        const isCaretY = yStr.startsWith('^');
        const isCaretZ = zStr.startsWith('^');

        if (isCaretX || isCaretY || isCaretZ) {
            if (!isCaretX || !isCaretY || !isCaretZ) {
                throw new Error("Cannot mix caret (^) and non-caret coordinates.");
            }

            const parseCaret = (str) => {
                const valStr = str.substring(1);
                if (valStr === "") return 0;
                const parsed = parseFloat(valStr);
                if (isNaN(parsed)) throw new Error(`Invalid coordinate: ${str}`);
                return parsed;
            };

            const left = parseCaret(xStr);
            const up = parseCaret(yStr);
            const forward = parseCaret(zStr);

            if (rotationMatrix) {
                // Rotate caret offsets using player's rotation matrix
                const rx = rotationMatrix[0]*left + rotationMatrix[1]*up + rotationMatrix[2]*forward;
                const ry = rotationMatrix[3]*left + rotationMatrix[4]*up + rotationMatrix[5]*forward;
                const rz = rotationMatrix[6]*left + rotationMatrix[7]*up + rotationMatrix[8]*forward;

                return {
                    x: pPos.x + rx,
                    y: pPos.y + ry,
                    z: pPos.z + rz
                };
            } else {
                return {
                    x: pPos.x + left,
                    y: pPos.y + up,
                    z: pPos.z + forward
                };
            }
        }

        const parseCoord = (str, baseVal, symbol) => {
            if (str.startsWith(symbol)) {
                const valStr = str.substring(1);
                if (valStr === "") return baseVal;
                const parsed = parseFloat(valStr);
                if (isNaN(parsed)) throw new Error(`Invalid coordinate: ${str}`);
                return baseVal + parsed;
            } else {
                const parsed = parseFloat(str);
                if (isNaN(parsed)) throw new Error(`Invalid coordinate: ${str}`);
                return parsed;
            }
        };

        const x = parseCoord(xStr, pPos.x, '~');
        const y = parseCoord(yStr, pPos.y, '~');
        const z = parseCoord(zStr, pPos.z, '~');

        return { x, y, z };
    }

    /**
     * Parses a Minecraft-style space-separated coordinate string (e.g. "~ ~5 ~-2")
     * @param {string} coordsStr 
     * @param {{x: number, y: number, z: number}} pPos
     * @param {Float64Array} [rotationMatrix]
     * @returns {{x: number, y: number, z: number}}
     */
    static parseCoordinateString(coordsStr, pPos, rotationMatrix) {
        if (!coordsStr || typeof coordsStr !== 'string') {
            throw new Error("Invalid coordinate string.");
        }
        const parts = coordsStr.trim().split(/\s+/);
        if (parts.length !== 3) {
            throw new Error(`Invalid coordinate format: "${coordsStr}". Must be 3 space-separated coordinates (e.g. "~ ~ ~" or "^ ^ ^").`);
        }
        return this.parseCoordinateTriple(parts[0], parts[1], parts[2], pPos, rotationMatrix);
    }
}
