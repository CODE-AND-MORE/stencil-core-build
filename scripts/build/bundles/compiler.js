"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compiler = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_json_1 = __importDefault(require("@rollup/plugin-json"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const alias_plugin_1 = require("./plugins/alias-plugin");
const banner_1 = require("../utils/banner");
const dependencies_json_1 = require("../utils/dependencies-json");
const inlined_compiler_deps_plugin_1 = require("./plugins/inlined-compiler-deps-plugin");
const parse5_plugin_1 = require("./plugins/parse5-plugin");
const replace_plugin_1 = require("./plugins/replace-plugin");
const sizzle_plugin_1 = require("./plugins/sizzle-plugin");
const sys_modules_plugin_1 = require("./plugins/sys-modules-plugin");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const typescript_source_plugin_1 = require("./plugins/typescript-source-plugin");
const rollup_plugin_sourcemaps_1 = __importDefault(require("rollup-plugin-sourcemaps"));
const terser_1 = require("terser");
const terser_plugin_1 = require("./plugins/terser-plugin");
const magic_string_1 = __importDefault(require("magic-string"));
/**
 * Generates a rollup configuration for the `compiler` submodule of the project
 * @param opts the options being used during a build of the Stencil compiler
 * @returns an array containing the generated rollup options
 */
async function compiler(opts) {
    const inputDir = (0, path_1.join)(opts.buildDir, 'compiler');
    const compilerFileName = 'stencil.js';
    const compilerDtsName = compilerFileName.replace('.js', '.d.ts');
    // create public d.ts
    let dts = await fs_extra_1.default.readFile((0, path_1.join)(inputDir, 'public.d.ts'), 'utf8');
    dts = dts.replace('@stencil/core/internal', '../internal/index');
    await fs_extra_1.default.writeFile((0, path_1.join)(opts.output.compilerDir, compilerDtsName), dts);
    // write @stencil/core/compiler/package.json
    (0, write_pkg_json_1.writePkgJson)(opts, opts.output.compilerDir, {
        name: '@stencil/core/compiler',
        description: 'Stencil Compiler.',
        main: compilerFileName,
        types: compilerDtsName,
    });
    /**
     * These files are wrap the compiler in an Immediately-Invoked Function Expression (IIFE). The intro contains the
     * first half of the IIFE, and the outro contains the second half. Those files are not valid JavaScript on their own,
     * and editors may produce warnings as a result. This comment is not in the files themselves, as doing so would lead
     * to the comment being added to the compiler output itself. These files could be converted to non-JS files, at the
     * cost of losing some source code highlighting in editors.
     */
    const cjsIntro = fs_extra_1.default.readFileSync((0, path_1.join)(opts.bundleHelpersDir, 'compiler-cjs-intro.js'), 'utf8');
    const cjsOutro = fs_extra_1.default.readFileSync((0, path_1.join)(opts.bundleHelpersDir, 'compiler-cjs-outro.js'), 'utf8');
    const rollupWatchPath = (0, path_1.join)(opts.nodeModulesDir, 'rollup', 'dist', 'es', 'shared', 'watch.js');
    const compilerBundle = {
        input: (0, path_1.join)(inputDir, 'index.js'),
        output: {
            format: 'cjs',
            file: (0, path_1.join)(opts.output.compilerDir, compilerFileName),
            intro: cjsIntro,
            outro: cjsOutro,
            strict: false,
            banner: (0, banner_1.getBanner)(opts, `Stencil Compiler`, true),
            esModule: false,
            preferConst: true,
            freeze: false,
            sourcemap: true,
        },
        plugins: [
            (0, typescript_source_plugin_1.typescriptSourcePlugin)(opts),
            (0, terser_plugin_1.terserPlugin)(opts),
            {
                name: 'compilerMockDocResolvePlugin',
                /**
                 * A rollup build hook for resolving the Stencil mock-doc module, Microsoft's TypeScript event tracer, and the
                 * V8 inspector. [Source](https://rollupjs.org/guide/en/#resolveid)
                 * @param id the importee exactly as it is written in an import statement in the source code
                 * @returns an object that resolves an import to some id
                 */
                resolveId(id) {
                    if (id === '@stencil/core/mock-doc') {
                        return (0, path_1.join)(opts.buildDir, 'mock-doc', 'index.js');
                    }
                    if (id === '@microsoft/typescript-etw' || id === 'inspector') {
                        return id;
                    }
                    return null;
                },
            },
            {
                name: 'rollupResolvePlugin',
                /**
                 * A rollup build hook for resolving the fsevents. [Source](https://rollupjs.org/guide/en/#resolveid)
                 * @param id the importee exactly as it is written in an import statement in the source code
                 * @returns an object that resolves an import to some id
                 */
                resolveId(id) {
                    if (id === 'fsevents') {
                        return id;
                    }
                },
                /**
                 * A rollup build hook for loading the Stencil mock-doc module, Microsoft's TypeScript event tracer, the V8
                 * inspector and fsevents. [Source](https://rollupjs.org/guide/en/#load)
                 * @param id the path of the module to load
                 * @returns the module matched
                 */
                load(id) {
                    if (id === 'fsevents' || id === '@microsoft/typescript-etw' || id === 'inspector') {
                        return '';
                    }
                    if (id === rollupWatchPath) {
                        return '';
                    }
                    return null;
                },
            },
            (0, replace_plugin_1.replacePlugin)(opts),
            {
                name: 'hackReplaceNodeProcessBinding',
                /**
                 * Removes instances of calls to deprecated `process.binding()` calls
                 * @param code the code to modify
                 * @param id module's identifier
                 * @returns the modified code
                 */
                transform(code, id) {
                    code = code.replace(` || Object.keys(process.binding('natives'))`, '');
                    return {
                        code: code,
                        map: new magic_string_1.default(code)
                            .generateMap({
                            source: id,
                            // this is the name of the sourcemap, not to be confused with the `file` field in a generated sourcemap
                            file: id + '.map',
                            includeContent: false,
                            hires: true,
                        })
                            .toString(),
                    };
                },
            },
            (0, inlined_compiler_deps_plugin_1.inlinedCompilerDepsPlugin)(opts, inputDir),
            (0, parse5_plugin_1.parse5Plugin)(opts),
            (0, sizzle_plugin_1.sizzlePlugin)(opts),
            (0, alias_plugin_1.aliasPlugin)(opts),
            (0, sys_modules_plugin_1.sysModulesPlugin)(inputDir),
            (0, plugin_node_resolve_1.default)({
                mainFields: ['module', 'main'],
                preferBuiltins: false,
            }),
            (0, plugin_commonjs_1.default)({
                transformMixedEsModules: false,
                sourceMap: true,
            }),
            (0, plugin_json_1.default)({
                preferConst: true,
            }),
            {
                name: 'compilerMinify',
                async generateBundle(_, bundleFiles) {
                    if (opts.isProd) {
                        const compilerFilename = Object.keys(bundleFiles).find((f) => f.includes('stencil'));
                        const compilerBundle = bundleFiles[compilerFilename];
                        const minified = await minifyStencilCompiler(compilerBundle.code, opts);
                        await fs_extra_1.default.writeFile((0, path_1.join)(opts.output.compilerDir, compilerFilename.replace('.js', '.min.js')), minified);
                    }
                },
            },
            (0, rollup_plugin_sourcemaps_1.default)(),
        ],
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            unknownGlobalSideEffects: false,
        },
        onwarn(warning) {
            if (warning.code === `THIS_IS_UNDEFINED`) {
                return;
            }
            console.warn(warning.message || warning);
        },
    };
    // copy typescript default lib dts files
    const tsLibNames = await (0, dependencies_json_1.getTypeScriptDefaultLibNames)(opts);
    await Promise.all(tsLibNames.map((f) => fs_extra_1.default.copy((0, path_1.join)(opts.typescriptLibDir, f), (0, path_1.join)(opts.output.compilerDir, f))));
    return [compilerBundle];
}
exports.compiler = compiler;
async function minifyStencilCompiler(code, opts) {
    const minifyOpts = {
        ecma: 2018,
        compress: {
            ecma: 2018,
            passes: 2,
            side_effects: false,
            unsafe_arrows: true,
            unsafe_methods: true,
        },
        format: {
            ecma: 2018,
            comments: false,
        },
    };
    const results = await (0, terser_1.minify)(code, minifyOpts);
    code = (0, banner_1.getBanner)(opts, `Stencil Compiler`, true) + '\n' + results.code;
    return code;
}