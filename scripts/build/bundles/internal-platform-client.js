"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalClient = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path_1 = require("path");
const rollup_1 = require("rollup");
const terser_1 = require("terser");
const typescript_1 = __importDefault(require("typescript"));
const banner_1 = require("../utils/banner");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const alias_plugin_1 = require("./plugins/alias-plugin");
const reorder_statements_1 = require("./plugins/reorder-statements");
const replace_plugin_1 = require("./plugins/replace-plugin");
async function internalClient(opts) {
    const inputClientDir = (0, path_1.join)(opts.buildDir, 'client');
    const outputInternalClientDir = (0, path_1.join)(opts.output.internalDir, 'client');
    const outputInternalClientPolyfillsDir = (0, path_1.join)(outputInternalClientDir, 'polyfills');
    await fs_extra_1.default.emptyDir(outputInternalClientDir);
    await fs_extra_1.default.emptyDir(outputInternalClientPolyfillsDir);
    await copyPolyfills(opts, outputInternalClientPolyfillsDir);
    // write @stencil/core/internal/client/package.json
    (0, write_pkg_json_1.writePkgJson)(opts, outputInternalClientDir, {
        name: '@stencil/core/internal/client',
        description: 'Stencil internal client platform to be imported by the Stencil Compiler and internal runtime. Breaking changes can and will happen at any time.',
        main: 'index.js',
        sideEffects: false,
    });
    const internalClientBundle = {
        input: (0, path_1.join)(inputClientDir, 'index.js'),
        output: {
            format: 'es',
            dir: outputInternalClientDir,
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            banner: (0, banner_1.getBanner)(opts, 'Stencil Client Platform'),
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
                        return (0, path_1.join)(inputClientDir, 'index.js');
                    }
                },
            },
            (0, alias_plugin_1.aliasPlugin)(opts),
            (0, replace_plugin_1.replacePlugin)(opts),
            (0, reorder_statements_1.reorderCoreStatementsPlugin)(),
        ],
    };
    const internalClientPatchBrowserBundle = {
        input: (0, path_1.join)(inputClientDir, 'client-patch-browser.js'),
        output: {
            format: 'es',
            dir: outputInternalClientDir,
            entryFileNames: 'patch-browser.js',
            chunkFileNames: '[name].js',
            banner: (0, banner_1.getBanner)(opts, 'Stencil Client Patch Browser'),
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
                        const rollupBuild = await (0, rollup_1.rollup)({
                            input: (0, path_1.join)(inputClientDir, 'polyfills', 'css-shim', 'index.js'),
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
                            const minifyResults = await (0, terser_1.minify)(code);
                            code = minifyResults.code;
                        }
                        const dest = (0, path_1.join)(outputInternalClientPolyfillsDir, 'css-shim.js');
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
                        const fileName = (0, path_1.basename)(importee);
                        return (0, path_1.join)(opts.srcDir, 'client', 'polyfills', fileName);
                    }
                    return null;
                },
            },
            (0, alias_plugin_1.aliasPlugin)(opts),
            (0, replace_plugin_1.replacePlugin)(opts),
            (0, reorder_statements_1.reorderCoreStatementsPlugin)(),
        ],
    };
    const internalClientPatchEsmBundle = Object.assign({}, internalClientPatchBrowserBundle);
    internalClientPatchEsmBundle.input = (0, path_1.join)(inputClientDir, 'client-patch-esm.js');
    internalClientPatchEsmBundle.output = {
        format: 'es',
        dir: outputInternalClientDir,
        entryFileNames: 'patch-esm.js',
        chunkFileNames: '[name].js',
        banner: (0, banner_1.getBanner)(opts, 'Stencil Client Patch Esm'),
        preferConst: true,
    };
    return [internalClientBundle, internalClientPatchBrowserBundle, internalClientPatchEsmBundle];
}
exports.internalClient = internalClient;
async function copyPolyfills(opts, outputInternalClientPolyfillsDir) {
    const srcPolyfillsDir = (0, path_1.join)(opts.srcDir, 'client', 'polyfills');
    const srcPolyfillFiles = glob_1.default.sync('*.js', { cwd: srcPolyfillsDir });
    await Promise.all(srcPolyfillFiles.map(async (fileName) => {
        const src = (0, path_1.join)(srcPolyfillsDir, fileName);
        const dest = (0, path_1.join)(outputInternalClientPolyfillsDir, fileName);
        await fs_extra_1.default.copyFile(src, dest);
    }));
}
