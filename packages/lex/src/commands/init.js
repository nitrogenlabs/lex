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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var execa_1 = __importDefault(require("execa"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.init = function (appName, packageName, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, install, cmdPackageManager, quiet, typescript, cwd, status, spinner, tmpPath, appPath, dnpPath, _b, configPackageManager, configTypescript, packageManager, useTypescript, appModule, download, error_1, packagePath, packageJson, readmePath, install_1, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, install = cmd.install, cmdPackageManager = cmd.packageManager, quiet = cmd.quiet, typescript = cmd.typescript;
                    cwd = process.cwd();
                    status = 0;
                    spinner = utils_1.createSpinner(quiet);
                    utils_1.log(cliName + " is downloading the app module...", 'info', quiet);
                    spinner.start('Downloading app...');
                    tmpPath = path.resolve(cwd, './.lexTmp');
                    appPath = path.resolve(cwd, "./" + appName);
                    dnpPath = path.resolve(__dirname, '../../node_modules/download-npm-package/bin/cli.js');
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    _b = LexConfig_1.LexConfig.config, configPackageManager = _b.packageManager, configTypescript = _b.useTypescript;
                    packageManager = cmdPackageManager || configPackageManager;
                    useTypescript = typescript !== undefined ? typescript : configTypescript;
                    appModule = packageName;
                    if (!appModule) {
                        if (useTypescript) {
                            appModule = '@nlabs/arkhamjs-example-ts-react';
                        }
                        else {
                            appModule = '@nlabs/arkhamjs-example-flow-react';
                        }
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4, execa_1.default(dnpPath, [appModule, tmpPath], {})];
                case 2:
                    download = _c.sent();
                    status += download.status;
                    spinner.succeed('Successfully downloaded app!');
                    return [3, 4];
                case 3:
                    error_1 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: There was an error downloading " + appModule + ". Make sure the package exists and there is a network connection.", 'error', quiet);
                    spinner.fail('Downloaded of app failed.');
                    return [2, callback(1)];
                case 4:
                    try {
                        fs.renameSync(tmpPath + "/" + appModule, appPath);
                    }
                    catch (error) {
                        utils_1.log("\n" + cliName + " Error: There was an error downloading " + appModule + ". Make sure the package exists and there is a network connection.", 'error', quiet);
                        return [2, callback(1)];
                    }
                    packagePath = appPath + "/package.json";
                    packageJson = utils_1.getPackageJson(packagePath);
                    packageJson.name = appName;
                    packageJson.description = cliName + " created app";
                    packageJson.version = '0.1.0';
                    delete packageJson.keywords;
                    delete packageJson.author;
                    delete packageJson.contributors;
                    delete packageJson.repository;
                    delete packageJson.homepage;
                    delete packageJson.bugs;
                    try {
                        utils_1.setPackageJson(packageJson, packagePath);
                        readmePath = appPath + "/README.md";
                        fs.writeFileSync(readmePath, "# " + appName);
                    }
                    catch (error) {
                        utils_1.log("\n" + cliName + " Error: " + error.message, 'error', quiet);
                        return [2, callback(1)];
                    }
                    if (!install) return [3, 8];
                    spinner.start('Installing dependencies...');
                    process.chdir(appPath);
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4, execa_1.default(packageManager, ['install'], {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 6:
                    install_1 = _c.sent();
                    if (!install_1.status) {
                        spinner.succeed('Successfully installed dependencies!');
                    }
                    else {
                        spinner.fail('Failed to install dependencies.');
                    }
                    status += install_1.status;
                    return [3, 8];
                case 7:
                    error_2 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_2.message, 'error', quiet);
                    spinner.fail('Failed to install dependencies.');
                    return [2, callback(1)];
                case 8: return [2, callback(status)];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQTRIQTs7QUE1SEEsZ0RBQTBCO0FBQzFCLHFDQUF5QjtBQUN6Qix5Q0FBNkI7QUFFN0IsMENBQXVDO0FBQ3ZDLGtDQUE0RTtBQUUvRCxRQUFBLElBQUksR0FBRyxVQUFPLE9BQWUsRUFBRSxXQUFtQixFQUFFLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7b0JBQzlGLEtBQWtGLEdBQUcsUUFBdEUsRUFBZixPQUFPLG1CQUFHLEtBQUssS0FBQSxFQUFFLE9BQU8sR0FBMEQsR0FBRyxRQUE3RCxFQUFrQixpQkFBaUIsR0FBdUIsR0FBRyxlQUExQixFQUFFLEtBQUssR0FBZ0IsR0FBRyxNQUFuQixFQUFFLFVBQVUsR0FBSSxHQUFHLFdBQVAsQ0FBUTtvQkFDdkYsR0FBRyxHQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDOUIsTUFBTSxHQUFXLENBQUMsQ0FBQztvQkFHakIsT0FBTyxHQUFHLHFCQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBR3JDLFdBQUcsQ0FBSSxPQUFPLHNDQUFtQyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDbEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUM5QixPQUFPLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ2pELE9BQU8sR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFLLE9BQVMsQ0FBQyxDQUFDO29CQUNwRCxPQUFPLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsb0RBQW9ELENBQUMsQ0FBQztvQkFHdEcs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