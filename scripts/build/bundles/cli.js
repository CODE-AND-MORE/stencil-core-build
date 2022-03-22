"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const plugin_json_1 = __importDefault(require("@rollup/plugin-json"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const alias_plugin_1 = require("./plugins/alias-plugin");
const replace_plugin_1 = require("./plugins/replace-plugin");
const relative_path_plugin_1 = require("./plugins/relative-path-plugin");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const banner_1 = require("../utils/banner");
const rollup_plugin_sourcemaps_1 = __importDefault(require("rollup-plugin-sourcemaps"));
/**
 * Generates a rollup configuration for the `cli` submodule
 * @param opts build options needed to generate the rollup configuration
 * @returns an array containing the generated rollup options
 */
async function cli(opts) {
    const inputDir = path_1.join(opts.buildDir, 'cli');
    const outputDir = opts.output.cliDir;
    const esmFilename = 'index.js';
    const cjsFilename = 'index.cjs';
    const dtsFilename = 'index.d.ts';
    const esOutput = {
        format: 'es',
        file: path_1.join(outputDir, esmFilename),
        preferConst: true,
        sourcemap: true,
        banner: banner_1.getBanner(opts, `Stencil CLI`, true),
    };
    const cjsOutput = {
        format: 'cjs',
        file: path_1.join(outputDir, cjsFilename),
        preferConst: true,
        sourcemap: true,
        banner: banner_1.getBanner(opts, `Stencil CLI (CommonJS)`, true),
    };
    // create public d.ts
    let dts = await fs_extra_1.default.readFile(path_1.join(inputDir, 'public.d.ts'), 'utf8');
    dts = dts.replace('@stencil/core/internal', '../internal/index');
    await fs_extra_1.default.writeFile(path_1.join(opts.output.cliDir, dtsFilename), dts);
    // write @stencil/core/compiler/package.json
    write_pkg_json_1.writePkgJson(opts, opts.output.cliDir, {
        name: '@stencil/core/cli',
        description: 'Stencil CLI.',
        main: cjsFilename,
        module: esmFilename,
        types: dtsFilename,
    });
    const cliBundle = {
        input: path_1.join(inputDir, 'index.js'),
        output: [esOutput, cjsOutput],
        external: ['path'],
        plugins: [
            relative_path_plugin_1.relativePathPlugin('@stencil/core/testing', '../testing/index.js'),
            relative_path_plugin_1.relativePathPlugin('prompts', '../sys/node/prompts.js'),
            alias_plugin_1.aliasPlugin(opts),
            plugin_node_resolve_1.default({
                preferBuiltins: true,
            }),
            plugin_commonjs_1.default(),
            plugin_json_1.default({
                preferConst: true,
            }),
            replace_plugin_1.replacePlugin(opts),
            rollup_plugin_sourcemaps_1.default(),
        ],
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            unknownGlobalSideEffects: false,
        },
    };
    return [cliBundle];
}
exports.cli = cli;
