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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wdWJsaXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBOEhBOztBQTlIQSxnREFBMEI7QUFDMUIsZ0RBQTBCO0FBQzFCLGtEQUE0QjtBQUU1QiwwQ0FBdUM7QUFDdkMsa0NBQTRFO0FBRS9ELFFBQUEsT0FBTyxHQUFHLFVBQU8sR0FBRyxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7Ozs7OztvQkFDdEQsSUFBSSxHQUE2RyxHQUFHLEtBQWhILEVBQUUsS0FBMkcsR0FBRyxRQUEvRixFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQUUsVUFBVSxHQUFnRixHQUFHLFdBQW5GLEVBQUUsR0FBRyxHQUEyRSxHQUFHLElBQTlFLEVBQWtCLGlCQUFpQixHQUF3QyxHQUFHLGVBQTNDLEVBQVcsYUFBYSxHQUFnQixHQUFHLFFBQW5CLEVBQUUsR0FBRyxHQUFXLEdBQUcsSUFBZCxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFDNUgsV0FBRyxDQUFJLE9BQU8sOEJBQTJCLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUdwRCxPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHckMscUJBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRUosb0JBQW9CLEdBQUkscUJBQVMsQ0FBQyxNQUFNLGVBQXBCLENBQXFCO29CQUMxRCxjQUFjLEdBQVcsaUJBQWlCLElBQUksb0JBQW9CLENBQUM7b0JBQ25FLGNBQWMsR0FBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUU3QyxJQUFHLGFBQWEsRUFBRTt3QkFDaEIsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUs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