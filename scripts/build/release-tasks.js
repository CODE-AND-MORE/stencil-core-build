"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReleaseTasks = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const execa_1 = __importDefault(require("execa"));
const listr_1 = __importDefault(require("listr"));
const release_utils_1 = require("./utils/release-utils");
const validate_build_1 = require("./test/validate-build");
const license_1 = require("./license");
const build_1 = require("./build");
/**
 * Runs a litany of tasks used to ensure a safe release of a new version of Stencil
 * @param opts build options containing the metadata needed to release a new version of Stencil
 * @param args stringified arguments used to influence the release steps that are taken
 */
function runReleaseTasks(opts, args) {
    const rootDir = opts.rootDir;
    const pkg = opts.packageJson;
    const tasks = [];
    const newVersion = opts.version;
    const isDryRun = args.includes('--dry-run') || opts.version.includes('dryrun');
    const isAnyBranch = args.includes('--any-branch');
    let tagPrefix;
    if (isDryRun) {
        console.log(ansi_colors_1.default.bold.yellow(`\n  🏃‍ Dry Run!\n`));
    }
    if (!opts.isPublishRelease) {
        tasks.push({
            title: 'Validate version',
            task: () => {
                if (!(0, release_utils_1.isValidVersionInput)(opts.version)) {
                    throw new Error(`Version should be either ${release_utils_1.SEMVER_INCREMENTS.join(', ')}, or a valid semver version.`);
                }
            },
            skip: () => isDryRun,
        });
    }
    if (opts.isPublishRelease) {
        tasks.push({
            title: 'Check for pre-release version',
            task: () => {
                if (!pkg.private && (0, release_utils_1.isPrereleaseVersion)(newVersion) && !opts.tag) {
                    throw new Error('You must specify a dist-tag using --tag when publishing a pre-release version. This prevents accidentally tagging unstable versions as "latest". https://docs.npmjs.com/cli/dist-tag');
                }
            },
        });
    }
    tasks.push({
        title: 'Check git tag existence',
        task: () => (0, execa_1.default)('git', ['fetch'])
            // Retrieve the prefix for a version string - https://docs.npmjs.com/cli/v7/using-npm/config#tag-version-prefix
            .then(() => (0, execa_1.default)('npm', ['config', 'get', 'tag-version-prefix']))
            .then(({ stdout }) => (tagPrefix = stdout), () => { })
            // verify that a tag for the new version string does not already exist by checking the output of
            // `git rev-parse --verify`
            .then(() => (0, execa_1.default)('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tagPrefix}${newVersion}`]))
            .then(({ stdout }) => {
            if (stdout) {
                throw new Error(`Git tag \`${tagPrefix}${newVersion}\` already exists.`);
            }
        }, (err) => {
            // Command fails with code 1 and no output if the tag does not exist, even though `--quiet` is provided
            // https://github.com/sindresorhus/np/pull/73#discussion_r72385685
            if (err.stdout !== '' || err.stderr !== '') {
                throw err;
            }
        }),
        skip: () => isDryRun,
    }, {
        title: 'Check current branch',
        task: () => (0, execa_1.default)('git', ['symbolic-ref', '--short', 'HEAD']).then(({ stdout }) => {
            if (stdout !== 'main' && !isAnyBranch) {
                throw new Error('Not on `main` branch. Use --any-branch to publish anyway.');
            }
        }),
        skip: () => isDryRun,
    }, {
        title: 'Check local working tree',
        task: () => (0, execa_1.default)('git', ['status', '--porcelain']).then(({ stdout }) => {
            if (stdout !== '') {
                throw new Error('Unclean working tree. Commit or stash changes first.');
            }
        }),
        skip: () => isDryRun,
    }, {
        title: 'Check remote history',
        task: () => (0, execa_1.default)('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD']).then(({ stdout }) => {
            if (stdout !== '0' && !isAnyBranch) {
                throw new Error('Remote history differs. Please pull changes.');
            }
        }),
        skip: () => isDryRun,
    });
    if (!opts.isPublishRelease) {
        tasks.push({
            title: `Install npm dependencies ${ansi_colors_1.default.dim('(npm ci)')}`,
            task: () => (0, execa_1.default)('npm', ['ci'], { cwd: rootDir }),
        }, {
            title: `Transpile Stencil ${ansi_colors_1.default.dim('(tsc.prod)')}`,
            task: () => (0, execa_1.default)('npm', ['run', 'tsc.prod'], { cwd: rootDir }),
        }, {
            title: `Bundle @stencil/core ${ansi_colors_1.default.dim('(' + opts.buildId + ')')}`,
            task: () => (0, build_1.bundleBuild)(opts),
        }, {
            title: 'Run jest tests',
            task: () => (0, execa_1.default)('npm', ['run', 'test.jest'], { cwd: rootDir }),
        }, {
            title: 'Run karma tests',
            task: () => (0, execa_1.default)('npm', ['run', 'test.karma.prod'], { cwd: rootDir }),
        }, {
            title: 'Build license',
            task: () => (0, license_1.createLicense)(rootDir),
        }, {
            title: 'Validate build',
            task: () => (0, validate_build_1.validateBuild)(rootDir),
        }, {
            title: `Set package.json version to ${ansi_colors_1.default.bold.yellow(opts.version)}`,
            task: async () => {
                // use `--no-git-tag-version` to ensure that the tag for the release is not prematurely created
                await (0, execa_1.default)('npm', ['version', '--no-git-tag-version', opts.version], { cwd: rootDir });
            },
        }, {
            title: `Generate ${opts.version} Changelog ${opts.vermoji}`,
            task: () => {
                return (0, release_utils_1.updateChangeLog)(opts);
            },
        });
    }
    if (opts.isPublishRelease) {
        tasks.push({
            title: 'Publish @stencil/core to npm',
            task: () => {
                const cmd = 'npm';
                const cmdArgs = ['publish', '--otp', opts.otp].concat(opts.tag ? ['--tag', opts.tag] : []);
                if (isDryRun) {
                    return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
                }
                return (0, execa_1.default)(cmd, cmdArgs, { cwd: rootDir });
            },
        }, {
            title: 'Tagging the latest git commit',
            task: () => {
                const cmd = 'git';
                const cmdArgs = ['tag', `v${opts.version}`];
                if (isDryRun) {
                    return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
                }
                return (0, execa_1.default)(cmd, cmdArgs, { cwd: rootDir });
            },
        }, {
            title: 'Pushing git commits',
            task: () => {
                const cmd = 'git';
                const cmdArgs = ['push'];
                if (isDryRun) {
                    return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
                }
                return (0, execa_1.default)(cmd, cmdArgs, { cwd: rootDir });
            },
        }, {
            title: 'Pushing git tags',
            task: () => {
                const cmd = 'git';
                const cmdArgs = ['push', '--tags'];
                if (isDryRun) {
                    return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
                }
                return (0, execa_1.default)(cmd, cmdArgs, { cwd: rootDir });
            },
        });
        if (opts.tag !== 'next' && opts.tag !== 'test') {
            tasks.push({
                title: 'Also set "next" npm tag on @stencil/core',
                task: () => {
                    const cmd = 'npm';
                    const cmdArgs = ['dist-tag', 'add', '@stencil/core@' + opts.version, 'next'];
                    if (isDryRun) {
                        return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
                    }
                    return (0, execa_1.default)(cmd, cmdArgs, { cwd: rootDir });
                },
            });
        }
    }
    if (opts.isPublishRelease) {
        tasks.push({
            title: 'Create Github Release',
            task: () => {
                return (0, release_utils_1.postGithubRelease)(opts);
            },
        });
    }
    const listr = new listr_1.default(tasks);
    listr
        .run()
        .then(() => {
        if (opts.isPublishRelease) {
            console.log(`\n ${opts.vermoji}  ${ansi_colors_1.default.bold.magenta(pkg.name)} ${ansi_colors_1.default.bold.yellow(newVersion)} published!! ${opts.vermoji}\n`);
        }
        else {
            console.log(`\n ${opts.vermoji}  ${ansi_colors_1.default.bold.magenta(pkg.name)} ${ansi_colors_1.default.bold.yellow(newVersion)} prepared, check the diffs and commit ${opts.vermoji}\n`);
        }
    })
        .catch((err) => {
        console.log(`\n🤒  ${ansi_colors_1.default.red(err)}\n`);
        console.log(err);
        process.exit(1);
    });
}
exports.runReleaseTasks = runReleaseTasks;
