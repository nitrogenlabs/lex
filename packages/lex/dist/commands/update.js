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
var execa_1 = __importDefault(require("execa"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.update = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, cmdPackageManager, quiet, spinner, configPackageManager, packageManager, upgradeOptions, pm, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, cmdPackageManager = cmd.packageManager, quiet = cmd.quiet;
                    utils_1.log(cliName + " updating packages...", 'info', quiet);
                    spinner = utils_1.createSpinner(quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    configPackageManager = LexConfig_1.LexConfig.config.packageManager;
                    packageManager = cmdPackageManager || configPackageManager;
                    upgradeOptions = packageManager === 'npm' ?
                        ['update'] :
                        [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4, execa_1.default(packageManager, upgradeOptions, {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 2:
                    pm = _b.sent();
                    if (!pm.status) {
                        spinner.succeed('Successfully updated packages!');
                    }
                    else {
                        spinner.fail('Failed to updated packages.');
                    }
                    return [2, callback(pm.status)];
                case 3:
                    error_1 = _b.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Failed to updated packages.');
                    return [2, callback(1)];
                case 4: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3VwZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFrREE7O0FBbERBLGdEQUEwQjtBQUUxQiwwQ0FBdUM7QUFDdkMsa0NBQTRDO0FBRS9CLFFBQUEsTUFBTSxHQUFHLFVBQU8sR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7Ozs7OztvQkFDMUQsS0FBNkQsR0FBRyxRQUFqRCxFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQWtCLGlCQUFpQixHQUFXLEdBQUcsZUFBZCxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFHeEUsV0FBRyxDQUFJLE9BQU8sMEJBQXVCLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUdoRCxPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHckMscUJBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRUosb0JBQW9CLEdBQUkscUJBQVMsQ0FBQyxNQUFNLGVBQXBCLENBQXFCO29CQUMxRCxjQUFjLEdBQVcsaUJBQWlCLElBQUksb0JBQW9CLENBQUM7b0JBRW5FLGNBQWMsR0FBYSxjQUFjLEtBQUssS0FBSyxDQUFDLENBQUM7d0JBQ3pELENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzt3QkFDWixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Ozs7b0JBR3ZELFdBQU0sZUFBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUU7NEJBQ3JELFFBQVEsRUFBRSxPQUFPOzRCQUNqQixLQUFLLEVBQUUsU0FBUzt5QkFDakIsQ0FBQyxFQUFBOztvQkFISSxFQUFFLEdBQUcsU0FHVDtvQkFHRixJQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTt3QkFDYixPQUFPLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7cUJBQ25EO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztxQkFDN0M7b0JBR0QsV0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFDOzs7b0JBRzNCLFdBQUcsQ0FBQyxPQUFLLE9BQU8sZ0JBQVcsT0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRzVELE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztvQkFHNUMsV0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUM7Ozs7O0NBRXRCLENBQUMifQ==