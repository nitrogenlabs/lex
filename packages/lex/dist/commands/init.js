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
                    console.log('error', error_1);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkE2SEE7O0FBN0hBLGdEQUEwQjtBQUMxQixxQ0FBeUI7QUFDekIseUNBQTZCO0FBRTdCLDBDQUF1QztBQUN2QyxrQ0FBNEU7QUFFL0QsUUFBQSxJQUFJLEdBQUcsVUFBTyxPQUFlLEVBQUUsV0FBbUIsRUFBRSxHQUFRLEVBQUUsUUFBNEI7SUFBNUIseUJBQUEsRUFBQSxXQUFnQixPQUFPLENBQUMsSUFBSTs7Ozs7O29CQUM5RixLQUFrRixHQUFHLFFBQXRFLEVBQWYsT0FBTyxtQkFBRyxLQUFLLEtBQUEsRUFBRSxPQUFPLEdBQTBELEdBQUcsUUFBN0QsRUFBa0IsaUJBQWlCLEdBQXVCLEdBQUcsZUFBMUIsRUFBRSxLQUFLLEdBQWdCLEdBQUcsTUFBbkIsRUFBRSxVQUFVLEdBQUksR0FBRyxXQUFQLENBQVE7b0JBQ3ZGLEdBQUcsR0FBVyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sR0FBVyxDQUFDLENBQUM7b0JBR2pCLE9BQU8sR0FBRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUdyQyxXQUFHLENBQUksT0FBTyxzQ0FBbUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2xFLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDOUIsT0FBTyxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNqRCxPQUFPLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBSyxPQUFTLENBQUMsQ0FBQztvQkFDcEQsT0FBTyxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG9EQUFv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