"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devServer = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const pluginutils_1 = require("@rollup/pluginutils");
const alias_plugin_1 = require("./plugins/alias-plugin");
const relative_path_plugin_1 = require("./plugins/relative-path-plugin");
const replace_plugin_1 = require("./plugins/replace-plugin");
const write_pkg_json_1 = require("../utils/write-pkg-json");
const terser_1 = require("terser");
const typescript_1 = __importDefault(require("typescript"));
const banner_1 = require("../utils/banner");
const content_types_plugin_1 = require("./plugins/content-types-plugin");
async function devServer(opts) {
    const inputDir = path_1.join(opts.buildDir, 'dev-server');
    // create public d.ts
    let dts = await fs_extra_1.default.readFile(path_1.join(inputDir, 'index.d.ts'), 'utf8');
    dts = dts.replace('../declarations', '../internal/index');
    await fs_extra_1.default.writeFile(path_1.join(opts.output.devServerDir, 'index.d.ts'), dts);
    // write package.json
    write_pkg_json_1.writePkgJson(opts, opts.output.devServerDir, {
        name: '@stencil/core/dev-server',
        description: 'Stencil Development Server which communicates with the Stencil Compiler.',
        main: 'index.js',
        types: 'index.d.ts',
    });
    // copy static files
    await fs_extra_1.default.copy(path_1.join(opts.srcDir, 'dev-server', 'static'), path_1.join(opts.output.devServerDir, 'static'));
    // copy server-worker-thread.js
    await fs_extra_1.default.copy(path_1.join(opts.srcDir, 'dev-server', 'server-worker-thread.js'), path_1.join(opts.output.devServerDir, 'server-worker-thread.js'));
    // copy template files
    await fs_extra_1.default.copy(path_1.join(opts.srcDir, 'dev-server', 'templates'), path_1.join(opts.output.devServerDir, 'templates'));
    const external = [
        'assert',
        'buffer',
        'child_process',
        'crypto',
        'events',
        'fs',
        'http',
        'https',
        'net',
        'os',
        'path',
        'stream',
        'url',
        'util',
        'zlib',
    ];
    const plugins = [
        content_types_plugin_1.contentTypesPlugin(opts),
        {
            name: 'devServerWorkerResolverPlugin',
            resolveId(importee) {
                if (importee.includes('open-in-editor-api')) {
                    return {
                        id: './open-in-editor-api.js',
                        external: true,
                    };
                }
                return null;
            },
        },
        relative_path_plugin_1.relativePathPlugin('@sys-api-node', '../sys/node/index.js'),
        relative_path_plugin_1.relativePathPlugin('glob', '../sys/node/glob.js'),
        relative_path_plugin_1.relativePathPlugin('graceful-fs', '../sys/node/graceful-fs.js'),
        relative_path_plugin_1.relativePathPlugin('ws', './ws.js'),
        relative_path_plugin_1.relativePathPlugin('../sys/node/node-sys.js', '../sys/node/node-sys.js'),
        alias_plugin_1.aliasPlugin(opts),
        plugin_node_resolve_1.default({
            preferBuiltins: true,
        }),
        plugin_commonjs_1.default(),
        replace_plugin_1.replacePlugin(opts),
    ];
    const devServerIndexBundle = {
        input: path_1.join(inputDir, 'index.js'),
        output: {
            format: 'cjs',
            file: path_1.join(opts.output.devServerDir, 'index.js'),
            hoistTransitiveImports: false,
            esModule: false,
            preferConst: true,
            banner: banner_1.getBanner(opts, `Stencil Dev Server`, true),
        },
        external,
        plugins,
        treeshake: {
            moduleSideEffects: false,
        },
    };
    const devServerProcessBundle = {
        input: path_1.join(inputDir, 'server-process.js'),
        output: {
            format: 'cjs',
            file: path_1.join(opts.output.devServerDir, 'server-process.js'),
            hoistTransitiveImports: false,
            esModule: false,
            preferConst: true,
            banner: banner_1.getBanner(opts, `Stencil Dev Server Process`, true),
        },
        external,
        plugins,
        treeshake: {
            moduleSideEffects: false,
        },
    };
    function appErrorCssPlugin() {
        return {
            name: 'appErrorCss',
            resolveId(id) {
                if (id.endsWith('app-error.css')) {
                    return path_1.join(opts.srcDir, 'dev-server', 'client', 'app-error.css');
                }
                return null;
            },
            transform(code, id) {
                if (id.endsWith('.css')) {
                    code = code.replace(/\n/g, ' ').trim();
                    while (code.includes('  ')) {
                        code = code.replace(/  /g, ' ');
                    }
                    return pluginutils_1.dataToEsm(code, { preferConst: true });
                }
                return null;
            },
        };
    }
    const connectorName = 'connector.html';
    const connectorBundle = {
        input: path_1.join(inputDir, 'dev-server-client', 'index.js'),
        output: {
            format: 'cjs',
            file: path_1.join(opts.output.devServerDir, connectorName),
            strict: false,
            preferConst: true,
        },
        plugins: [
            {
                name: 'connectorPlugin',
                resolveId(id) {
                    if (id === '@stencil/core/dev-server/client') {
                        return path_1.join(inputDir, 'client', 'index.js');
                    }
                },
            },
            appErrorCssPlugin(),
            {
                name: 'clientConnectorPlugin',
                async generateBundle(_options, bundle) {
                    if (bundle[connectorName]) {
                        let code = bundle[connectorName].code;
                        const tsResults = typescript_1.default.transpileModule(code, {
                            compilerOptions: {
                                target: typescript_1.default.ScriptTarget.ES5,
                            },
                        });
                        if (tsResults.diagnostics.length > 0) {
                            throw new Error(tsResults.diagnostics);
                        }
                        code = tsResults.outputText;
                        code = intro + code + outro;
                        if (opts.isProd) {
                            const minifyResults = await terser_1.minify(code, {
                                compress: { hoist_vars: true, hoist_funs: true, ecma: 5 },
                                format: { ecma: 5 },
                            });
                            code = minifyResults.code;
                        }
                        code = banner + code + footer;
                        code = code.replace(/__VERSION:STENCIL__/g, opts.version);
                        bundle[connectorName].code = code;
                    }
                },
            },
            replace_plugin_1.replacePlugin(opts),
            plugin_node_resolve_1.default(),
        ],
    };
    await fs_extra_1.default.ensureDir(path_1.join(opts.output.devServerDir, 'client'));
    // copy dev server client dts files
    await fs_extra_1.default.copy(path_1.join(opts.buildDir, 'dev-server', 'client'), path_1.join(opts.output.devServerDir, 'client'), {
        filter: (src) => {
            if (src.endsWith('.d.ts')) {
                return true;
            }
            const stats = fs_extra_1.default.statSync(src);
            if (stats.isDirectory()) {
                return true;
            }
            return false;
        },
    });
    // write package.json
    write_pkg_json_1.writePkgJson(opts, path_1.join(opts.output.devServerDir, 'client'), {
        name: '@stencil/core/dev-server/client',
        description: 'Stencil Dev Server Client.',
        main: 'index.js',
        types: 'index.d.ts',
    });
    const devServerClientBundle = {
        input: path_1.join(opts.buildDir, 'dev-server', 'client', 'index.js'),
        output: {
            format: 'esm',
            file: path_1.join(opts.output.devServerDir, 'client', 'index.js'),
            banner: banner_1.getBanner(opts, `Stencil Dev Server Client`, true),
        },
        plugins: [appErrorCssPlugin(), replace_plugin_1.replacePlugin(opts), plugin_node_resolve_1.default()],
    };
    return [devServerIndexBundle, devServerProcessBundle, connectorBundle, devServerClientBundle];
}
exports.devServer = devServer;
const banner = `<!doctype html><html><head><meta charset="utf-8"><title>Stencil Dev Server Connector __VERSION:STENCIL__ &#9889</title><style>body{background:black;color:white;font:18px monospace;text-align:center}</style></head><body>

Stencil Dev Server Connector __VERSION:STENCIL__ &#9889;

<script>`;
const intro = `(function(iframeWindow, appWindow, config, exports) {
"use strict";
`;
const outro = `
})(window, window.parent, window.__DEV_CLIENT_CONFIG__, {});
`;
const footer = `\n</script></body></html>`;
