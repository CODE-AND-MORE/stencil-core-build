"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sizzlePlugin = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
/**
 * Bundles sizzle, a CSS selector engine, into the Stencil compiler
 * @param opts the options being used during a build of the Stencil compiler
 * @returns the plugin that inlines sizzle
 */
function sizzlePlugin(opts) {
    return {
        name: 'sizzlePlugin',
        /**
         * A rollup build hook for resolving sizzle [Source](https://rollupjs.org/guide/en/#resolveid)
         * @param id the importee exactly as it is written in the import statement
         * @returns a string that resolves an import to some id
         */
        resolveId(id) {
            if (id === 'sizzle') {
                return id;
            }
            return null;
        },
        /**
         * A rollup build hook for loading sizzle. [Source](https://rollupjs.org/guide/en/#load)
         * @param id the path of the module to load
         * @returns parse5, pre-bundled
         */
        async load(id) {
            if (id !== 'sizzle') {
                return null;
            }
            const f = opts.isProd ? 'sizzle.min.js' : 'sizzle.js';
            const sizzlePath = (0, path_1.join)(opts.nodeModulesDir, 'sizzle', 'dist', f);
            const sizzleContent = await fs_extra_1.default.readFile(sizzlePath, 'utf8');
            return getSizzleBundle(opts, sizzleContent);
        },
    };
}
exports.sizzlePlugin = sizzlePlugin;
/**
 * Creates a sizzle bundle to inline
 * @param opts the options being used during a build of the Stencil compiler
 * @param content the sizzle source contents
 * @returns a modified version of sizzle, wrapped in an immediately invoked function expression (IIFE)
 */
function getSizzleBundle(opts, content) {
    return `// Sizzle ${opts.sizzleVersion}
export default (function() {
const window = {
  document: {
    createElement() {
      return {};
    },
    nodeType: 9,
    documentElement: {
      nodeType: 1,
      nodeName: 'HTML'
    }
  }
};
const module = { exports: {} };

${content}

return module.exports;
})();
`;
}
