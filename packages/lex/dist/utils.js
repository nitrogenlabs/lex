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
    var prefix = '';
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
                list.push({ name: prefix + "/" + path_1.default.basename(foundPath), path: foundPath });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBMlBBOztBQTNQQSxnREFBMEI7QUFDMUIsZ0RBQTBCO0FBQzFCLDRDQUFzQjtBQUN0Qiw4REFBc0M7QUFDdEMsMENBQW9CO0FBQ3BCLDhDQUF3QjtBQUN4Qiw0Q0FBc0I7QUFDdEIsOENBQXdCO0FBQ3hCLGtEQUE0QjtBQUU1Qix5Q0FBc0M7QUFFekIsUUFBQSxHQUFHLEdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTVCLFFBQUEsR0FBRyxHQUFHLFVBQUMsT0FBZSxFQUFFLElBQXFCLEVBQUUsS0FBYTtJQUFwQyxxQkFBQSxFQUFBLGFBQXFCO0lBQUUsc0JBQUEsRUFBQSxhQUFhO0lBQ3ZFLElBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDVCxJQUFJLEtBQUssU0FBQSxDQUFDO1FBRVYsUUFBTyxJQUFJLEVBQUU7WUFDWCxLQUFLLE9BQU87Z0JBQ1YsS0FBSyxHQUFHLGVBQUssQ0FBQyxHQUFHLENBQUM7Z0JBQ2xCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE1BQU07WUFDUixLQUFLLFNBQVM7Z0JBQ1osS0FBSyxHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUM7Z0JBQzFCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQ3JCLE1BQU07WUFDUjtnQkFDRSxLQUFLLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQztnQkFDbkIsTUFBTTtTQUNUO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUMsQ0FBQztBQUVXLFFBQUEsWUFBWSxHQUFH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