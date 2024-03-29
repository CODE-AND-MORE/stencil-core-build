"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalHydrate = void 0;
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const banner_1 = require("../utils/banner");
const bundle_dts_1 = require("../utils/bundle-dts");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const alias_plugin_1 = require("./plugins/alias-plugin");
const pretty_minify_1 = require("./plugins/pretty-minify");
const replace_plugin_1 = require("./plugins/replace-plugin");
async function internalHydrate(opts) {
    const inputHydrateDir = (0, path_1.join)(opts.buildDir, 'hydrate');
    const outputInternalHydrateDir = (0, path_1.join)(opts.output.internalDir, 'hydrate');
    await fs_extra_1.default.emptyDir(outputInternalHydrateDir);
    // write @stencil/core/internal/hydrate/package.json
    (0, write_pkg_json_1.writePkgJson)(opts, outputInternalHydrateDir, {
        name: '@stencil/core/internal/hydrate',
        description: 'Stencil internal hydrate platform to be imported by the Stencil Compiler. Breaking changes can and will happen at any time.',
        main: 'index.js',
    });
    await createHydrateRunnerDtsBundle(opts, inputHydrateDir, outputInternalHydrateDir);
    const hydratePlatformInput = (0, path_1.join)(inputHydrateDir, 'platform', 'index.js');
    const internalHydratePlatformBundle = {
        input: hydratePlatformInput,
        output: {
            format: 'es',
            dir: outputInternalHydrateDir,
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            banner: (0, banner_1.getBanner)(opts, 'Stencil Hydrate Platform'),
            preferConst: true,
        },
        plugins: [
            {
                name: 'internalHydratePlugin',
                resolveId(importee) {
                    if (importee === '@platform') {
                        return hydratePlatformInput;
                    }
                },
            },
            (0, alias_plugin_1.aliasPlugin)(opts),
            (0, replace_plugin_1.replacePlugin)(opts),
            (0, plugin_node_resolve_1.default)({
                preferBuiltins: true,
            }),
            (0, plugin_commonjs_1.default)(),
            (0, pretty_minify_1.prettyMinifyPlugin)(opts),
        ],
    };
    const internalHydrateRunnerBundle = {
        input: (0, path_1.join)(inputHydrateDir, 'runner', 'index.js'),
        output: {
            format: 'es',
            file: (0, path_1.join)(outputInternalHydrateDir, 'runner.js'),
            banner: (0, banner_1.getBanner)(opts, 'Stencil Hydrate Runner'),
            preferConst: true,
        },
        plugins: [
            (0, alias_plugin_1.aliasPlugin)(opts),
            (0, replace_plugin_1.replacePlugin)(opts),
            (0, plugin_node_resolve_1.default)({
                preferBuiltins: true,
            }),
            (0, plugin_commonjs_1.default)(),
            (0, pretty_minify_1.prettyMinifyPlugin)(opts),
        ],
    };
    return [internalHydratePlatformBundle, internalHydrateRunnerBundle];
}
exports.internalHydrate = internalHydrate;
async function createHydrateRunnerDtsBundle(opts, inputHydrateDir, outputDir) {
    // bundle @stencil/core/internal/hydrate/runner.d.ts
    const dtsEntry = (0, path_1.join)(inputHydrateDir, 'runner', 'index.d.ts');
    const dtsContent = await (0, bundle_dts_1.bundleDts)(opts, dtsEntry);
    const outputPath = (0, path_1.join)(outputDir, 'runner.d.ts');
    await fs_extra_1.default.writeFile(outputPath, dtsContent);
}
