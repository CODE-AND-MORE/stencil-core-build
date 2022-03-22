"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sysNodeExternalBundles = exports.sysNode = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const webpack_1 = __importDefault(require("webpack"));
const terser_1 = require("terser");
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const relative_path_plugin_1 = require("./plugins/relative-path-plugin");
const alias_plugin_1 = require("./plugins/alias-plugin");
const pretty_minify_1 = require("./plugins/pretty-minify");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const banner_1 = require("../utils/banner");
async function sysNode(opts) {
    const inputDir = path_1.join(opts.buildDir, 'sys', 'node');
    const inputFile = path_1.join(inputDir, 'index.js');
    const outputFile = path_1.join(opts.output.sysNodeDir, 'index.js');
    // create public d.ts
    let dts = await fs_extra_1.default.readFile(path_1.join(inputDir, 'public.d.ts'), 'utf8');
    dts = dts.replace('@stencil/core/internal', '../../internal/index');
    await fs_extra_1.default.writeFile(path_1.join(opts.output.sysNodeDir, 'index.d.ts'), dts);
    // write @stencil/core/compiler/package.json
    write_pkg_json_1.writePkgJson(opts, opts.output.sysNodeDir, {
        name: '@stencil/core/sys/node',
        description: 'Stencil Node System.',
        main: 'index.js',
        types: 'index.d.ts',
    });
    const sysNodeBundle = {
        input: inputFile,
        output: {
            format: 'cjs',
            file: outputFile,
            preferConst: true,
            freeze: false,
        },
        external: ['child_process', 'crypto', 'events', 'https', 'path', 'readline', 'os', 'util'],
        plugins: [
            relative_path_plugin_1.relativePathPlugin('glob', './glob.js'),
            relative_path_plugin_1.relativePathPlugin('graceful-fs', './graceful-fs.js'),
            relative_path_plugin_1.relativePathPlugin('prompts', './prompts.js'),
            alias_plugin_1.aliasPlugin(opts),
            plugin_node_resolve_1.default({
                preferBuiltins: true,
            }),
            plugin_commonjs_1.default({
                transformMixedEsModules: false,
            }),
            pretty_minify_1.prettyMinifyPlugin(opts, banner_1.getBanner(opts, `Stencil Node System`, true)),
        ],
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            unknownGlobalSideEffects: false,
        },
    };
    const inputWorkerFile = path_1.join(opts.buildDir, 'sys', 'node', 'worker.js');
    const outputWorkerFile = path_1.join(opts.output.sysNodeDir, 'worker.js');
    const sysNodeWorkerBundle = {
        input: inputWorkerFile,
        output: {
            format: 'cjs',
            file: outputWorkerFile,
            preferConst: true,
            freeze: false,
        },
        external: ['child_process', 'crypto', 'events', 'https', 'path', 'readline', 'os', 'util'],
        plugins: [
            {
                name: 'sysNodeWorkerAlias',
                resolveId(id) {
                    if (id === '@stencil/core/compiler') {
                        return {
                            id: '../../compiler/stencil.js',
                            external: true,
                        };
                    }
                },
            },
            plugin_node_resolve_1.default({
                preferBuiltins: true,
            }),
            alias_plugin_1.aliasPlugin(opts),
            pretty_minify_1.prettyMinifyPlugin(opts, banner_1.getBanner(opts, `Stencil Node System Worker`, true)),
        ],
    };
    return [sysNodeBundle, sysNodeWorkerBundle];
}
exports.sysNode = sysNode;
async function sysNodeExternalBundles(opts) {
    const cachedDir = path_1.join(opts.scriptsBuildDir, 'sys-node-bundle-cache');
    await fs_extra_1.default.ensureDir(cachedDir);
    await Promise.all([
        bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'autoprefixer.js'),
        bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'glob.js'),
        bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'graceful-fs.js'),
        bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'node-fetch.js'),
        bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'prompts.js'),
        bundleExternal(opts, opts.output.devServerDir, cachedDir, 'open-in-editor-api.js'),
        bundleExternal(opts, opts.output.devServerDir, cachedDir, 'ws.js'),
    ]);
    // open-in-editor's visualstudio.vbs file
    const visualstudioVbsSrc = path_1.join(opts.nodeModulesDir, 'open-in-editor', 'lib', 'editors', 'visualstudio.vbs');
    const visualstudioVbsDesc = path_1.join(opts.output.devServerDir, 'visualstudio.vbs');
    await fs_extra_1.default.copy(visualstudioVbsSrc, visualstudioVbsDesc);
    // copy open's xdg-open file
    const xdgOpenSrcPath = path_1.join(opts.nodeModulesDir, 'open', 'xdg-open');
    const xdgOpenDestPath = path_1.join(opts.output.devServerDir, 'xdg-open');
    await fs_extra_1.default.copy(xdgOpenSrcPath, xdgOpenDestPath);
}
exports.sysNodeExternalBundles = sysNodeExternalBundles;
function bundleExternal(opts, outputDir, cachedDir, entryFileName) {
    return new Promise(async (resolveBundle, rejectBundle) => {
        const outputFile = path_1.join(outputDir, entryFileName);
        const cachedFile = path_1.join(cachedDir, entryFileName) + (opts.isProd ? '.min.js' : '');
        const cachedExists = fs_extra_1.default.existsSync(cachedFile);
        if (cachedExists) {
            await fs_extra_1.default.copyFile(cachedFile, outputFile);
            resolveBundle();
            return;
        }
        const whitelist = new Set(['child_process', 'os', 'typescript']);
        webpack_1.default({
            entry: path_1.join(opts.srcDir, 'sys', 'node', 'bundles', entryFileName),
            output: {
                path: outputDir,
                filename: entryFileName,
                libraryTarget: 'commonjs',
            },
            target: 'node',
            node: {
                __dirname: false,
                __filename: false,
                process: false,
                Buffer: false,
            },
            externals(_context, request, callback) {
                if (request.match(/^(\.{0,2})\//)) {
                    // absolute and relative paths are not externals
                    return callback(null, undefined);
                }
                if (request === '@stencil/core/mock-doc') {
                    return callback(null, '../../mock-doc');
                }
                if (whitelist.has(request)) {
                    // we specifically do not want to bundle these imports
                    require.resolve(request);
                    return callback(null, request);
                }
                // bundle this import
                callback(undefined, undefined);
            },
            resolve: {
                alias: {
                    '@utils': path_1.join(opts.buildDir, 'utils', 'index.js'),
                    postcss: path_1.join(opts.nodeModulesDir, 'postcss'),
                    'source-map': path_1.join(opts.nodeModulesDir, 'source-map'),
                    chalk: path_1.join(opts.bundleHelpersDir, 'empty.js'),
                },
            },
            optimization: {
                minimize: false,
            },
            mode: 'production',
        }, async (err, stats) => {
            if (err && err.message) {
                rejectBundle(err);
            }
            else {
                const info = stats.toJson({ errors: true });
                if (stats.hasErrors()) {
                    const webpackError = info.errors.join('\n');
                    rejectBundle(webpackError);
                }
                else {
                    let code = await fs_extra_1.default.readFile(outputFile, 'utf8');
                    if (opts.isProd) {
                        try {
                            const minifyResults = await terser_1.minify(code);
                            code = minifyResults.code;
                        }
                        catch (e) {
                            rejectBundle(e);
                            return;
                        }
                    }
                    await fs_extra_1.default.writeFile(cachedFile, code);
                    await fs_extra_1.default.writeFile(outputFile, code);
                    resolveBundle();
                }
            }
        });
    });
}
