"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReplaceData = exports.getOptions = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vermoji_1 = require("./vermoji");
/**
 * Retrieves information used during a 'process' that requires knowledge of various project file paths, Stencil version
 * information, and GitHub repo metadata. A 'process' may include, but is not limited to:
 * - generating a new release
 * - regenerating a license file
 * - validating a build
 * @param rootDir the root directory of the project
 * @param inputOpts any build options to override manually
 * @returns an entity containing various fields to be used by some process
 */
function getOptions(rootDir, inputOpts = {}) {
    const srcDir = (0, path_1.join)(rootDir, 'src');
    const packageJsonPath = (0, path_1.join)(rootDir, 'package.json');
    const packageLockJsonPath = (0, path_1.join)(rootDir, 'package-lock.json');
    const changelogPath = (0, path_1.join)(rootDir, 'CHANGELOG.md');
    const nodeModulesDir = (0, path_1.join)(rootDir, 'node_modules');
    const typescriptDir = (0, path_1.join)(nodeModulesDir, 'typescript');
    const typescriptLibDir = (0, path_1.join)(typescriptDir, 'lib');
    const buildDir = (0, path_1.join)(rootDir, 'build');
    const scriptsDir = (0, path_1.join)(rootDir, 'scripts');
    const scriptsBuildDir = (0, path_1.join)(scriptsDir, 'build');
    const scriptsBundlesDir = (0, path_1.join)(scriptsDir, 'bundles');
    const bundleHelpersDir = (0, path_1.join)(scriptsBundlesDir, 'helpers');
    const opts = {
        ghRepoOrg: 'ionic-team',
        ghRepoName: 'stencil',
        rootDir,
        srcDir,
        packageJsonPath,
        packageLockJsonPath,
        changelogPath,
        nodeModulesDir,
        typescriptDir,
        typescriptLibDir,
        buildDir,
        scriptsDir,
        scriptsBuildDir,
        scriptsBundlesDir,
        bundleHelpersDir,
        output: {
            cliDir: (0, path_1.join)(rootDir, 'cli'),
            compilerDir: (0, path_1.join)(rootDir, 'compiler'),
            devServerDir: (0, path_1.join)(rootDir, 'dev-server'),
            internalDir: (0, path_1.join)(rootDir, 'internal'),
            mockDocDir: (0, path_1.join)(rootDir, 'mock-doc'),
            screenshotDir: (0, path_1.join)(rootDir, 'screenshot'),
            sysNodeDir: (0, path_1.join)(rootDir, 'sys', 'node'),
            testingDir: (0, path_1.join)(rootDir, 'testing'),
        },
        packageJson: JSON.parse((0, fs_extra_1.readFileSync)(packageJsonPath, 'utf8')),
        version: null,
        buildId: null,
        isProd: false,
        isCI: false,
        isPublishRelease: false,
        vermoji: null,
        tag: 'dev',
    };
    Object.assign(opts, inputOpts);
    if (!opts.buildId) {
        opts.buildId = getBuildId();
    }
    if (!opts.version) {
        opts.version = '0.0.0-dev.' + opts.buildId;
    }
    if (opts.isPublishRelease) {
        if (!opts.isProd) {
            throw new Error('release must also be a prod build');
        }
    }
    if (!opts.vermoji) {
        if (opts.isProd) {
            opts.vermoji = (0, vermoji_1.getVermoji)(opts.changelogPath);
        }
        else {
            opts.vermoji = '💎';
        }
    }
    return opts;
}
exports.getOptions = getOptions;
/**
 * Generates an object containing versioning information of various packages installed at build time
 * @param opts the options being used during a build
 * @returns an object that contains package names/versions installed at the time a build was invoked
 */
function createReplaceData(opts) {
    const CACHE_BUSTER = 7;
    const typescriptPkg = require((0, path_1.join)(opts.typescriptDir, 'package.json'));
    opts.typescriptVersion = typescriptPkg.version;
    const transpileId = typescriptPkg.name + typescriptPkg.version + '_' + CACHE_BUSTER;
    const terserPkg = getPkg(opts, 'terser');
    opts.terserVersion = terserPkg.version;
    const minifyJsId = terserPkg.name + terserPkg.version + '_' + CACHE_BUSTER;
    const rollupPkg = getPkg(opts, 'rollup');
    opts.rollupVersion = rollupPkg.version;
    const bundlerId = rollupPkg.name + rollupPkg.version + '_' + CACHE_BUSTER;
    const autoprefixerPkg = getPkg(opts, 'autoprefixer');
    const postcssPkg = getPkg(opts, 'postcss');
    const optimizeCssId = autoprefixerPkg.name + autoprefixerPkg.version + '_' + postcssPkg.name + postcssPkg.version + '_' + CACHE_BUSTER;
    const parse5Pkg = getPkg(opts, 'parse5');
    opts.parse5Verion = parse5Pkg.version;
    const sizzlePkg = getPkg(opts, 'sizzle');
    opts.sizzleVersion = sizzlePkg.version;
    return {
        __BUILDID__: opts.buildId,
        '__BUILDID:BUNDLER__': bundlerId,
        '__BUILDID:MINIFYJS__': minifyJsId,
        '__BUILDID:OPTIMIZECSS__': optimizeCssId,
        '__BUILDID:TRANSPILE__': transpileId,
        '__VERSION:STENCIL__': opts.version,
        '__VERSION:PARSE5__': parse5Pkg.version,
        '__VERSION:ROLLUP__': rollupPkg.version,
        '__VERSION:SIZZLE__': rollupPkg.version,
        '__VERSION:TERSER__': terserPkg.version,
        '__VERSION:TYPESCRIPT__': typescriptPkg.version,
        __VERMOJI__: opts.vermoji,
    };
}
exports.createReplaceData = createReplaceData;
/**
 * Retrieves a package from the `node_modules` directory in the given `opts` parameter
 * @param opts the options being used during a build
 * @param pkgName the name of the NPM package to retrieve
 * @returns information about the retrieved package
 */
function getPkg(opts, pkgName) {
    return require((0, path_1.join)(opts.nodeModulesDir, pkgName, 'package.json'));
}
function getBuildId() {
    const d = new Date();
    return [
        d.getUTCFullYear() + '',
        ('0' + (d.getUTCMonth() + 1)).slice(-2),
        ('0' + d.getUTCDate()).slice(-2),
        ('0' + d.getUTCHours()).slice(-2),
        ('0' + d.getUTCMinutes()).slice(-2),
        ('0' + d.getUTCSeconds()).slice(-2),
    ].join('');
}
