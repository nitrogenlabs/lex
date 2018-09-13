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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbGVhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFzRUE7O0FBdEVBLDhDQUF3QjtBQUN4QixrREFBNEI7QUFFNUIsMENBQXVDO0FBQ3ZDLGtDQUE0QztBQUU1QyxJQUFNLEdBQUcsR0FBVyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDckIsUUFBQSxXQUFXLEdBQUcsVUFBQyxRQUFnQixFQUFFLFVBQTJCO0lBQTNCLDJCQUFBLEVBQUEsa0JBQTJCO0lBQUssT0FBQSxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQ3hHLElBQU0sUUFBUSxHQUFXLFVBQVUsQ0FBQyxDQUFDLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUU3RSxnQkFBTSxDQUFDLFFBQVEsRUFBRSxVQUFDLEtBQUs7WUFDckIsSUFBRyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEI7WUFFRCxPQUFPLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBVjRFLENBVTVFLENBQUM7QUFFVSxRQUFBLEtBQUssR0FBRyxVQUFPLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7b0JBQ3pELEtBQXFDLEdBQUcsUUFBekIsRUFBZixPQUFPLG1CQUFHLEtBQUssS0FBQSxFQUFFLEtBQUssR0FBZSxHQUFHLE1BQWxCLEVBQUUsU0FBUyxHQUFJLEdBQUcsVUFBUCxDQUFRO29CQUcxQyxPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHckMsV0FBRyxDQUFJLE9BQU8sMkJBQXdCLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUd2RCxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFHM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOzs7O29CQUlqQyxXQUFNLG1CQUFXLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O29CQUF6QyxTQUF5QyxDQUFDO29CQUcxQyxXQUFNLG1CQUFXLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFBOztvQkFBckMsU0FBcUMsQ0FBQztvQkFHdEMsV0FBTSxtQkFBVyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQXRDLFNBQXNDLENBQUM7b0JBQ3ZDLFdBQU0sbUJBQVcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQTNDLFNBQTJDLENBQUM7b0JBQzVDLFdBQU0sbUJBQVcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQTNDLFNBQTJDLENBQUM7b0JBRzVDLFdBQU0sbUJBQVcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQTlDLFNBQThDLENBQUM7b0JBQy9DLFdBQU0sbUJBQVcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQTFDLFNBQTBDLENBQUM7eUJBRXhDLFNBQVMsRUFBVCxlQUFTO29CQUNWLFdBQU0sbUJBQVcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsRUFBQTs7b0JBQTdDLFNBQTZDLENBQUM7OztvQkFJaEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO29CQUd6QyxXQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQzs7O29CQUduQixXQUFHLENBQUMsT0FBSyxPQUFPLGdCQUFXLE9BQUssQ0FBQyxPQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUc1RCxPQUFPLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7b0JBR3pDLFdBQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDOzs7OztDQUV0QixDQUFDIn0=