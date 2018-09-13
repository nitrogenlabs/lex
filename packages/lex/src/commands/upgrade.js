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
var compare_versions_1 = __importDefault(require("compare-versions"));
var execa_1 = __importDefault(require("execa"));
var latest_version_1 = __importDefault(require("latest-version"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
var versions_1 = require("./versions");
var packageConfig = require('../../package.json');
exports.upgrade = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    var _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, _b = cmd.cliPackage, cliPackage = _b === void 0 ? '@nlabs/lex' : _b, quiet = cmd.quiet;
    utils_1.log("Upgrading " + cliName + "...", 'info', quiet);
    var spinner = utils_1.createSpinner(quiet);
    LexConfig_1.LexConfig.parseConfig(cmd);
    return latest_version_1.default('@nlabs/lex')
        .then(function (latest) { return __awaiter(_this, void 0, void 0, function () {
        var current, versionDiff, packageManager, upgradeOptions, yarn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    current = versions_1.parseVersion(packageConfig.version);
                    versionDiff = compare_versions_1.default(latest, current);
                    if (versionDiff === 0) {
                        utils_1.log("\nCurrently up-to-date. Version " + latest + " is the latest.", 'note', quiet);
                        return [2, callback(0)];
                    }
                    utils_1.log("\nCurrently out of date. Upgrading from version " + current + " to " + latest + "...", 'note', quiet);
                    packageManager = 'npm';
                    upgradeOptions = packageManager === 'npm' ?
                        ['install', '-g', cliPackage + "@latest"] :
                        ['global', 'add', cliPackage + "@latest"];
                    return [4, execa_1.default(packageManager, upgradeOptions, {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 1:
                    yarn = _a.sent();
                    if (!yarn.status) {
                        spinner.succeed("Successfully updated " + cliName + "!");
                    }
                    else {
                        spinner.fail('Failed to updated packages.');
                    }
                    return [2, callback(yarn.status)];
            }
        });
    }); })
        .catch(function (error) {
        utils_1.log("\n" + cliName + " Error: " + error.message, 'error', quiet);
        spinner.fail('Failed to updated packages.');
        return callback(1);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBncmFkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVwZ3JhZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBb0VBOztBQXBFQSxzRUFBK0M7QUFDL0MsZ0RBQTBCO0FBQzFCLGtFQUEyQztBQUUzQywwQ0FBdUM7QUFDdkMsa0NBQTRDO0FBQzVDLHVDQUF3QztBQUV4QyxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUV2QyxRQUFBLE9BQU8sR0FBRyxVQUFDLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJO0lBQ3JELElBQUEsZ0JBQWUsRUFBZixvQ0FBZSxFQUFFLG1CQUF5QixFQUF6Qiw4Q0FBeUIsRUFBRSxpQkFBSyxDQUFRO0lBR2hFLFdBQUcsQ0FBQyxlQUFhLE9BQU8sUUFBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUc5QyxJQUFNLE9BQU8sR0FBRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBR3JDLHFCQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTNCLE9BQU8sd0JBQWEsQ0FBQyxZQUFZLENBQUM7U0FDL0IsSUFBSSxDQUFDLFVBQU8sTUFBYzs7Ozs7b0JBQ25CLE9BQU8sR0FBVyx1QkFBWSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDdEQsV0FBVyxHQUFXLDBCQUFlLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUU3RCxJQUFHLFdBQVcsS0FBSyxDQUFDLEVBQUU7d0JBQ3BCLFdBQUcsQ0FBQyxxQ0FBbUMsTUFBTSxvQkFBaUIsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQy9FLFdBQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDO3FCQUNwQjtvQkFFRCxXQUFHLENBQUMscURBQW1ELE9BQU8sWUFBTyxNQUFNLFFBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBSTNGLGNBQWMsR0FBVyxLQUFLLENBQUM7b0JBRS9CLGNBQWMsR0FBYSxjQUFjLEtBQUssS0FBSyxDQUFDLENBQUM7d0JBQ3pELENBQUMsU0FBUyxFQUFFLElBQUksRUFBSyxVQUFVLFlBQVMsQ0FBQyxDQUFDLENBQUM7d0JBQzNDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBSyxVQUFVLFlBQVMsQ0FBQyxDQUFDO29CQUUvQixXQUFNLGVBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFOzRCQUN2RCxRQUFRLEVBQUUsT0FBTzs0QkFDakIsS0FBSyxFQUFFLFNBQVM7eUJBQ2pCLENBQUMsRUFBQTs7b0JBSEksSUFBSSxHQUFHLFNBR1g7b0JBR0YsSUFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ2YsT0FBTyxDQUFDLE9BQU8sQ0FBQywwQkFBd0IsT0FBTyxNQUFHLENBQUMsQ0FBQztxQkFDckQ7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO3FCQUM3QztvQkFHRCxXQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUM7OztTQUM5QixDQUFDO1NBQ0QsS0FBSyxDQUFDLFVBQUMsS0FBSztRQUVYLFdBQUcsQ0FBQyxPQUFLLE9BQU8sZ0JBQVcsS0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHNUQsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBRzVDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDIn0=