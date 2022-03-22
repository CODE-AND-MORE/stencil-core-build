"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sysModulesPlugin = void 0;
const path_1 = __importDefault(require("path"));
/**
 * Modules that are polyfilled by Stencil, rather than using the default Node implementation.
 */
const modules = new Set(['crypto', 'events', 'fs', 'module', 'os', 'path', 'stream', 'url', 'util']);
/**
 * Rollup plugin that aids in resolving various system level (sys) modules properly.
 * @param inputDir the directory from which modules should be resolved. Care should be taken to observe this value at
 * build to verify where modules are being resolved from.
 * @returns the rollup plugin that resolves Stencil `sys` modules
 */
function sysModulesPlugin(inputDir) {
    return {
        name: 'sysModulesPlugin',
        /**
         * A rollup build hook for resolving Stencil's environment agnostic packages
         * [Source](https://rollupjs.org/guide/en/#resolveid)
         * @param importee the importee exactly as it is written in an import statement in the source code
         * @returns a string that resolves an import to some id, null otherwise
         */
        resolveId(importee) {
            if (modules.has(importee)) {
                return path_1.default.join(inputDir, 'sys', 'modules', `${importee}.js`);
            }
            return null;
        },
    };
}
exports.sysModulesPlugin = sysModulesPlugin;
