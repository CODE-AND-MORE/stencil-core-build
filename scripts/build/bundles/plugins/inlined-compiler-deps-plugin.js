"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlinedCompilerDepsPlugin = void 0;
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_json_1 = __importDefault(require("@rollup/plugin-json"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const rollup_1 = require("rollup");
/**
 * Generates a rollup configuration for loading external, third party scripts that are required by the Stencil compiler
 * into the core package.
 * @param opts the options being used during a build of the Stencil compiler
 * @param inputDir the directory from which modules should be resolved. Care should be taken to observe this value at
 * build to verify where modules are being resolved from.
 * @returns a rollup plugin for bundling compiler dependencies
 */
function inlinedCompilerDepsPlugin(opts, inputDir) {
    return {
        name: 'inlinedCompilerDepsPlugin',
        resolveId(id) {
            if (id === '@compiler-deps') {
                return id;
            }
            return null;
        },
        load(id) {
            if (id === '@compiler-deps') {
                return bundleCompilerDeps(opts, inputDir);
            }
            return null;
        },
    };
}
exports.inlinedCompilerDepsPlugin = inlinedCompilerDepsPlugin;
/**
 * Bundles various compiler dependencies into the compiler. For a list of those dependencies, refer to the `input`
 * field of the rollup build invocation in this function as the source of truth.
 * @param opts the options being used during a build of the Stencil compiler
 * @param inputDir the directory from which modules should be resolved
 * @returns the bundled dependencies
 */
async function bundleCompilerDeps(opts, inputDir) {
    const cacheFile = (0, path_1.join)(opts.buildDir, 'compiler-deps-bundle-cache.js');
    if (!opts.isProd) {
        try {
            return await fs_extra_1.default.readFile(cacheFile, 'utf8');
        }
        catch (e) { }
    }
    const build = await (0, rollup_1.rollup)({
        input: (0, path_1.join)(inputDir, 'sys', 'modules', 'compiler-deps.js'),
        external: ['fs', 'module', 'path', 'util', 'resolve'],
        plugins: [
            (0, plugin_node_resolve_1.default)({
                preferBuiltins: false,
            }),
            (0, plugin_commonjs_1.default)(),
            (0, plugin_json_1.default)({
                preferConst: true,
            }),
        ],
        treeshake: {
            moduleSideEffects: false,
        },
    });
    await build.write({
        format: 'es',
        file: cacheFile,
        preferConst: true,
        banner: `// Rollup ${opts.rollupVersion}`,
    });
    return await fs_extra_1.default.readFile(cacheFile, 'utf8');
}
