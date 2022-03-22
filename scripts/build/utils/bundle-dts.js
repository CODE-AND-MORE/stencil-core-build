"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDts = exports.bundleDts = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const bundle_generator_js_1 = require("dts-bundle-generator/dist/bundle-generator.js");
async function bundleDts(opts, inputFile) {
    const cachedDtsOutput = inputFile + '-bundled.d.ts';
    if (!opts.isProd) {
        try {
            return await fs_extra_1.default.readFile(cachedDtsOutput, 'utf8');
        }
        catch (e) { }
    }
    const entries = [
        {
            filePath: inputFile,
        },
    ];
    let outputCode = bundle_generator_js_1.generateDtsBundle(entries).join('\n');
    outputCode = cleanDts(outputCode);
    await fs_extra_1.default.writeFile(cachedDtsOutput, outputCode);
    return outputCode;
}
exports.bundleDts = bundleDts;
function cleanDts(dtsContent) {
    dtsContent = dtsContent.replace(/\/\/\/ <reference types="node" \/>/g, '');
    dtsContent = dtsContent.replace(/NodeJS.Process/g, 'any');
    dtsContent = dtsContent.replace(/import \{ URL \} from \'url\';/g, '');
    return dtsContent.trim() + '\n';
}
exports.cleanDts = cleanDts;
