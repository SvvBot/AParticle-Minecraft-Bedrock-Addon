import { system, world, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { CommandParser } from "./core/CommandParser.js";
import { Registry } from "./core/Registry.js";
import { MathInterpreter } from "./core/MathInterpreter.js";
import { Timeline } from "./performance/Timeline.js";
import { Spawner } from "./features/Spawner.js";
import { Matrix } from "./features/Matrix.js";
import { Logger } from "./utils/Logger.js";
import { PerformanceMonitor } from "./performance/PerformanceMonitor.js";
import { VectorPool, StackPool } from "./core/ObjectPool.js";
import { Settings } from "./core/Settings.js";

// ─── Timeline & Registry Boot ───────────────────────────────
system.run(() => {
    Registry.load();
});

// Runs every single game tick to advance all active generators
system.runInterval(() => {
    Timeline.tick();
}, 1);

// ─── Custom Command Registration ────────────────────────────
// Uses the native Custom Commands API (system.beforeEvents.startup)
// Commands are registered as /aparticle:spawn, /aparticle:save, etc.
system.beforeEvents.startup.subscribe((initEvent) => {
    const registry = initEvent.customCommandRegistry;

    // ── /aparticle:spawn ────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:spawn",
            description: "Spawn a parametric particle shape at specified position.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "coords", type: CustomCommandParamType.String },
                { name: "expr_x", type: CustomCommandParamType.String },
                { name: "expr_y", type: CustomCommandParamType.String },
                { name: "expr_z", type: CustomCommandParamType.String },
            ],
            optionalParameters: [
                { name: "particle", type: CustomCommandParamType.String },
                { name: "step",    type: CustomCommandParamType.Float },
                { name: "range",   type: CustomCommandParamType.Float },
            ],
        },
        (origin, coords, exprX, exprY, exprZ, particle, step, range) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                try {
                    const loc = sourceEntity.location;
                    const pPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };

                    let rotationMatrix = null;
                    if (coords.startsWith('^')) {
                        rotationMatrix = Matrix.createRotationFromFacing(sourceEntity);
                    }

                    const centerPos = CommandParser.parseCoordinateString(coords, pPos, rotationMatrix);
                    const cleanX = CommandParser.parseExpression(exprX);
                    const cleanY = CommandParser.parseExpression(exprY);
                    const cleanZ = CommandParser.parseExpression(exprZ);
                    const particleId = particle || "minecraft:basic_flame_particle";
                    const safeStep  = step  || 0.1;
                    const safeRange = range || 6.28;

                    const options = {};
                    if (rotationMatrix) {
                        options.rotationMatrix = rotationMatrix;
                    }

                    const gen = Spawner.spawnParametric(
                        sourceEntity.dimension, particleId,
                        cleanX, cleanY, cleanZ,
                        centerPos, safeStep, safeRange, options
                    );
                    const jobId = Timeline.addJob(gen, "spawn_cmd");
                    Logger.success(sourceEntity, `Spawned particle shape (${jobId}).`);
                } catch (e) {
                    Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );

    // ── /aparticle:save ─────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:save",
            description: "Save a parametric particle function for later use.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "name",   type: CustomCommandParamType.String },
                { name: "expr_x", type: CustomCommandParamType.String },
                { name: "expr_y", type: CustomCommandParamType.String },
                { name: "expr_z", type: CustomCommandParamType.String },
            ],
            optionalParameters: [
                { name: "particle", type: CustomCommandParamType.String },
                { name: "step",    type: CustomCommandParamType.Float },
                { name: "range",   type: CustomCommandParamType.Float },
            ],
        },
        (origin, name, exprX, exprY, exprZ, particle, step, range) => {
            const sourceEntity = origin.sourceEntity;

            system.run(() => {
                try {
                    const cleanX = CommandParser.parseExpression(exprX);
                    const cleanY = CommandParser.parseExpression(exprY);
                    const cleanZ = CommandParser.parseExpression(exprZ);
                    const particleId = particle || "minecraft:basic_flame_particle";
                    const safeStep  = step  || 0.1;
                    const safeRange = range || 6.28;

                    Registry.saveFunction(name, {
                        particleId,
                        exprX: cleanX,
                        exprY: cleanY,
                        exprZ: cleanZ,
                        step: safeStep,
                        range: safeRange,
                        options: {}
                    });

                    if (sourceEntity) Logger.success(sourceEntity, `Saved function '${name}'.`);
                } catch (e) {
                    if (sourceEntity) Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );

    // ── /aparticle:play ─────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:play",
            description: "Play a previously saved particle function or group.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "name", type: CustomCommandParamType.String },
            ],
            optionalParameters: [
                { name: "coords", type: CustomCommandParamType.String },
            ],
        },
        (origin, name, coords) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                try {
                    const savedFunc = Registry.getFunction(name);
                    if (savedFunc) {
                        let centerPos;
                        let rotationMatrix = null;

                        if (coords !== undefined) {
                            const loc = sourceEntity.location;
                            const pPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                            if (coords.startsWith('^')) {
                                rotationMatrix = Matrix.createRotationFromFacing(sourceEntity);
                            }
                            centerPos = CommandParser.parseCoordinateString(coords, pPos, rotationMatrix);
                        } else {
                            const loc = sourceEntity.location;
                            centerPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                        }

                        const options = {};
                        if (rotationMatrix) {
                            options.rotationMatrix = rotationMatrix;
                        }

                        const gen = Spawner.spawnFromRPN(
                            sourceEntity.dimension,
                            savedFunc.particleId,
                            savedFunc.rpnX, savedFunc.rpnY, savedFunc.rpnZ,
                            centerPos, savedFunc.step, savedFunc.range,
                            options
                        );
                        const jobId = Timeline.addJob(gen, `play_${name}`);
                        Logger.success(sourceEntity, `Playing '${name}' (${jobId}).`);
                        return;
                    }

                    const savedGroup = Registry.getGroup(name);
                    if (savedGroup) {
                        let centerPos;
                        let rotationMatrix = null;

                        if (coords !== undefined) {
                            const loc = sourceEntity.location;
                            const pPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                            if (coords.startsWith('^')) {
                                rotationMatrix = Matrix.createRotationFromFacing(sourceEntity);
                            }
                            centerPos = CommandParser.parseCoordinateString(coords, pPos, rotationMatrix);
                        } else {
                            const loc = sourceEntity.location;
                            centerPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                        }

                        for (let i = 0; i < savedGroup.functions.length; i++) {
                            const funcName = savedGroup.functions[i];
                            const delayTicks = savedGroup.delays[i] || 0;
                            const subFunc = Registry.getFunction(funcName);
                            if (!subFunc) {
                                Logger.warn(`Sub-function '${funcName}' in group '${name}' not found, skipping.`);
                                continue;
                            }

                            const options = {};
                            if (rotationMatrix) {
                                options.rotationMatrix = rotationMatrix;
                            }

                            const gen = Spawner.spawnFromRPN(
                                sourceEntity.dimension,
                                subFunc.particleId,
                                subFunc.rpnX, subFunc.rpnY, subFunc.rpnZ,
                                centerPos, subFunc.step, subFunc.range,
                                options
                            );
                            Timeline.addJob(gen, `group_${name}_${funcName}`, delayTicks);
                        }
                        Logger.success(sourceEntity, `Playing group '${name}'.`);
                        return;
                    }

                    throw new Error(`'${name}' not found. Use /aparticle:list`);
                } catch (e) {
                    Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );

    // ── /aparticle:savegroup ────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:savegroup",
            description: "Save an animation group with staggered delays.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "name",      type: CustomCommandParamType.String },
                { name: "functions", type: CustomCommandParamType.String },
            ],
            optionalParameters: [
                { name: "delay",     type: CustomCommandParamType.Float },
            ],
        },
        (origin, name, functionsStr, delay) => {
            const sourceEntity = origin.sourceEntity;

            system.run(() => {
                try {
                    const names = functionsStr.split(",").map(n => n.trim()).filter(n => n.length > 0);
                    if (names.length === 0) throw new Error("No function names specified.");
                    
                    const delaySeconds = delay || 0;
                    const delayTicks = Math.floor(delaySeconds * 20);
                    const delays = names.map((_, idx) => idx * delayTicks);

                    Registry.saveGroup(name, {
                        functions: names,
                        delays: delays
                    });

                    if (sourceEntity) Logger.success(sourceEntity, `Saved group '${name}' with functions: ${names.join(', ')}`);
                } catch (e) {
                    if (sourceEntity) Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );

    // ── /aparticle:group ────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:group",
            description: "Play multiple saved functions with staggered delays on the fly.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "names", type: CustomCommandParamType.String },
            ],
            optionalParameters: [
                { name: "delay",  type: CustomCommandParamType.Float },
                { name: "coords", type: CustomCommandParamType.String },
            ],
        },
        (origin, namesStr, delay, coords) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                try {
                    const names = namesStr.split(",").map(n => n.trim()).filter(n => n.length > 0);
                    const delayTicks = Math.floor((delay || 0) * 20);

                    if (names.length === 0) throw new Error("No function names specified.");

                    let centerPos;
                    let rotationMatrix = null;

                    if (coords !== undefined) {
                        const loc = sourceEntity.location;
                        const pPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                        if (coords.startsWith('^')) {
                            rotationMatrix = Matrix.createRotationFromFacing(sourceEntity);
                        }
                        centerPos = CommandParser.parseCoordinateString(coords, pPos, rotationMatrix);
                    } else {
                        const loc = sourceEntity.location;
                        centerPos = { x: loc.x, y: loc.y + 1.0, z: loc.z };
                    }

                    let currentDelay = 0;
                    for (const funcName of names) {
                        const savedFunc = Registry.getFunction(funcName);
                        if (!savedFunc) {
                            Logger.error(sourceEntity, `Function '${funcName}' not found, skipping.`);
                            continue;
                        }

                        const options = {};
                        if (rotationMatrix) {
                            options.rotationMatrix = rotationMatrix;
                        }

                        const gen = Spawner.spawnFromRPN(
                            sourceEntity.dimension,
                            savedFunc.particleId,
                            savedFunc.rpnX, savedFunc.rpnY, savedFunc.rpnZ,
                            centerPos, savedFunc.step, savedFunc.range,
                            options
                        );
                        Timeline.addJob(gen, `group_${funcName}`, currentDelay);
                        currentDelay += delayTicks;
                    }
                    Logger.success(sourceEntity, `Group started: ${names.join(', ')} (delay=${delay || 0}s)`);
                } catch (e) {
                    Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );

    // ── /aparticle:list ─────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:list",
            description: "List all saved functions and groups.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
        },
        (origin) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                const funcs  = Registry.listFunctions();
                const groups = Registry.listGroups();

                sourceEntity.sendMessage("§b=== AParticle List ===");
                sourceEntity.sendMessage(`§aSaved Functions: §f${funcs.length > 0 ? funcs.join(', ') : '(none)'}`);
                sourceEntity.sendMessage(`§aSaved Groups: §f${groups.length > 0 ? groups.join(', ') : '(none)'}`);
                sourceEntity.sendMessage(`§7Active Jobs: ${Timeline.getActiveCount()} | Pending: ${Timeline.getPendingCount()}`);
            });
        }
    );

    // ── /aparticle:delete ───────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:delete",
            description: "Delete a saved function or group.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "name", type: CustomCommandParamType.String },
            ],
        },
        (origin, name) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                if (Registry.deleteFunction(name)) {
                    Logger.success(sourceEntity, `Deleted function '${name}'.`);
                } else if (Registry.deleteGroup(name)) {
                    Logger.success(sourceEntity, `Deleted group '${name}'.`);
                } else {
                    Logger.error(sourceEntity, `'${name}' not found.`);
                }
            });
        }
    );

    // ── /aparticle:stop ─────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:stop",
            description: "Stop all active particle jobs.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
        },
        (origin) => {
            const sourceEntity = origin.sourceEntity;

            system.run(() => {
                const count = Timeline.getActiveCount() + Timeline.getPendingCount();
                Timeline.cancelAll();
                if (sourceEntity) Logger.success(sourceEntity, `Stopped ${count} particle job(s).`);
            });
        }
    );

    // ── /aparticle:debug ────────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:debug",
            description: "Show memory pool and performance statistics.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
        },
        (origin) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                const vecStats   = VectorPool.getStats();
                const stackStats = StackPool.getStats();
                const perfStats  = PerformanceMonitor.getStats();

                sourceEntity.sendMessage("§b=== AParticle Debug ===");
                sourceEntity.sendMessage(`§eVectorPool: §fsize=${vecStats.poolSize} acq=${vecStats.acquireCount} rel=${vecStats.releaseCount} miss=${vecStats.missCount}`);
                sourceEntity.sendMessage(`§eArrayPool:  §fsize=${stackStats.poolSize} acq=${stackStats.acquireCount} rel=${stackStats.releaseCount} miss=${stackStats.missCount}`);
                sourceEntity.sendMessage(`§ePerf:       §fbatch=${perfStats.currentBatchSize} avg=${perfStats.rollingAvgMs}ms samples=${perfStats.totalRecordings}`);
                sourceEntity.sendMessage(`§eJobs:       §factive=${Timeline.getActiveCount()} pending=${Timeline.getPendingCount()}`);
                sourceEntity.sendMessage(`§eFunctions:  §f${Registry.listFunctions().length} saved`);
            });
        }
    );

    // ── /aparticle:setting ──────────────────────────────
    registry.registerCommand(
        {
            name: "aparticle:setting",
            description: "View or modify AParticle settings.",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            optionalParameters: [
                { name: "name",  type: CustomCommandParamType.String },
                { name: "value", type: CustomCommandParamType.String },
            ],
        },
        (origin, name, value) => {
            const sourceEntity = origin.sourceEntity;
            if (!sourceEntity) return;

            system.run(() => {
                try {
                    if (name === undefined) {
                        const allSettings = Settings.getAll();
                        sourceEntity.sendMessage("§b=== AParticle Settings ===");
                        for (const [key, val] of Object.entries(allSettings)) {
                            sourceEntity.sendMessage(`§a${key}: §f${val}`);
                        }
                        return;
                    }

                    const key = name.toLowerCase();

                    if (Settings.get(key) === undefined) {
                        throw new Error(`Unknown setting: '${name}'`);
                    }

                    if (value === undefined) {
                        const val = Settings.get(key);
                        sourceEntity.sendMessage(`§b[AParticle] §a${key} §fis currently §a${val}`);
                        return;
                    }

                    let parsedValue;
                    if (value.toLowerCase() === "true") {
                        parsedValue = true;
                    } else if (value.toLowerCase() === "false") {
                        parsedValue = false;
                    } else {
                        throw new Error(`Invalid value: '${value}'. Must be 'true' or 'false'.`);
                    }

                    Settings.set(key, parsedValue);
                    Logger.success(sourceEntity, `Updated setting '${key}' to ${parsedValue}`);
                } catch (e) {
                    Logger.error(sourceEntity, e.message || String(e));
                }
            });
        }
    );
});
