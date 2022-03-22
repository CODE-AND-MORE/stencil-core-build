"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeScriptDefaultLibNames = exports.updateDependenciesJson = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
async function updateDependenciesJson(opts) {
    const srcPath = path_1.join(opts.srcDir, 'compiler', 'sys', 'dependencies.json');
    const rootPath = path_1.join(opts.rootDir, 'dependencies.json');
    const stencilResources = await getStencilResources(opts);
    const data = JSON.parse(await fs_extra_1.readFile(srcPath, 'utf8'));
    for (const dep of data.dependencies) {
        if (dep.name === '@stencil/core') {
            dep.resources = stencilResources;
        }
    }
    // update the src file, which most of the times is no change
    // but incase there is a change we'll then know to commit it
    await fs_extra_1.writeFile(srcPath, JSON.stringify(data, null, 2));
    // now update the versions and write a copy for the root
    for (const dep of data.dependencies) {
        switch (dep.name) {
            case '@stencil/core':
                dep.version = opts.version;
                break;
            case 'rollup':
                dep.version = opts.rollupVersion;
                break;
            case 'terser':
                dep.version = opts.terserVersion;
                break;
            case 'typescript':
                dep.version = opts.typescriptVersion;
                break;
        }
    }
    await fs_extra_1.writeFile(rootPath, JSON.stringify(data, null, 2));
}
exports.updateDependenciesJson = updateDependenciesJson;
async function getStencilResources(opts) {
    const tsLibPaths = (await getTypeScriptDefaultLibNames(opts)).map((f) => `compiler/${f}`);
    const resources = [
        'internal/index.js',
        'internal/index.d.ts',
        'internal/package.json',
        'internal/stencil-core/index.js',
        'internal/stencil-core/index.d.ts',
        'internal/stencil-ext-modules.d.ts',
        'internal/stencil-private.d.ts',
        'internal/stencil-public-compiler.d.ts',
        'internal/stencil-public-docs.d.ts',
        'internal/stencil-public-runtime.d.ts',
        'internal/client/css-shim.js',
        'internal/client/dom.js',
        'internal/client/index.js',
        'internal/client/patch-browser.js',
        'internal/client/patch-esm.js',
        'internal/client/shadow-css.js',
        'internal/client/package.json',
        'internal/hydrate/index.js',
        'internal/hydrate/runner.js',
        'internal/hydrate/shadow-css.js',
        'internal/hydrate/package.json',
        'mock-doc/index.js',
        'mock-doc/package.json',
        'package.json',
        ...tsLibPaths,
    ];
    return resources.sort((a, b) => {
        const dirsA = a.split('/').length;
        const dirsB = b.split('/').length;
        if (dirsA < dirsB)
            return -1;
        if (dirsA > dirsB)
            return 1;
        if (a.toLowerCase() < b.toLowerCase())
            return -1;
        if (a.toLowerCase() > b.toLowerCase())
            return 1;
        return 0;
    });
}
async function getTypeScriptDefaultLibNames(opts) {
    const tsLibNames = (await fs_extra_1.readdir(opts.typescriptLibDir)).filter((f) => {
        return f.startsWith('lib.') && f.endsWith('.d.ts');
    });
    return tsLibNames;
}
exports.getTypeScriptDefaultLibNames = getTypeScriptDefaultLibNames;
