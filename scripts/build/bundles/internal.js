"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internal = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const bundle_dts_1 = require("../utils/bundle-dts");
const internal_app_data_1 = require("./internal-app-data");
const internal_platform_client_1 = require("./internal-platform-client");
const internal_platform_hydrate_1 = require("./internal-platform-hydrate");
const internal_platform_testing_1 = require("./internal-platform-testing");
const path_1 = require("path");
const write_pkg_json_1 = require("../utils/write-pkg-json");
async function internal(opts) {
    const inputInternalDir = path_1.join(opts.buildDir, 'internal');
    await fs_extra_1.default.emptyDir(opts.output.internalDir);
    await copyStencilInternalDts(opts, opts.output.internalDir);
    await copyStencilCoreEntry(opts);
    // copy @stencil/core/internal default entry, which defaults to client
    // but we're not exposing all of Stencil's internal code (only the types)
    await fs_extra_1.default.copyFile(path_1.join(inputInternalDir, 'default.js'), path_1.join(opts.output.internalDir, 'index.js'));
    // write @stencil/core/internal/package.json
    write_pkg_json_1.writePkgJson(opts, opts.output.internalDir, {
        name: '@stencil/core/internal',
        description: 'Stencil internals only to be imported by the Stencil Compiler. Breaking changes can and will happen at any time.',
        main: 'index.js',
        types: 'index.d.ts',
        sideEffects: false,
    });
    const clientPlatformBundle = await internal_platform_client_1.internalClient(opts);
    const hydratePlatformBundles = await internal_platform_hydrate_1.internalHydrate(opts);
    const testingPlatform = await internal_platform_testing_1.internalTesting(opts);
    return [...clientPlatformBundle, ...hydratePlatformBundles, ...testingPlatform, await internal_app_data_1.internalAppData(opts)];
}
exports.internal = internal;
async function copyStencilInternalDts(opts, outputInternalDir) {
    const declarationsInputDir = path_1.join(opts.buildDir, 'declarations');
    // copy to @stencil/core/internal
    // @stencil/core/internal/index.d.ts
    const indexDtsSrcPath = path_1.join(declarationsInputDir, 'index.d.ts');
    const indexDtsDestPath = path_1.join(outputInternalDir, 'index.d.ts');
    let indexDts = bundle_dts_1.cleanDts(await fs_extra_1.default.readFile(indexDtsSrcPath, 'utf8'));
    indexDts = prependExtModules(indexDts);
    await fs_extra_1.default.writeFile(indexDtsDestPath, indexDts);
    // @stencil/core/internal/stencil-private.d.ts
    const privateDtsSrcPath = path_1.join(declarationsInputDir, 'stencil-private.d.ts');
    const privateDtsDestPath = path_1.join(outputInternalDir, 'stencil-private.d.ts');
    const privateDts = bundle_dts_1.cleanDts(await fs_extra_1.default.readFile(privateDtsSrcPath, 'utf8'));
    await fs_extra_1.default.writeFile(privateDtsDestPath, privateDts);
    // @stencil/core/internal/stencil-public.compiler.d.ts
    const compilerDtsSrcPath = path_1.join(declarationsInputDir, 'stencil-public-compiler.d.ts');
    const compilerDtsDestPath = path_1.join(outputInternalDir, 'stencil-public-compiler.d.ts');
    const compilerDts = bundle_dts_1.cleanDts(await fs_extra_1.default.readFile(compilerDtsSrcPath, 'utf8'));
    await fs_extra_1.default.writeFile(compilerDtsDestPath, compilerDts);
    // @stencil/core/internal/stencil-public-docs.d.ts
    const docsDtsSrcPath = path_1.join(declarationsInputDir, 'stencil-public-docs.d.ts');
    const docsDtsDestPath = path_1.join(outputInternalDir, 'stencil-public-docs.d.ts');
    const docsDts = bundle_dts_1.cleanDts(await fs_extra_1.default.readFile(docsDtsSrcPath, 'utf8'));
    await fs_extra_1.default.writeFile(docsDtsDestPath, docsDts);
    // @stencil/core/internal/stencil-public-runtime.d.ts
    const runtimeDtsSrcPath = path_1.join(declarationsInputDir, 'stencil-public-runtime.d.ts');
    const runtimeDtsDestPath = path_1.join(outputInternalDir, 'stencil-public-runtime.d.ts');
    const runtimeDts = bundle_dts_1.cleanDts(await fs_extra_1.default.readFile(runtimeDtsSrcPath, 'utf8'));
    await fs_extra_1.default.writeFile(runtimeDtsDestPath, runtimeDts);
    // @stencil/core/internal/stencil-ext-modules.d.ts (.svg/.css)
    const srcExtModuleOutput = path_1.join(opts.srcDir, 'declarations', 'stencil-ext-modules.d.ts');
    const dstExtModuleOutput = path_1.join(outputInternalDir, 'stencil-ext-modules.d.ts');
    await fs_extra_1.default.copyFile(srcExtModuleOutput, dstExtModuleOutput);
}
function prependExtModules(content) {
    return `/// <reference path="./stencil-ext-modules.d.ts" />\n` + content;
}
async function copyStencilCoreEntry(opts) {
    // write @stencil/core entry
    const stencilCoreSrcDir = path_1.join(opts.srcDir, 'internal', 'stencil-core');
    const stencilCoreDstDir = path_1.join(opts.output.internalDir, 'stencil-core');
    await fs_extra_1.default.ensureDir(stencilCoreDstDir);
    await fs_extra_1.default.copy(stencilCoreSrcDir, stencilCoreDstDir);
}
