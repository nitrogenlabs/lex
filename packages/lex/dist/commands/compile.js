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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9jb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQXFQQTs7QUFyUEEsNENBQXNCO0FBQ3RCLGdEQUEwQjtBQUMxQiwwQ0FBb0I7QUFDcEIsOENBQXdCO0FBRXhCLDBDQUF1QztBQUN2QyxrQ0FBa0Y7QUFDbEYsaUNBQW9DO0FBRXBDLElBQU0sU0FBUyxHQUFHLFVBQU8sS0FBZSxFQUFFLFNBQWlCLEVBQUUsUUFBZ0IsRUFBRSxPQUFPOzs7OztnQkFDOUUsS0FBbUMscUJBQVMsQ0FBQyxNQUFNLEVBQWxELGNBQWMsb0JBQUEsRUFBRSxjQUFjLG9CQUFBLENBQXFCO2dCQUNwRCxRQUFRLEdBQWEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFFBQWdCLElBQUssT0FBRyxjQUFjLFNBQUksUUFBVSxFQUEvQixDQUErQixDQUFDLENBQUM7Ozs7Z0JBR3RGLFVBQWdCLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFXLFFBQVEsY0FBVyxDQUFDLENBQUM7Z0JBQzlDLFdBQU0sYUFBRyxDQUFDLFFBQVEsRUFBSyxjQUFjLFNBQUksU0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFDLFFBQVE7d0JBQzVFLE9BQUssR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO3dCQUM1QixPQUFPLENBQUMsSUFBSSxHQUFHLGFBQVcsUUFBUSxnQkFBVyxRQUFRLENBQUMsY0FBYyxZQUFPLFFBQVEsQ0FBQyxVQUFVLFNBQU0sQ0FBQztvQkFDdkcsQ0FBQyxDQUFDLEVBQUE7O2dCQUhGLFNBR0UsQ0FBQztnQkFDSCxPQUFPLENBQUMsT0FBTyxDQUFDLHlCQUF1QixPQUFLLFNBQUksUUFBUSxZQUFTLENBQUMsQ0FBQzs7OztnQkFHbkUsT0FBTyxDQUFD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