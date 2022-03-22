"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalClient = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const alias_plugin_1 = require("./plugins/alias-plugin");
const replace_plugin_1 = require("./plugins/replace-plugin");
const reorder_statements_1 = require("./plugins/reorder-statements");
const banner_1 = require("../utils/banner");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const rollup_1 = require("rollup");
const glob_1 = __importDefault(require("glob"));
const typescript_1 = __importDefault(require("typescript"));
const terser_1 = require("terser");
async function internalClient(opts) {
    const inputClientDir = path_1.join(opts.buildDir, 'client');
    const outputInternalClientDir = path_1.join(opts.output.internalDir, 'client');
    const outputInternalClientPolyfillsDir = path_1.join(outputInternalClientDir, 'polyfills');
    await fs_extra_1.default.emptyDir(outputInternalClientDir);
    await fs_extra_1.default.emptyDir(outputInternalClientPolyfillsDir);
    await copyPolyfills(opts, outputInternalClientPolyfillsDir);
    // write @stencil/core/internal/client/package.json
    write_pkg_json_1.writePkgJson(opts, outputInternalClientDir, {
        name: '@stencil/core/internal/client',
        description: 'Stencil internal client platform to be imported by the Stencil Compiler and internal runtime. Breaking changes can and will happen at any time.',
        main: 'index.js',
        sideEffects: false,
    });
    const internalClientBundle = {
        input: path_1.join(inputClientDir, 'index.js'),
        output: {
            format: 'es',
            dir: outputInternalClientDir,
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            banner: banner_1.getBanner(opts, 'Stencil Client Platform'),
            preferConst: true,
        },
        treeshake: {
            moduleSideEffects: 'no-external',
            propertyReadSideEffects: false,
        },
        plugins: [
            {
                name: 'internalClientPlugin',
                resolveId(importee) {
                    if (importee === '@platform') {
                        return path_1.join(inputClientDir, 'index.js');
                    }
                },
            },
            alias_plugin_1.aliasPlugin(opts),
            replace_plugin_1.replacePlugin(opts),
            reorder_statements_1.reorderCoreStatementsPlugin(),
        ],
    };
    const internalClientPatchBrowserBundle = {
        input: path_1.join(inputClientDir, 'client-patch-browser.js'),
        output: {
            format: 'es',
            dir: outputInternalClientDir,
            entryFileNames: 'patch-browser.js',
            chunkFileNames: '[name].js',
            banner: banner_1.getBanner(opts, 'Stencil Client Patch Browser'),
            preferConst: true,
        },
        treeshake: {
            moduleSideEffects: 'no-external',
            propertyReadSideEffects: false,
        },
        plugins: [
            {
                name: 'internalClientPatchPlugin',
                resolveId(importee) {
                    if (importee === '@platform') {
                        return {
                            id: `@stencil/core`,
                            external: true,
                        };
                    }
                },
            },
            {
                name: 'internalClientRuntimeCssShim',
                resolveId(importee) {
                    if (importee === './polyfills/css-shim.js') {
                        return importee;
                    }
                    return null;
                },
                async load(id) {
                    // bundle the css-shim into one file
                    if (id === './polyfills/css-shim.js') {
                        const rollupBuild = await rollup_1.rollup({
                            input: path_1.join(inputClientDir, 'polyfills', 'css-shim', 'index.js'),
                            onwarn: (message) => {
                                if (/top level of an ES module/.test(message))
                                    return;
                                console.error(message);
                            },
                        });
                        const { output } = await rollupBuild.generate({ format: 'es' });
                        const transpileToEs5 = typescript_1.default.transpileModule(output[0].code, {
                            compilerOptions: {
                                target: typescript_1.default.ScriptTarget.ES5,
                            },
                        });
                        let code = transpileToEs5.outputText;
                        if (opts.isProd) {
                            const minifyResults = await terser_1.minify(code);
                            code = minifyResults.code;
                        }
                        const dest = path_1.join(outputInternalClientPolyfillsDir, 'css-shim.js');
                        await fs_extra_1.default.writeFile(dest, code);
                        return code;
                    }
                    return null;
                },
            },
            {
                name: 'internalClientRuntimePolyfills',
                resolveId(importee) {
                    if (importee.startsWith('./polyfills')) {
                        const fileName = path_1.basename(importee);
                        return path_1.join(opts.srcDir, 'client', 'polyfills', fileName);
                    }
                    return null;
                },
            },
            alias_plugin_1.aliasPlugin(opts),
            replace_plugin_1.replacePlugin(opts),
            reorder_statements_1.reorderCoreStatementsPlugin(),
        ],
    };
    const internalClientPatchEsmBundle = Object.assign({}, internalClientPatchBrowserBundle);
    internalClientPatchEsmBundle.input = path_1.join(inputClientDir, 'client-patch-esm.js');
    internalClientPatchEsmBundle.output = {
        format: 'es',
        dir: outputInternalClientDir,
        entryFileNames: 'patch-esm.js',
        chunkFileNames: '[name].js',
        banner: banner_1.getBanner(opts, 'Stencil Client Patch Esm'),
        preferConst: true,
    };
    return [internalClientBundle, internalClientPatchBrowserBundle, internalClientPatchEsmBundle];
}
exports.internalClient = internalClient;
async function copyPolyfills(opts, outputInternalClientPolyfillsDir) {
    const srcPolyfillsDir = path_1.join(opts.srcDir, 'client', 'polyfills');
    const srcPolyfillFiles = glob_1.default.sync('*.js', { cwd: srcPolyfillsDir });
    await Promise.all(srcPolyfillFiles.map(async (fileName) => {
        const src = path_1.join(srcPolyfillsDir, fileName);
        const dest = path_1.join(outputInternalClientPolyfillsDir, fileName);
        await fs_extra_1.default.copyFile(src, dest);
    }));
}
