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
var path = __importStar(require("path"));
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.test = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, config, detectOpenHandles, quiet, removeCache, setup, update, watch, spinner, useTypescript, nodePath, jestPath, jestConfigFile, jestSetupFile, jestOptions, cwd, jest_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, config = cmd.config, detectOpenHandles = cmd.detectOpenHandles, quiet = cmd.quiet, removeCache = cmd.removeCache, setup = cmd.setup, update = cmd.update, watch = cmd.watch;
                    utils_1.log(cliName + " testing...", 'info', quiet);
                    spinner = utils_1.createSpinner(quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    useTypescript = LexConfig_1.LexConfig.config.useTypescript;
                    if (useTypescript) {
                        LexConfig_1.LexConfig.checkTypescriptConfig();
                    }
                    nodePath = path.resolve(__dirname, '../../node_modules');
                    jestPath = utils_1.relativeFilePath('jest-cli/bin/jest.js', nodePath);
                    jestConfigFile = config || path.resolve(__dirname, '../../jest.config.lex.js');
                    jestSetupFile = setup || '';
                    jestOptions = ['--config', jestConfigFile];
                    if (removeCache) {
                        jestOptions.push('--no-cache');
                    }
                    if (jestSetupFile !== '') {
                        cwd = process.cwd();
                        jestOptions.push("--setupTestFrameworkScriptFile=" + path.resolve(cwd, jestSetupFile));
                    }
                    if (detectOpenHandles) {
                        jestOptions.push('--detectOpenHandles');
                    }
                    if (update) {
                        jestOptions.push('--updateSnapshot');
                    }
                    if (watch) {
                        jestOptions.push('--watch');
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4, execa_1.default(jestPath, jestOptions, {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 2:
                    jest_1 = _b.sent();
                    if (!jest_1.status) {
                        spinner.succeed('Testing completed!');
                    }
                    else {
                        spinner.fail('Testing failed!');
                    }
                    return [2, callback(jest_1.status)];
                case 3:
                    error_1 = _b.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Testing failed!');
                    return [2, callback(1)];
                case 4: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFpRkE7O0FBakZBLGdEQUEwQjtBQUMxQix5Q0FBNkI7QUFFN0IsMENBQXVDO0FBQ3ZDLGtDQUE4RDtBQUVqRCxRQUFBLElBQUksR0FBRyxVQUFPLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7b0JBQ3hELEtBQXdGLEdBQUcsUUFBNUUsRUFBZixPQUFPLG1CQUFHLEtBQUssS0FBQSxFQUFFLE1BQU0sR0FBaUUsR0FBRyxPQUFwRSxFQUFFLGlCQUFpQixHQUE4QyxHQUFHLGtCQUFqRCxFQUFFLEtBQUssR0FBdUMsR0FBRyxNQUExQyxFQUFFLFdBQVcsR0FBMEIsR0FBRyxZQUE3QixFQUFFLEtBQUssR0FBbUIsR0FBRyxNQUF0QixFQUFFLE1BQU0sR0FBVyxHQUFHLE9BQWQsRUFBRSxLQUFLLEdBQUksR0FBRyxNQUFQLENBQVE7b0JBRW5HLFdBQUcsQ0FBSSxPQUFPLGdCQUFhLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUd0QyxPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHckMscUJBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRXBCLGFBQWEsR0FBSSxxQkFBUyxDQUFDLE1BQU0sY0FBcEIsQ0FBcUI7b0JBRXpDLElBQUcsYUFBYSxFQUFFO3dCQUVoQixxQkFBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7cUJBQ25DO29CQUdLLFFBQVEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNqRSxRQUFRLEdBQVcsd0JBQWdCLENBQUMsc0JBQXNCLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ3RFLGNBQWMsR0FBVyxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztvQkFDdkYsYUFBYSxHQUFXLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3BDLFdBQVcsR0FBYSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFHM0QsSUFBRyxXQUFXLEVBQUU7d0JBQ2QsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDaEM7b0JBRUQsSUFBRyxhQUFhLEtBQUssRUFBRSxFQUFFO3dCQUNqQixHQUFHLEdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNsQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9DQUFrQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUcsQ0FBQyxDQUFDO3FCQUN4RjtvQkFHRCxJQUFHLGlCQUFpQixFQUFFO3dCQUNwQixXQUFXLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQ3pDO29CQUdELElBQUcsTUFBTSxFQUFFO3dCQUNULFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztxQkFDdEM7b0JBRUQsSUFBRyxLQUFLLEVBQUU7d0JBQ1IsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDN0I7Ozs7b0JBSWMsV0FBTSxlQUFLLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRTs0QkFDOUMsUUFBUSxFQUFFLE9BQU87NEJBQ2pCLEtBQUssRUFBRSxTQUFTO3lCQUNqQixDQUFDLEVBQUE7O29CQUhJLFNBQU8sU0FHWDtvQkFFRixJQUFHLENBQUMsTUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDZixPQUFPLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7cUJBQ3ZDO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztxQkFDakM7b0JBR0QsV0FBTyxRQUFRLENBQUMsTUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFDOzs7b0JBRzdCLFdBQUcsQ0FBQyxPQUFLLE9BQU8sZ0JBQVcsT0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRzVELE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFHaEMsV0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUM7Ozs7O0NBRXRCLENBQUMifQ==