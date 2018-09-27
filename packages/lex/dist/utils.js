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
var boxen_1 = __importDefault(require("boxen"));
var chalk_1 = __importDefault(require("chalk"));
var cpy_1 = __importDefault(require("cpy"));
var find_file_up_1 = __importDefault(require("find-file-up"));
var fs_1 = __importDefault(require("fs"));
var glob_1 = __importDefault(require("glob"));
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var ora_1 = __importDefault(require("ora"));
var path_1 = __importDefault(require("path"));
var rimraf_1 = __importDefault(require("rimraf"));
var LexConfig_1 = require("./LexConfig");
exports.cwd = process.cwd();
exports.log = function (message, type, quiet) {
    if (type === void 0) { type = 'info'; }
    if (quiet === void 0) { quiet = false; }
    if (!quiet) {
        var color = void 0;
        switch (type) {
            case 'error':
                color = chalk_1.default.red;
                break;
            case 'note':
                color = chalk_1.default.grey;
                break;
            case 'success':
                color = chalk_1.default.greenBright;
                break;
            case 'warn':
                color = chalk_1.default.yellow;
                break;
            default:
                color = chalk_1.default.cyan;
                break;
        }
        console.log(color(message));
    }
};
exports.getFilenames = function (props) {
    var callback = props.callback, cliName = props.cliName, name = props.name, quiet = props.quiet, type = props.type, useTypescript = props.useTypescript;
    var nameCaps;
    var itemNames = ['stores', 'views'];
    if (!name) {
        if (itemNames.includes(name)) {
            exports.log("\n" + cliName + " Error: " + type + " name is required. Please use 'lex -h' for options.", 'error', quiet);
            return callback(1);
        }
    }
    else {
        nameCaps = "" + name.charAt(0).toUpperCase() + name.substr(1);
    }
    exports.log(cliName + " adding " + type + "...", 'info', quiet);
    var templatePath;
    var templateExt;
    var templateReact;
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
    return {
        nameCaps: nameCaps,
        templateExt: templateExt,
        templatePath: templatePath,
        templateReact: templateReact
    };
};
exports.createSpinner = function (quiet) {
    if (quiet === void 0) { quiet = false; }
    if (quiet) {
        return {
            fail: function () { },
            start: function () { },
            succeed: function () { }
        };
    }
    return ora_1.default({ color: 'yellow' });
};
exports.copyFiles = function (files, outputDir, typeName, spinner) { return __awaiter(_this, void 0, void 0, function () {
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
exports.copyFileSync = function (source, target) {
    var targetFile = target;
    if (fs_1.default.existsSync(target)) {
        if (fs_1.default.lstatSync(target).isDirectory()) {
            targetFile = path_1.default.join(target, path_1.default.basename(source));
        }
    }
    fs_1.default.writeFileSync(targetFile, fs_1.default.readFileSync(source));
};
exports.copyFolderRecursiveSync = function (source, target) {
    var files = [];
    var targetFolder = path_1.default.join(target, path_1.default.basename(source));
    if (!fs_1.default.existsSync(targetFolder)) {
        fs_1.default.mkdirSync(targetFolder);
    }
    if (fs_1.default.lstatSync(source).isDirectory()) {
        files = fs_1.default.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path_1.default.join(source, file);
            if (fs_1.default.lstatSync(curSource).isDirectory()) {
                exports.copyFolderRecursiveSync(curSource, targetFolder);
            }
            else {
                exports.copyFileSync(curSource, targetFolder);
            }
        });
    }
};
exports.getPackageJson = function (packagePath) {
    var formatPath = packagePath || process.cwd() + "/package.json";
    var packageData = fs_1.default.readFileSync(formatPath).toString();
    return JSON.parse(packageData);
};
exports.removeFiles = function (fileName, isRelative) {
    if (isRelative === void 0) { isRelative = false; }
    return new Promise(function (resolve, reject) {
        var filePath = isRelative ? path_1.default.resolve(exports.cwd, fileName) : fileName;
        rimraf_1.default(filePath, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};
exports.setPackageJson = function (json, packagePath) {
    if (!json) {
        return;
    }
    var formatPath = packagePath || process.cwd() + "/package.json";
    fs_1.default.writeFileSync(formatPath, JSON.stringify(json, null, 2));
};
exports.linkedModules = function (startPath) {
    var workingPath = startPath || process.cwd();
    var modulePath;
    var prefix;
    if (workingPath.includes('@')) {
        prefix = "@" + workingPath.split('@').pop();
        modulePath = workingPath;
    }
    else {
        modulePath = path_1.default.join(workingPath, 'node_modules');
    }
    var foundPaths = glob_1.default.sync(modulePath + "/*");
    return foundPaths.reduce(function (list, foundPath) {
        try {
            var stats = fs_1.default.lstatSync(foundPath);
            if (stats.isDirectory()) {
                var deepList = exports.linkedModules(foundPath);
                list.push.apply(list, deepList);
            }
            else if (stats.isSymbolicLink()) {
                var moduleNames = ([prefix, path_1.default.basename(foundPath)]).filter(function (item) { return !isEmpty_1.default(item); });
                list.push({ name: "" + moduleNames.join('/'), path: foundPath });
            }
            return list;
        }
        catch (fsError) {
            throw fsError;
        }
    }, []);
};
exports.checkLinkedModules = function () {
    var linked = exports.linkedModules();
    if (linked.length) {
        var msgModule = linked.length > 1 ? 'Modules' : 'Module';
        var linkedMsg = linked.reduce(function (msg, linkedModule) {
            return msg + "\n * " + linkedModule.name;
        }, "Linked " + msgModule + ":");
        exports.log(boxen_1.default(linkedMsg, { borderStyle: 'round', dimBorder: true, padding: 1 }), 'warn');
    }
};
exports.relativeFilePath = function (filename, nodePath, backUp) {
    if (backUp === void 0) { backUp = 0; }
    var nestDepth = 10;
    if (backUp) {
        var filePath = find_file_up_1.default.sync(filename, nodePath, nestDepth);
        var previousPath = Array(backUp).fill(null).map(function () { return '../'; }).join('');
        return path_1.default.resolve(filePath, previousPath);
    }
    return find_file_up_1.default.sync(filename, nodePath, nestDepth);
};
exports.updateTemplateName = function (filePath, replace, replaceCaps) {
    var data = fs_1.default.readFileSync(filePath, 'utf8');
    data = data.replace(/sample/g, replace);
    data = data.replace(/Sample/g, replaceCaps);
    fs_1.default.writeFileSync(filePath, data, 'utf8');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBNlBBOztBQTdQQSxnREFBMEI7QUFDMUIsZ0RBQTBCO0FBQzFCLDRDQUFzQjtBQUN0Qiw4REFBc0M7QUFDdEMsMENBQW9CO0FBQ3BCLDhDQUF3QjtBQUN4QiwyREFBcUM7QUFDckMsNENBQXNCO0FBQ3RCLDhDQUF3QjtBQUN4QixrREFBNEI7QUFFNUIseUNBQXNDO0FBRXpCLFFBQUEsR0FBRyxHQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUU1QixRQUFBLEdBQUcsR0FBRyxVQUFDLE9BQWUsRUFBRSxJQUFxQixFQUFFLEtBQWE7SUFBcEMscUJBQUEsRUFBQSxhQUFxQjtJQUFFLHNCQUFBLEVBQUEsYUFBYTtJQUN2RSxJQUFHLENBQUMsS0FBSyxFQUFFO1FBQ1QsSUFBSSxLQUFLLFNBQUEsQ0FBQztRQUVWLFFBQU8sSUFBSSxFQUFFO1lBQ1gsS0FBSyxPQUFPO2dCQUNWLEtBQUssR0FBRyxlQUFLLENBQUMsR0FBRyxDQUFDO2dCQUNsQixNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULEtBQUssR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNuQixNQUFNO1lBQ1IsS0FBSyxTQUFTO2dCQUNaLEtBQUssR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDO2dCQUMxQixNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULEtBQUssR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNyQixNQUFNO1lBQ1I7Z0JBQ0UsS0FBSyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE1BQU07U0FDVDtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDN0I7QUFDSCxDQUFDLENBQUM7QUFFVyxR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