"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var cpy_1 = __importDefault(require("cpy"));
var execa_1 = __importDefault(require("execa"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
var clean_1 = require("./clean");
var copyFiles = function (files, outputDir, typeName, spinner) { return __awaiter(_this, void 0, void 0, function () {
    var _a, outputFullPath, sourceFullPath, copyFrom, total_1, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = LexConfig_1.LexConfig.config, outputFullPath = _a.outputFullPath, sourceFullPath = _a.sourceFullPath;
                copyFrom = files.map(function (fileName) { return sourceFullPath + "/" + fileName; });
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                total_1 = 0;
                spinner.start("Copying " + typeName + " files...");
                return [4, cpy_1.default(copyFrom, outputFullPath + "/" + outputDir).on('progress', function (progress) {
                        total_1 = progress.totalFiles;
                        spinner.text = "Copying " + typeName + " files (" + progress.completedFiles + " of " + progress.totalFiles + ")...";
                    })];
            case 2:
                _b.sent();
                spinner.succeed("Successfully copied " + total_1 + " " + typeName + " files!");
                return [3, 4];
            case 3:
                error_1 = _b.sent();
                spinner.fail("Copying of " + typeName + " files failed.");
                return [3, 4];
            case 4: return [2];
        }
    });
}); };
exports.compile = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, config, quiet, remove, watch, spinner, _b, outputFullPath, sourceFullPath, useTypescript, nodePath, typescriptPath, typescriptOptions, typescript, error_2, babelPath, transpilerPreset, userPreset, babelOptions, babel, error_3, postcssPath, postcssOptions, error_4, error_5, error_6, error_7;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, config = cmd.config, quiet = cmd.quiet, remove = cmd.remove, watch = cmd.watch;
                    spinner = utils_1.createSpinner(quiet);
                    utils_1.log(cliName + " compiling...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    _b = LexConfig_1.LexConfig.config, outputFullPath = _b.outputFullPath, sourceFullPath = _b.sourceFullPath, useTypescript = _b.useTypescript;
                    nodePath = path_1.default.resolve(__dirname, '../../node_modules');
                    utils_1.checkLinkedModules();
                    if (!remove) return [3, 2];
                    return [4, clean_1.removeFiles(outputFullPath)];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    if (!useTypescript) return [3, 6];
                    LexConfig_1.LexConfig.checkTypescriptConfig();
                    typescriptPath = utils_1.relativeFilePath('typescript/bin/tsc', nodePath);
                    typescriptOptions = config ?
                        ['-p', config] :
                        [
                            '--allowSyntheticDefaultImports',
                            '--baseUrl', sourceFullPath,
                            '--declaration',
                            '--emitDeclarationOnly',
                            '--jsx', 'react',
                            '--lib', ['esnext', 'dom'],
                            '--module', 'commonjs',
                            '--moduleResolution', 'node',
                            '--noImplicitReturns',
                            '--noImplicitThis',
                            '--noStrictGenericChecks',
                            '--noUnusedLocals',
                            '--outDir', outputFullPath,
                            '--removeComments',
                            '--rootDir', sourceFullPath,
                            '--sourceMap',
                            '--sourceRoot', sourceFullPath,
                            '--target', 'es5',
                            '--typeRoots', ['node_modules/@types', 'node_modules/json-d-ts']
                        ];
                    spinner.start('Static type checking with Typescript...');
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4, execa_1.default(typescriptPath, typescriptOptions, { encoding: 'utf-8' })];
                case 4:
                    typescript = _c.sent();
                    if (!typescript.status) {
                        spinner.succeed('Successfully completed type checking!');
                    }
                    else {
                        spinner.fail('Type checking failed.');
                        return [2, callback(1)];
                    }
                    return [3, 6];
                case 5:
                    error_2 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_2.message, 'error', quiet);
                    spinner.fail('Type checking failed.');
                    return [2, callback(1)];
                case 6:
                    babelPath = utils_1.relativeFilePath('@babel/cli/bin/babel.js', nodePath);
                    transpilerPreset = path_1.default.resolve(__dirname, useTypescript ? '../babelTypescriptPreset.js' : '../babelFlowPreset.js');
                    userPreset = path_1.default.resolve(__dirname, '../babelPresets.js');
                    babelOptions = [
                        '--no-babelrc',
                        sourceFullPath,
                        '--out-dir',
                        outputFullPath,
                        '--ignore',
                        useTypescript ? '**/*.test.ts,**/*.test.tsx' : '**/*.test.js',
                        '--extensions',
                        useTypescript ? '.ts,.tsx' : '.js',
                        '-s',
                        'inline',
                        '--presets',
                        transpilerPreset + "," + userPreset
                    ];
                    if (watch) {
                        babelOptions.push('--watch');
                        spinner.start('Watching for changes...');
                    }
                    else {
                        spinner.start('Compiling with Babel...');
                    }
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 9, , 10]);
                    return [4, execa_1.default(babelPath, babelOptions, { encoding: 'utf-8' })];
                case 8:
                    babel = _c.sent();
                    if (!babel.status) {
                        spinner.succeed((babel.stdout || '').replace('.', '!').trim());
                    }
                    else {
                        spinner.fail('Code compiling failed.');
                        return [2, callback(1)];
                    }
                    return [3, 10];
                case 9:
                    error_3 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_3.message, 'error', quiet);
                    spinner.fail('Code compiling failed.');
                    return [2, callback(1)];
                case 10:
                    if (!fs_1.default.existsSync(sourceFullPath + "/styles")) return [3, 14];
                    postcssPath = utils_1.relativeFilePath('postcss-cli/bin/postcss', nodePath);
                    postcssOptions = [
                        sourceFullPath + "/styles/**/*.css",
                        '-d',
                        outputFullPath + "/styles",
                        '--config',
                        path_1.default.resolve(__dirname, '../../.postcssrc.js')
                    ];
                    _c.label = 11;
                case 11:
                    _c.trys.push([11, 13, , 14]);
                    return [4, execa_1.default(postcssPath, postcssOptions, { encoding: 'utf-8' })];
                case 12:
                    _c.sent();
                    spinner.succeed('Successfully formatted css!');
                    return [3, 14];
                case 13:
                    error_4 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_4.message, 'error', quiet);
                    spinner.fail('Failed formatting css.');
                    return [2, callback(1)];
                case 14:
                    if (!fs_1.default.existsSync(sourceFullPath + "/img")) return [3, 18];
                    _c.label = 15;
                case 15:
                    _c.trys.push([15, 17, , 18]);
                    return [4, copyFiles(['img/**/*.jpg', 'img/**/*.png', 'img/**/*.gif', 'img/**/*.svg'], 'img', 'image', spinner)];
                case 16:
                    _c.sent();
                    return [3, 18];
                case 17:
                    error_5 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_5.message, 'error', quiet);
                    spinner.fail('Failed to move images to output directory.');
                    return [2, callback(1)];
                case 18:
                    if (!fs_1.default.existsSync(sourceFullPath + "/fonts")) return [3, 22];
                    _c.label = 19;
                case 19:
                    _c.trys.push([19, 21, , 22]);
                    return [4, copyFiles([
                            'fonts/**/*.ttf',
                            'fonts/**/*.otf',
                            'fonts/**/*.woff',
                            'fonts/**/*.svg',
                            'fonts/**/*.woff2'
                        ], 'fonts', 'font', spinner)];
                case 20:
                    _c.sent();
                    return [3, 22];
                case 21:
                    error_6 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_6.message, 'error', quiet);
                    spinner.fail('Failed to move fonts to output directory.');
                    return [2, callback(1)];
                case 22:
                    if (!fs_1.default.existsSync(sourceFullPath + "/docs")) return [3, 26];
                    _c.label = 23;
                case 23:
                    _c.trys.push([23, 25, , 26]);
                    return [4, copyFiles(['docs/**/*.md'], 'docs', 'document', spinner)];
                case 24:
                    _c.sent();
                    return [3, 26];
                case 25:
                    error_7 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_7.message, 'error', quiet);
                    spinner.fail('Failed to move docs to output directory.');
                    return [2, callback(1)];
                case 26: return [2, callback(0)];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXBpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBcVBBOztBQXJQQSw0Q0FBc0I7QUFDdEIsZ0RBQTBCO0FBQzFCLDBDQUFvQjtBQUNwQiw4Q0FBd0I7QUFFeEIsMENBQXVDO0FBQ3ZDLGtDQUFrRjtBQUNsRixpQ0FBb0M7QUFFcEMsSUFBTSxTQUFTLEdBQUcsVUFBTyxLQUFlLEVBQUUsU0FBaUIsRUFBRSxRQUFnQixFQUFFLE9BQU87Ozs7O2dCQUM5RSxLQUFtQyxxQkFBUyxDQUFDLE1BQU0sRUFBbEQsY0FBYyxvQkFBQSxFQUFFLGNBQWMsb0JBQUEsQ0FBcUI7Z0JBQ3BELFFBQVEsR0FBYSxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBZ0IsSUFBSyxPQUFHLGNBQWMsU0FBSSxRQUFVLEVBQS9CLENBQStCLENBQUMsQ0FBQzs7OztnQkFHdEYsVUFBZ0IsQ0FBQyxDQUFDO2dCQUN0QixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQVcsUUFBUSxjQUFXLENBQUMsQ0FBQztnQkFDOUMsV0FBTSxhQUFHLENBQUMsUUFBUSxFQUFLLGNBQWMsU0FBSSxTQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQUMsUUFBUTt3QkFDNUUsT0FBSyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7d0JBQzVCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsYUFBVyxRQUFRLGdCQUFXLFFBQVEsQ0FBQyxjQUFjLFlBQU8sUUFBUSxDQUFDLFVBQVUsU0FBTSxDQUFDO29CQUN2RyxDQUFDLENBQUMsRUFBQTs7Z0JBSEYsU0FHRSxDQUFDO2dCQUNILE9BQU8sQ0FBQyxPQUFPLENBQUMseUJBQXVCLE9BQUssU0FBSSxRQUFRLFlBQVMsQ0FBQyxDQUFDOzs7O2dCQUduRSxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFjLFFB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