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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWRkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFtS0E7O0FBbktBLHFDQUF5QjtBQUN6Qix5Q0FBNkI7QUFFN0IsMENBQXVDO0FBQ3ZDLGtDQUE2QjtBQUM3QixpQ0FBb0M7QUFDcEMsK0JBQStDO0FBRS9DLElBQU0sVUFBVSxHQUFHLFVBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsV0FBbUI7SUFDeEUsSUFBSSxJQUFJLEdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM1QyxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDO0FBRVcsUUFBQSxHQUFHLEdBQUcsVUFBTyxJQUFZLEVBQUUsSUFBWSxFQUFFLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7b0JBQ25GLEtBQTBCLEdBQUcsUUFBZCxFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQUUsS0FBSyxHQUFJLEdBQUcsTUFBUCxDQUFRO29CQUMvQixHQUFHLEdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUdsQyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzVCLEtBQTBDLHFCQUFTLENBQUMsTUFBTSxFQUF6RCxVQUFVLGdCQUFBLEVBQUUsVUFBVSxnQkFBQSxFQUFFLGFBQWEsbUJBQUEsQ0FB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