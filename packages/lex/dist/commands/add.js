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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
var clean_1 = require("./clean");
var copy_1 = require("./copy");
var updateName = function (filePath, replace, replaceCaps) {
    var data = fs.readFileSync(filePath, 'utf8');
    data = data.replace(/sample/g, replace);
    data = data.replace(/Sample/g, replaceCaps);
    fs.writeFileSync(filePath, data, 'utf8');
};
exports.add = function (type, name, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, quiet, cwd, _b, outputPath, sourcePath, useTypescript, nameCaps, itemNames, templatePath, templateExt, templateReact, _c, storePath, storeTestPath, storeFilePath, templatePath_1, data, destPath, viewPath, viewStylePath, viewTestPath, viewFilePath;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, quiet = cmd.quiet;
                    cwd = process.cwd();
                    LexConfig_1.LexConfig.parseConfig(cmd, false);
                    _b = LexConfig_1.LexConfig.config, outputPath = _b.outputPath, sourcePath = _b.sourcePath, useTypescript = _b.useTypescript;
                    itemNames = ['stores', 'views'];
                    if (!name) {
                        if (itemNames.includes(name)) {
                            utils_1.log("\n" + cliName + " Error: " + type + " name is required. Please use 'lex -h' for options.", 'error', quiet);
                            return [2, callback(1)];
                        }
                    }
                    else {
                        nameCaps = "" + name.charAt(0).toUpperCase() + name.substr(1);
                    }
                    utils_1.log(cliName + " adding " + type + "...", 'info', quiet);
                    if (useTypescript) {
                        templatePath = '../../templates/typescript';
                        templateExt = '.ts';
                        templateReact = '.tsx';
                    }
                    else {
                        templatePath = '../../templates/flow';
                        templateExt = '.js';
                        templateReact = '.js';
                    }
                    _c = type;
                    switch (_c) {
                        case 'store': return [3, 1];
                        case 'tsconfig': return [3, 2];
                        case 'view': return [3, 4];
                        case 'vscode': return [3, 5];
                    }
                    return [3, 7];
                case 1:
                    {
                        storePath = cwd + "/" + nameCaps + "Store";
                        try {
                            if (!fs.existsSync(storePath)) {
                                copy_1.copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleStore'), cwd);
                                fs.renameSync(cwd + "/.SampleStore", storePath);
                                storeTestPath = storePath + "/" + nameCaps + "Store.test" + templateExt;
                                fs.renameSync(storePath + "/SampleStore.test" + templateExt + ".txt", storeTestPath);
                                updateName(storeTestPath, name, nameCaps);
                                storeFilePath = storePath + "/" + nameCaps + "Store" + templateExt;
                                fs.renameSync(storePath + "/SampleStore" + templateExt + ".txt", storeFilePath);
                                updateName(storeFilePath, name, nameCaps);
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
                        return [3, 8];
                    }
                    _d.label = 2;
                case 2: return [4, clean_1.removeFiles('tsconfig.json', true)];
                case 3:
                    _d.sent();
                    templatePath_1 = path.resolve(__dirname, '../../tsconfig.json');
                    data = fs.readFileSync(templatePath_1, 'utf8');
                    data = data.replace(/.\/src/g, sourcePath);
                    data = data.replace(/.\/dist/g, outputPath);
                    destPath = path.resolve(cwd, './tsconfig.json');
                    fs.writeFileSync(destPath, data, 'utf8');
                    return [3, 8];
                case 4:
                    {
                        viewPath = cwd + "/" + nameCaps + "View";
                        try {
                            if (!fs.existsSync(viewPath)) {
                                copy_1.copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleView'), cwd);
                                fs.renameSync(cwd + "/.SampleView", viewPath);
                                viewStylePath = viewPath + "/" + name + "View.css";
                                fs.renameSync(viewPath + "/sampleView.css", viewStylePath);
                                updateName(viewStylePath, name, nameCaps);
                                viewTestPath = viewPath + "/" + nameCaps + "View.test" + templateReact;
                                fs.renameSync(viewPath + "/SampleView.test" + templateReact + ".txt", viewTestPath);
                                updateName(viewTestPath, name, nameCaps);
                                viewFilePath = viewPath + "/" + nameCaps + "View" + templateReact;
                                fs.renameSync(viewPath + "/SampleView" + templateReact + ".txt", viewFilePath);
                                updateName(viewFilePath, name, nameCaps);
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
                        return [3, 8];
                    }
                    _d.label = 5;
                case 5: return [4, clean_1.removeFiles('.vscode', true)];
                case 6:
                    _d.sent();
                    copy_1.copyFolderRecursiveSync(path.resolve(__dirname, '../../.vscode'), cwd);
                    return [3, 8];
                case 7:
                    {
                        utils_1.log("\n" + cliName + " Error: \"" + type + "\" does not exist. Please use 'lex -h' for options.", 'error', quiet);
                        return [2, callback(1)];
                    }
                    _d.label = 8;
                case 8: return [2, callback(0)];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2FkZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBbUtBOztBQW5LQSxxQ0FBeUI7QUFDekIseUNBQTZCO0FBRTdCLDBDQUF1QztBQUN2QyxrQ0FBNkI7QUFDN0IsaUNBQW9DO0FBQ3BDLCtCQUErQztBQUUvQyxJQUFNLFVBQVUsR0FBRyxVQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLFdBQW1CO0lBQ3hFLElBQUksSUFBSSxHQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JELElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4QyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDNUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQztBQUVXLFFBQUEsR0FBRyxHQUFHLFVBQU8sSUFBWSxFQUFFLElBQVksRUFBRSxHQUFRLEVBQUUsUUFBNEI7SUFBNUIseUJBQUEsRUFBQSxXQUFnQixPQUFPLENBQUMsSUFBSTs7Ozs7O29CQUNuRixLQUEwQixHQUFHLFFBQWQsRUFBZixPQUFPLG1CQUFHLEtBQUssS0FBQSxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFDL0IsR0FBRyxHQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFHbEMscUJBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM1QixLQUEwQyxxQkFBUyxDQUFDLE1BQU0sRUFBekQsVUFBVSxnQkFBQSxFQUFFLFVBQVUsZ0JBQUEs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