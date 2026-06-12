import { Settings } from "../core/Settings.js";

export class Logger {
    /**
     * Sends an info message to a player's action bar.
     * @param {import("@minecraft/server").Player} player 
     * @param {string} message 
     */
    static info(player, message) {
        if (!player) return;
        if (!Settings.get("debug_actionbar")) return;
        try {
            player.onScreenDisplay.setActionBar(`§b[AParticle] §f${message}`);
        } catch (e) {
            if (Settings.get("debug_console")) {
                console.warn(`[AParticle] ${message}`);
            }
        }
    }

    /**
     * Sends a success message to a player's action bar.
     * @param {import("@minecraft/server").Player} player 
     * @param {string} message 
     */
    static success(player, message) {
        if (!player) return;
        if (!Settings.get("debug_actionbar")) return;
        try {
            player.onScreenDisplay.setActionBar(`§a[AParticle] §f${message}`);
        } catch (e) {
            if (Settings.get("debug_console")) {
                console.warn(`[AParticle] ${message}`);
            }
        }
    }

    /**
     * Sends an error message to a player's action bar AND logs to console.
     * @param {import("@minecraft/server").Player} player 
     * @param {string} message 
     */
    static error(player, message) {
        if (player && Settings.get("debug_actionbar")) {
            try {
                player.onScreenDisplay.setActionBar(`§c[AParticle Error] §f${message}`);
            } catch (e) {
                // Fallback if onScreenDisplay is unavailable
            }
        }
        if (Settings.get("debug_console")) {
            console.warn(`[AParticle Error] ${message}`);
        }
    }

    /**
     * Logs a warning to the server console (no player needed).
     * @param {string} message 
     */
    static warn(message) {
        if (Settings.get("debug_console")) {
            console.warn(`[AParticle Warning] ${message}`);
        }
    }
}
