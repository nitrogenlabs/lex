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
var path_1 = __importDefault(require("path"));
var rimraf_1 = __importDefault(require("rimraf"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
var cwd = process.cwd();
exports.removeFiles = function (fileName, isRelative) {
    if (isRelative === void 0) { isRelative = false; }
    return new Promise(function (resolve, reject) {
        var filePath = isRelative ? path_1.default.resolve(cwd, fileName) : fileName;
        rimraf_1.default(filePath, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};
exports.clean = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, quiet, snapshots, spinner, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, quiet = cmd.quiet, snapshots = cmd.snapshots;
                    spinner = utils_1.createSpinner(quiet);
                    utils_1.log(cliName + " cleaning directory...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    spinner.start('Cleaning files...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 11, , 12]);
                    return [4, exports.removeFiles('./node_modules', true)];
                case 2:
                    _b.sent();
                    return [4, exports.removeFiles('./coverage', true)];
                case 3:
                    _b.sent();
                    return [4, exports.removeFiles('./yarn.lock', true)];
                case 4:
                    _b.sent();
                    return [4, exports.removeFiles('./yarn-error.log', true)];
                case 5:
                    _b.sent();
                    return [4, exports.removeFiles('./yarn-debug.log', true)];
                case 6:
                    _b.sent();
                    return [4, exports.removeFiles('./package-lock.json', true)];
                case 7:
                    _b.sent();
                    return [4, exports.removeFiles('./npm-debug.log', true)];
                case 8:
                    _b.sent();
                    if (!snapshots) return [3, 10];
                    return [4, exports.removeFiles('./**/__snapshots__', true)];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    spinner.succeed('Successfully cleaned!');
                    return [2, callback(0)];
                case 11:
                    error_1 = _b.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Failed to clean project.');
                    return [2, callback(1)];
                case 12: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvY2xlYW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBc0VBOztBQXRFQSw4Q0FBd0I7QUFDeEIsa0RBQTRCO0FBRTVCLDBDQUF1QztBQUN2QyxrQ0FBNEM7QUFFNUMsSUFBTSxHQUFHLEdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLFFBQUEsV0FBVyxHQUFHLFVBQUMsUUFBZ0IsRUFBRSxVQUEyQjtJQUEzQiwyQkFBQSxFQUFBLGtCQUEyQjtJQUFLLE9BQUEsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUN4RyxJQUFNLFFBQVEsR0FBVyxVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFFN0UsZ0JBQU0sQ0FBQyxRQUFRLEVBQUUsVUFBQyxLQUFLO1lBQ3JCLElBQUcsS0FBSyxFQUFFO2dCQUNSLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RCO1lBRUQsT0FBTyxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQVY0RSxDQVU1RSxDQUFDO0FBRVUsUUFBQSxLQUFLLEdBQUcsVUFBTyxHQUFRLEVBQUUsUUFBNEI7SUFBNUIseUJBQUEsRUFBQSxXQUFnQixPQUFPLENBQUMsSUFBSTs7Ozs7O29CQUN6RCxLQUFxQyxHQUFHLFFBQXpCLEVBQWYsT0FBTyxtQkFBRyxLQUFLLEtBQUEsRUFBRSxLQUFLLEdBQWUsR0FBRyxNQUFsQixFQUFFLFNBQVMsR0FBSSxHQUFHLFVBQVAsQ0FBUTtvQkFHMUMsT0FBTyxHQUFHLHFCQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBR3JDLFdBQUcsQ0FBSSxPQUFPLDJCQUF3QixFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFHdkQscUJBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRzNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7OztvQkFJakMsV0FBTSxtQkFBVyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxFQUFBOztvQkFBekMsU0FBeUMsQ0FBQztvQkFHMUMsV0FBTSxtQkFBVyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQXJDLFNBQXFDLENBQUM7b0JBR3RDLFdBQU0sbUJBQVcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUF0QyxTQUFzQyxDQUFDO29CQUN2QyxXQUFNLG1CQUFXLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUEzQyxTQUEyQyxDQUFDO29CQUM1QyxXQUFNLG1CQUFXLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUEzQyxTQUEyQyxDQUFDO29CQUc1QyxXQUFNLG1CQUFXLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUE5QyxTQUE4QyxDQUFDO29CQUMvQyxXQUFNLG1CQUFXLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUExQyxTQUEwQyxDQUFDO3lCQUV4QyxTQUFTLEVBQVQsZUFBUztvQkFDVixXQUFNLG1CQUFXLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUE3QyxTQUE2QyxDQUFDOzs7b0JBSWhELE9BQU8sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztvQkFHekMsV0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUM7OztvQkFHbkIsV0FBRyxDQUFDLE9BQUssT0FBTyxnQkFBVyxPQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFHNUQsT0FBTyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO29CQUd6QyxXQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQzs7Ozs7Q0FFdEIsQ0FBQyJ9