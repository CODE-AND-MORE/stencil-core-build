"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aliasPlugin = void 0;
const path_1 = require("path");
/**
 * Creates a rollup plugin for resolving identifiers while simultaneously externalizing them
 * @param opts the options being used during a build
 * @returns a rollup plugin with a build hook for resolving various identifiers
 */
function aliasPlugin(opts) {
    const alias = new Map([
        ['@app-data', '@stencil/core/internal/app-data'],
        ['@app-globals', '@stencil/core/internal/app-globals'],
        ['@hydrate-factory', '@stencil/core/hydrate-factory'],
        ['@stencil/core/mock-doc', '@stencil/core/mock-doc'],
        ['@stencil/core/testing', '@stencil/core/testing'],
        ['@sys-api-node', './index.js'],
        ['@dev-server-process', './server-process.js'],
    ]);
    // ensure we use the same one
    const helperResolvers = new Set(['is-resolvable', 'path-is-absolute']);
    // ensure we use the same one
    const nodeResolvers = new Map([['source-map', (0, path_1.join)(opts.nodeModulesDir, 'source-map', 'source-map.js')]]);
    const empty = new Set([
        // we never use chalk, but many projects still pull it in
        'chalk',
    ]);
    return {
        name: 'aliasPlugin',
        /**
         * A rollup build hook for resolving identifiers. [Source](https://rollupjs.org/guide/en/#resolveid)
         * @param id the importee exactly as it is written in an import statement in the source code
         * @returns a resolution to an import to a different id, potentially externalizing it from the bundle simultaneously
         */
        resolveId(id) {
            const externalId = alias.get(id);
            if (externalId) {
                return {
                    id: externalId,
                    external: true,
                };
            }
            if (id === '@runtime') {
                return (0, path_1.join)(opts.buildDir, 'runtime', 'index.js');
            }
            if (id === '@utils') {
                return (0, path_1.join)(opts.buildDir, 'utils', 'index.js');
            }
            if (id === '@environment') {
                return (0, path_1.join)(opts.buildDir, 'compiler', 'sys', 'environment.js');
            }
            if (helperResolvers.has(id)) {
                return (0, path_1.join)(opts.bundleHelpersDir, `${id}.js`);
            }
            if (empty.has(id)) {
                return (0, path_1.join)(opts.bundleHelpersDir, 'empty.js');
            }
            if (nodeResolvers.has(id)) {
                return nodeResolvers.get(id);
            }
            return null;
        },
    };
}
exports.aliasPlugin = aliasPlugin;
