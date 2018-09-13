"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var chalk_1 = __importDefault(require("chalk"));
var execa_1 = __importDefault(require("execa"));
var semver_1 = __importDefault(require("semver"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.publish = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var bump, _a, cliName, newVersion, otp, cmdPackageManager, accessPrivate, tag, quiet, spinner, configPackageManager, packageManager, publishOptions, nextVersion, packagePath, packageJson, packageName, prevVersion, formatBump, validReleases, validPreReleases, packageVersion, npmPublish, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    bump = cmd.bump, _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, newVersion = cmd.newVersion, otp = cmd.otp, cmdPackageManager = cmd.packageManager, accessPrivate = cmd.private, tag = cmd.tag, quiet = cmd.quiet;
                    utils_1.log(cliName + " publishing npm module...", 'info', quiet);
                    spinner = utils_1.createSpinner(quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    configPackageManager = LexConfig_1.LexConfig.config.packageManager;
                    packageManager = cmdPackageManager || configPackageManager;
                    publishOptions = ['publish'];
                    if (accessPrivate) {
                        publishOptions.push('--access', 'restricted');
                    }
                    if (otp) {
                        publishOptions.push('--otp', otp);
                    }
                    if (tag) {
                        publishOptions.push('--tag', tag);
                    }
                    packagePath = process.cwd() + "/package.json";
                    try {
                        packageJson = utils_1.getPackageJson(packagePath);
                        packageName = packageJson.name;
                        prevVersion = packageJson.version;
                    }
                    catch (error) {
                        utils_1.log("\n" + cliName + " Error: The file, " + packagePath + ", was not found or is malformed.\n", 'error', quiet);
                        console.error(chalk_1.default.red(error.message));
                        return [2, callback(1)];
                    }
                    if (newVersion) {
                        nextVersion = newVersion;
                    }
                    else if (bump) {
                        formatBump = bump.toString()
                            .trim()
                            .toLowerCase();
                        if (formatBump && formatBump !== '') {
                            validReleases = ['major', 'minor', 'patch'];
                            validPreReleases = ['alpha', 'beta', 'rc'];
                            packageVersion = semver_1.default.coerce(prevVersion);
                            if (!semver_1.default.valid(packageVersion)) {
                                utils_1.log("\n" + cliName + " Error: Version is invalid in package.json", 'error', quiet);
                                return [2, callback(1)];
                            }
                            if (validReleases.includes(formatBump)) {
                                nextVersion = semver_1.default.inc(packageVersion, formatBump);
                            }
                            else if (validPreReleases.includes(formatBump)) {
                                nextVersion = semver_1.default.inc(packageVersion, 'prerelease', formatBump);
                            }
                            else {
                                utils_1.log("\n" + cliName + " Error: Bump type is invalid. please make sure it is one of the following: " + validReleases.join(', ') + ", " + validPreReleases.join(', '), 'error', quiet);
                                return [2, callback(1)];
                            }
                        }
                        else {
                            utils_1.log("\n" + cliName + " Error: Bump type is missing.", 'error', quiet);
                            return [2, callback(1)];
                        }
                    }
                    if (nextVersion && packageManager === 'yarn') {
                        publishOptions.push('--new-version', nextVersion);
                    }
                    else if (nextVersion && packageJson) {
                        try {
                            utils_1.setPackageJson(__assign({}, packageJson, { version: nextVersion }), packagePath);
                        }
                        catch (error) {
                            utils_1.log("\n" + cliName + " Error: The file, " + packagePath + ", was not found or is malformed. " + error.message, quiet);
                            return [2, callback(1)];
                        }
                    }
                    else {
                        nextVersion = prevVersion;
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4, execa_1.default(packageManager, publishOptions, {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 2:
                    npmPublish = _b.sent();
                    if (!npmPublish.status) {
                        spinner.succeed("Successfully published npm package: " + packageName + "!");
                    }
                    else {
                        spinner.fail('Publishing to npm has failed.');
                    }
                    return [2, callback(npmPublish.status)];
                case 3:
                    error_1 = _b.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Publishing to npm has failed.');
                    return [2, callback(1)];
                case 4: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInB1Ymxpc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkE4SEE7O0FBOUhBLGdEQUEwQjtBQUMxQixnREFBMEI7QUFDMUIsa0RBQTRCO0FBRTVCLDBDQUF1QztBQUN2QyxrQ0FBNEU7QUFFL0QsUUFBQSxPQUFPLEdBQUcsVUFBTyxHQUFHLEVBQUUsUUFBNEI7SUFBNUIseUJBQUEsRUFBQSxXQUFnQixPQUFPLENBQUMsSUFBSTs7Ozs7O29CQUN0RCxJQUFJLEdBQTZHLEdBQUcsS0FBaEgsRUFBRSxLQUEyRyxHQUFHLFFBQS9GLEVBQWYsT0FBTyxtQkFBRyxLQUFLLEtBQUEsRUFBRSxVQUFVLEdBQWdGLEdBQUcsV0FBbkYsRUFBRSxHQUFHLEdBQTJFLEdBQUcsSUFBOUUsRUFBa0IsaUJBQWlCLEdBQXdDLEdBQUcsZUFBM0MsRUFBVyxhQUFhLEdBQWdCLEdBQUcsUUFBbkIsRUFBRSxHQUFHLEdBQVcsR0FBRyxJQUFkLEVBQUUsS0FBSyxHQUFJLEdBQUcsTUFBUCxDQUFRO29CQUM1SCxXQUFHLENBQUksT0FBTyw4QkFBMkIsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBR3BELE9BQU8sR0FBRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUdyQyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFSixvQkFBb0IsR0FBSSxxQkFBUyxDQUFDLE1BQU0sZUFBcEIsQ0FBcUI7b0JBQzFELGNBQWMsR0FBVyxpQkFBaUIsSUFBSSxvQkFBb0IsQ0FBQztvQkFDbkUsY0FBYyxHQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBRTdDLElBQUcsYUFBYSxFQUFFO3dCQUNoQixjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztxQkFD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