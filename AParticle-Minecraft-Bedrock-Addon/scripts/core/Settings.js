import { world } from "@minecraft/server";

const DEFAULT_SETTINGS = {
    "debug_console": true,
    "debug_actionbar": true
};

class SettingsManager {
    /**
     * Gets a setting value. Returns default if undefined or not yet set.
     * @param {string} key 
     * @returns {boolean|undefined}
     */
    get(key) {
        if (!DEFAULT_SETTINGS.hasOwnProperty(key)) {
            return undefined;
        }
        try {
            const val = world.getDynamicProperty(`aparticle:${key}`);
            if (val === undefined) {
                return DEFAULT_SETTINGS[key];
            }
            return val;
        } catch (e) {
            return DEFAULT_SETTINGS[key];
        }
    }

    /**
     * Sets a setting value. Throws error if key is not whitelisted.
     * @param {string} key 
     * @param {boolean} value 
     * @returns {boolean}
     */
    set(key, value) {
        if (!DEFAULT_SETTINGS.hasOwnProperty(key)) {
            throw new Error(`Setting '${key}' is not allowed (not whitelisted).`);
        }
        world.setDynamicProperty(`aparticle:${key}`, value);
        return true;
    }

    /**
     * Returns all whitelisted settings and their current values.
     * @returns {Object}
     */
    getAll() {
        const all = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
            all[key] = this.get(key);
        }
        return all;
    }
}

export const Settings = new SettingsManager();
