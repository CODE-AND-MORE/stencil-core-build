"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse5Plugin = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const alias_plugin_1 = require("./alias-plugin");
const path_1 = require("path");
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const rollup_1 = require("rollup");
const terser_1 = require("terser");
/**
 * Bundles parse5, an HTML serializer & parser, into the compiler
 * @param opts the options being used during a build of the Stencil compiler
 * @returns the plugin that inlines parse5
 */
function parse5Plugin(opts) {
    return {
        name: 'parse5Plugin',
        /**
         * A rollup build hook for resolving parse5 [Source](https://rollupjs.org/guide/en/#resolveid)
         * @param id the importee exactly as it is written in an import statement in the source code
         * @returns a string that resolves an import to some id
         */
        resolveId(id) {
            if (id === 'parse5') {
                return id;
            }
            return null;
        },
        /**
         * A rollup build hook for loading parse5. [Source](https://rollupjs.org/guide/en/#load)
         * @param id the path of the module to load
         * @returns parse5, pre-bundled
         */
        async load(id) {
            if (id === 'parse5') {
                return await bundleParse5(opts);
            }
            return null;
        },
        /**
         * Output generation hook used to reduce the amount of whitespace in the bundle
         * @param _ unused output options
         * @param bundle the bundle to minify
         */
        generateBundle(_, bundle) {
            Object.keys(bundle).forEach((fileName) => {
                // not minifying, but we are reducing whitespace
                const chunk = bundle[fileName];
                if (chunk.type === 'chunk') {
                    chunk.code = chunk.code.replace(/    /g, '  ');
                }
            });
        },
    };
}
exports.parse5Plugin = parse5Plugin;
/**
 * Bundles parse5 to be used in the Stencil output. Writes the results to disk and returns its contents. The file
 * written to disk may be used as a simple cache to speed up subsequent build times.
 * @param opts the options being used during a build of the Stencil compiler
 * @returns the contents of the file containing parse5
 */
async function bundleParse5(opts) {
    const fileName = `parse5-${opts.parse5Verion.replace(/\./g, '_')}-bundle-cache${opts.isProd ? '.min' : ''}.js`;
    const cacheFile = path_1.join(opts.scriptsBuildDir, fileName);
    try {
        return await fs_extra_1.default.readFile(cacheFile, 'utf8');
    }
    catch (e) { }
    const rollupBuild = await rollup_1.rollup({
        input: '@parse5-entry',
        plugins: [
            {
                name: 'parse5EntryPlugin',
                /**
                 * A rollup build hook for resolving @parse5-entry [Source](https://rollupjs.org/guide/en/#resolveid)
                 * @param id the importee exactly as it is written in an import statement in the source code
                 * @returns a string that resolves an import to some id
                 */
                resolveId(id) {
                    if (id === '@parse5-entry') {
                        return id;
                    }
                    return null;
                },
                /**
                 * A rollup build hook for intercepting how parse5's entry package is processed
                 * [Source](https://rollupjs.org/guide/en/#load)
                 * @param id the path of the module to load
                 * @returns source code to act as a proxy for @parse5-entry
                 */
                load(id) {
                    if (id === '@parse5-entry') {
                        return `export { parse, parseFragment } from 'parse5';`;
                    }
                    return null;
                },
            },
            alias_plugin_1.aliasPlugin(opts),
            plugin_node_resolve_1.default(),
            plugin_commonjs_1.default(),
        ],
    });
    const { output } = await rollupBuild.generate({
        format: 'iife',
        name: 'PARSE5',
        footer: ['export const parse = PARSE5.parse;', 'export const parseFragment = PARSE5.parseFragment;'].join('\n'),
        preferConst: true,
        strict: false,
    });
    let code = output[0].code;
    if (opts.isProd) {
        const minified = await terser_1.minify(code, {
            ecma: 2018,
            module: true,
            compress: {
                ecma: 2018,
                passes: 2,
            },
            format: {
                ecma: 2018,
                comments: false,
            },
        });
        code = minified.code;
    }
    code = `// Parse5 ${opts.parse5Verion}\n` + code;
    await fs_extra_1.default.writeFile(cacheFile, code);
    return code;
}
