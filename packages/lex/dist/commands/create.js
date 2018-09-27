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
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var changelog_1 = require("../create/changelog");
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.create = function (type, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, outputFile, quiet, cwd, _b, outputPath, sourcePath, useTypescript, config, _c, _d, _e, nameCaps, templateExt, templatePath, storePath, storeTestPath, storeFilePath, templatePath, data, destPath, _f, nameCaps, templatePath, templateReact, viewPath, viewStylePath, viewTestPath, viewFilePath;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, outputFile = cmd.outputFile, quiet = cmd.quiet;
                    cwd = process.cwd();
                    utils_1.log(cliName + " create " + type + "...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    _b = LexConfig_1.LexConfig.config, outputPath = _b.outputPath, sourcePath = _b.sourcePath, useTypescript = _b.useTypescript;
                    if (useTypescript) {
                        LexConfig_1.LexConfig.checkTypescriptConfig();
                    }
                    config = LexConfig_1.LexConfig.config;
                    _c = type;
                    switch (_c) {
                        case 'changelog': return [3, 1];
                        case 'store': return [3, 3];
                        case 'tsconfig': return [3, 4];
                        case 'view': return [3, 6];
                        case 'vscode': return [3, 7];
                    }
                    return [3, 9];
                case 1:
                    _d = callback;
                    return [4, changelog_1.createChangelog({ cliName: cliName, config: config, outputFile: outputFile, quiet: quiet })];
                case 2: return [2, _d.apply(void 0, [_g.sent()])];
                case 3:
                    {
                        try {
                            _e = utils_1.getFilenames({}), nameCaps = _e.nameCaps, templateExt = _e.templateExt, templatePath = _e.templatePath;
                            storePath = cwd + "/" + nameCaps + "Store";
                            if (!fs_1.default.existsSync(storePath)) {
                                utils_1.copyFolderRecursiveSync(path_1.default.resolve(__dirname, templatePath, './.SampleStore'), cwd);
                                fs_1.default.renameSync(cwd + "/.SampleStore", storePath);
                                storeTestPath = storePath + "/" + nameCaps + "Store.test" + templateExt;
                                fs_1.default.renameSync(storePath + "/SampleStore.test" + templateExt + ".txt", storeTestPath);
                                utils_1.updateTemplateName(storeTestPath, name, nameCaps);
                                storeFilePath = storePath + "/" + nameCaps + "Store" + templateExt;
                                fs_1.default.renameSync(storePath + "/SampleStore" + templateExt + ".txt", storeFilePath);
                                utils_1.updateTemplateName(storeFilePath, name, nameCaps);
                            }
                            else {
                                utils_1.log("\n" + cliName + " Error: Cannot create new " + type + ". Directory, " + storePath + " already exists.", 'error', quiet);
                                return [2, callback(1)];
                            }
                        }
                        catch (error) {
                            utils_1.log("\n" + cliName + " Error: Cannot create new " + type + ". " + error.message, 'error', quiet);
                            return [2, callback(1)];
                        }
                        return [3, 9];
                    }
                    _g.label = 4;
                case 4: return [4, utils_1.removeFiles('tsconfig.json', true)];
                case 5:
                    _g.sent();
                    templatePath = path_1.default.resolve(__dirname, '../../tsconfig.json');
                    data = fs_1.default.readFileSync(templatePath, 'utf8');
                    data = data.replace(/.\/src/g, sourcePath);
                    data = data.replace(/.\/dist/g, outputPath);
                    destPath = path_1.default.resolve(cwd, './tsconfig.json');
                    fs_1.default.writeFileSync(destPath, data, 'utf8');
                    return [3, 9];
                case 6:
                    {
                        _f = utils_1.getFilenames({}), nameCaps = _f.nameCaps, templatePath = _f.templatePath, templateReact = _f.templateReact;
                        viewPath = cwd + "/" + nameCaps + "View";
                        try {
                            if (!fs_1.default.existsSync(viewPath)) {
                                utils_1.copyFolderRecursiveSync(path_1.default.resolve(__dirname, templatePath, './.SampleView'), cwd);
                                fs_1.default.renameSync(cwd + "/.SampleView", viewPath);
                                viewStylePath = viewPath + "/" + name + "View.css";
                                fs_1.default.renameSync(viewPath + "/sampleView.css", viewStylePath);
                                utils_1.updateTemplateName(viewStylePath, name, nameCaps);
                                viewTestPath = viewPath + "/" + nameCaps + "View.test" + templateReact;
                                fs_1.default.renameSync(viewPath + "/SampleView.test" + templateReact + ".txt", viewTestPath);
                                utils_1.updateTemplateName(viewTestPath, name, nameCaps);
                                viewFilePath = viewPath + "/" + nameCaps + "View" + templateReact;
                                fs_1.default.renameSync(viewPath + "/SampleView" + templateReact + ".txt", viewFilePath);
                                utils_1.updateTemplateName(viewFilePath, name, nameCaps);
                            }
                            else {
                                utils_1.log("\n" + cliName + " Error: Cannot create new " + type + ". Directory, " + viewPath + " already exists.", 'error', quiet);
                                return [2, callback(1)];
                            }
                        }
                        catch (error) {
                            utils_1.log("\n" + cliName + " Error: Cannot create new " + type + ". " + error.message, 'error', quiet);
                            return [2, callback(1)];
                        }
                        return [3, 9];
                    }
                    _g.label = 7;
                case 7: return [4, utils_1.removeFiles('.vscode', true)];
                case 8:
                    _g.sent();
                    utils_1.copyFolderRecursiveSync(path_1.default.resolve(__dirname, '../../.vscode'), cwd);
                    return [3, 9];
                case 9: return [2, callback(0)];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFxSUE7O0FBcklBLDBDQUFvQjtBQUNwQiw4Q0FBd0I7QUFFeEIsaURBQW9EO0FBQ3BELDBDQUF1QztBQUN2QyxrQ0FBcUc7QUFFeEYsUUFBQSxNQUFNLEdBQUcsVUFBTyxJQUFZLEVBQUUsR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7Ozs7OztvQkFDeEUsS0FBc0MsR0FBRyxRQUExQixFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQUUsVUFBVSxHQUFXLEdBQUcsV0FBZCxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFDM0MsR0FBRyxHQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDbEMsV0FBRyxDQUFJLE9BQU8sZ0JBQVcsSUFBSSxRQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUduRCxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDckIsS0FBMEMscUJBQVMsQ0FBQyxNQUFNLEVBQXpELFVBQVUsZ0JBQUEsRUFBRSxVQUFVLGdCQUFBLEVBQUUsYUFBYSxtQkFBQSxDQUFxQjtvQkFFakUsSUFBRyxhQUFhLEVBQUU7d0JBRWhCLHFCQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztxQkFDbkM7b0JBRU0sTUFBTSxHQUFJLHFCQUFTLE9BQWIsQ0FBYztvQkFFcEIsS0FBQSxJQUFJLENBQUE7OzZCQUNKLFdBQVcsQ0FBQyxDQUFaLGNBQVc7NkJBR1gsT0FBTyxDQUFDLENBQVIsY0FBTzs2QkFtQ1AsVUFBVSxDQUFDLENBQVgsY0FBVTs2QkFpQlYsTUFBTSxDQUFDLENBQVAsY0FBTTs2QkEwQ04s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