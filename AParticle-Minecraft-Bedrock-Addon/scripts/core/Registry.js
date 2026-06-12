import { system, world } from "@minecraft/server";
import { MathInterpreter } from "./MathInterpreter.js";

const CHUNK_SIZE = 32000;

/**
 * Registry: Central memory cache for saved parametric functions and animation groups.
 * Prevents re-parsing of expressions every tick by storing the RPN forms.
 * Persists data across world restarts using chunked dynamic properties.
 */
class ParticleRegistry {
    constructor() {
        /**
         * @type {Map<string, {name: string, particleId: string, exprX: string, exprY: string, exprZ: string, rpnX: any[], rpnY: any[], rpnZ: any[], step: number, range: number, options: any}>}
         */
        this.savedFunctions = new Map();

        /**
         * @type {Map<string, {name: string, functions: string[], delays: number[]}>}
         */
        this.animationGroups = new Map();
    }

    /**
     * Splits and saves serialized data into chunked world dynamic properties.
     * @private
     */
    _saveChunks(baseKey, data, maxChunks) {
        for (let i = 1; i <= maxChunks; i++) {
            const startIndex = (i - 1) * CHUNK_SIZE;
            if (startIndex < data.length) {
                const chunk = data.substring(startIndex, startIndex + CHUNK_SIZE);
                world.setDynamicProperty(`aparticle:${baseKey}_${i}`, chunk);
            } else {
                world.setDynamicProperty(`aparticle:${baseKey}_${i}`, undefined);
            }
        }
    }

    /**
     * Loads and joins serialized data from chunked world dynamic properties.
     * @private
     */
    _loadChunks(baseKey, maxChunks) {
        let result = "";
        for (let i = 1; i <= maxChunks; i++) {
            const val = world.getDynamicProperty(`aparticle:${baseKey}_${i}`);
            if (typeof val === "string") {
                result += val;
            }
        }
        return result;
    }

    /**
     * Saves all current functions and groups to persistent storage.
     * Wrapped in system.run to avoid Read-only context database modification errors.
     */
    save() {
        system.run(() => {
            try {
                // Remove the bulky compiled RPN arrays before saving to conserve space
                const cleanFunctions = {};
                for (const [key, val] of this.savedFunctions.entries()) {
                    cleanFunctions[key] = {
                        name: val.name,
                        particleId: val.particleId,
                        exprX: val.exprX,
                        exprY: val.exprY,
                        exprZ: val.exprZ,
                        step: val.step,
                        range: val.range,
                        options: val.options
                    };
                }
                const funcsData = JSON.stringify(cleanFunctions);
                this._saveChunks("funcs", funcsData, 3);

                const groupsData = JSON.stringify(Object.fromEntries(this.animationGroups));
                this._saveChunks("groups", groupsData, 2);
            } catch (e) {
                console.warn(`[AParticle] Error saving registry database: ${e.message}`);
            }
        });
    }

    /**
     * Loads functions and groups from persistent storage, compiling math expressions on-the-fly.
     */
    load() {
        try {
            const funcsRaw = this._loadChunks("funcs", 3);
            if (funcsRaw) {
                const parsedFuncs = JSON.parse(funcsRaw);
                this.savedFunctions.clear();
                for (const [key, val] of Object.entries(parsedFuncs)) {
                    try {
                        const rpnX = MathInterpreter.toRPN(MathInterpreter.tokenize(val.exprX));
                        const rpnY = MathInterpreter.toRPN(MathInterpreter.tokenize(val.exprY));
                        const rpnZ = MathInterpreter.toRPN(MathInterpreter.tokenize(val.exprZ));
                        this.savedFunctions.set(key, {
                            ...val,
                            rpnX, rpnY, rpnZ
                        });
                    } catch (err) {
                        console.warn(`[AParticle] Failed to compile loaded function '${key}': ${err.message}`);
                    }
                }
            }

            const groupsRaw = this._loadChunks("groups", 2);
            if (groupsRaw) {
                const parsedGroups = JSON.parse(groupsRaw);
                this.animationGroups = new Map(Object.entries(parsedGroups));
            }
        } catch (e) {
            console.warn(`[AParticle] Error loading registry database: ${e.message}`);
        }
    }

    /**
     * @param {string} name 
     * @param {Object} config 
     */
    saveFunction(name, config) {
        if (!name || typeof name !== 'string') throw new Error("Invalid function name.");
        if (!config.exprX || !config.exprY || !config.exprZ) throw new Error("Missing mathematical expressions.");
        
        const lowerName = name.toLowerCase();

        // Pre-compile RPN once to validate syntax and cache it
        const rpnX = MathInterpreter.toRPN(MathInterpreter.tokenize(config.exprX));
        const rpnY = MathInterpreter.toRPN(MathInterpreter.tokenize(config.exprY));
        const rpnZ = MathInterpreter.toRPN(MathInterpreter.tokenize(config.exprZ));

        this.savedFunctions.set(lowerName, {
            name: lowerName,
            particleId: config.particleId || "minecraft:basic_flame_particle",
            exprX: config.exprX,
            exprY: config.exprY,
            exprZ: config.exprZ,
            rpnX: rpnX,
            rpnY: rpnY,
            rpnZ: rpnZ,
            step: config.step || 0.1,
            range: config.range || 6.28,
            options: config.options || {}
        });

        this.save();
    }

    getFunction(name) {
        if (!name) return null;
        return this.savedFunctions.get(name.toLowerCase()) || null;
    }

    deleteFunction(name) {
        if (!name) return false;
        const deleted = this.savedFunctions.delete(name.toLowerCase());
        if (deleted) {
            this.save();
        }
        return deleted;
    }

    /**
     * @param {string} name 
     * @param {Object} groupConfig 
     */
    saveGroup(name, groupConfig) {
        if (!name || typeof name !== 'string') throw new Error("Invalid group name.");
        if (!Array.isArray(groupConfig.functions)) throw new Error("Group must have a functions array.");
        
        // Validate that all functions exist
        for (const funcName of groupConfig.functions) {
            if (!this.getFunction(funcName)) {
                throw new Error(`Cannot save group: Function '${funcName}' does not exist.`);
            }
        }

        this.animationGroups.set(name.toLowerCase(), {
            name: name.toLowerCase(),
            functions: groupConfig.functions.map(f => f.toLowerCase()),
            delays: groupConfig.delays || new Array(groupConfig.functions.length).fill(0)
        });

        this.save();
    }

    getGroup(name) {
        if (!name) return null;
        return this.animationGroups.get(name.toLowerCase()) || null;
    }

    deleteGroup(name) {
        if (!name) return false;
        const deleted = this.animationGroups.delete(name.toLowerCase());
        if (deleted) {
            this.save();
        }
        return deleted;
    }

    listFunctions() {
        return Array.from(this.savedFunctions.keys());
    }

    listGroups() {
        return Array.from(this.animationGroups.keys());
    }
}

export const Registry = new ParticleRegistry();
