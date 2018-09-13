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
var clean_1 = require("./clean");
exports.build = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, config, mode, _b, quiet, remove, variables, spinner, _c, outputFullPath, useTypescript, variablesObj, webpackConfig, isRelativeConfig, fullConfigPath, webpackMode, nodePath, webpackPath, webpack, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, config = cmd.config, mode = cmd.mode, _b = cmd.quiet, quiet = _b === void 0 ? false : _b, remove = cmd.remove, variables = cmd.variables;
                    spinner = utils_1.createSpinner(quiet);
                    utils_1.log(cliName + " building...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    _c = LexConfig_1.LexConfig.config, outputFullPath = _c.outputFullPath, useTypescript = _c.useTypescript;
                    utils_1.checkLinkedModules();
                    variablesObj = { NODE_ENV: 'production' };
                    if (variables) {
                        try {
                            variablesObj = JSON.parse(variables);
                        }
                        catch (error) {
                            utils_1.log("\n" + cliName + " Error: Environment variables option is not a valid JSON object.", 'error', quiet);
                            return [2, callback(1)];
                        }
                    }
                    process.env = __assign({}, process.env, variablesObj);
                    spinner.start('Building with Webpack...');
                    if (!remove) return [3, 2];
                    return [4, clean_1.removeFiles(outputFullPath)];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    if (useTypescript) {
                        LexConfig_1.LexConfig.checkTypescriptConfig();
                    }
                    if (config) {
                        isRelativeConfig = config.substr(0, 2) === './';
                        fullConfigPath = isRelativeConfig ? path.resolve(process.cwd(), config) : config;
                        webpackConfig = fullConfigPath;
                    }
                    else {
                        webpackConfig = path.resolve(__dirname, '../../webpack.config.js');
                    }
                    webpackMode = mode || 'production';
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    nodePath = path.resolve(__dirname, '../../node_modules');
                    webpackPath = utils_1.relativeFilePath('webpack-cli/bin/cli.js', nodePath);
                    return [4, execa_1.default(webpackPath, ['--config', webpackConfig, '--mode', webpackMode], {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 4:
                    webpack = _d.sent();
                    if (!webpack.status) {
                        spinner.succeed('Build completed successfully!');
                    }
                    else {
                        spinner.fail('Build failed.');
                    }
                    return [2, callback(webpack.status)];
                case 5:
                    error_1 = _d.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Build failed.');
                    return [2, callback(1)];
                case 6: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFnR0E7O0FBaEdBLGdEQUEwQjtBQUMxQix5Q0FBNkI7QUFFN0IsMENBQXVDO0FBQ3ZDLGtDQUFrRjtBQUNsRixpQ0FBb0M7QUFFdkIsUUFBQSxLQUFLLEdBQUcsVUFBTyxHQUFRLEVBQUUsUUFBNEI7SUFBNUIseUJBQUEsRUFBQSxXQUFnQixPQUFPLENBQUMsSUFBSTs7Ozs7O29CQUN6RCxLQUFtRSxHQUFHLFFBQXZELEVBQWYsT0FBTyxtQkFBRyxLQUFLLEtBQUEsRUFBRSxNQUFNLEdBQTRDLEdBQUcsT0FBL0MsRUFBRSxJQUFJLEdBQXNDLEdBQUcsS0FBekMsRUFBRSxLQUFvQyxHQUFHLE1BQTFCLEVBQWIsS0FBSyxtQkFBRyxLQUFLLEtBQUEsRUFBRSxNQUFNLEdBQWUsR0FBRyxPQUFsQixFQUFFLFNBQVMsR0FBSSxHQUFHLFVBQVAsQ0FBUTtvQkFHeEUsT0FBTyxHQUFHLHFCQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBR3JDLFdBQUcsQ0FBSSxPQUFPLGlCQUFjLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUc3QyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFckIsS0FBa0MscUJBQVMsQ0FBQyxNQUFNLEVBQWpELGNBQWMsb0JBQUEsRUFBRSxhQUFhLG1CQUFBLENBQXFCO29CQUd6RCwwQkFBa0IsRUFBRSxDQUFDO29CQUdqQixZQUFZLEdBQVcsRUFBQyxRQUFRLEVBQUUsWUFBWSxFQUFDLENBQUM7b0JBRXBELElBQUcsU0FBUyxFQUFFO3dCQUNaLElBQUk7NEJBQ0YsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7eUJBQ3RDO3dCQUFDLE9BQU0sS0FBSyxFQUFFOzRCQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8scUVBQWtFLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUdwRyxXQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQzt5QkFDcEI7cUJBQ0Y7b0JBRUQsT0FBTyxDQUFDLEdBQUcsZ0JBQU8sT0FBTyxDQUFDLEdBQUcsRUFBSyxZQUFZLENBQUMsQ0FBQztvQkFHaEQsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO3lCQUd2QyxNQUFNLEVBQU4sY0FBTTtvQkFDUCxXQUFNLG1CQUFXLENBQUMsY0FBYyxDQUFDLEVBQUE7O29CQUFqQyxTQUFpQyxDQUFDOzs7b0JBSXBDLElBQUcsYUFBYSxFQUFFO3dCQUVoQixxQkFBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7cUJBQ25DO29CQUtELElBQUcsTUFBTSxFQUFFO3dCQUNILGdCQUFnQixHQUFZLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQzt3QkFDekQsY0FBYyxHQUFXLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO3dCQUMvRixhQUFhLEdBQUcsY0FBYyxDQUFDO3FCQUNoQzt5QkFBTTt3QkFDTCxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUseUJBQXlCLENBQUMsQ0FBQztxQkFDcEU7b0JBRUssV0FBVyxHQUFXLElBQUksSUFBSSxZQUFZLENBQUM7Ozs7b0JBSXpDLFFBQVEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNqRSxXQUFXLEdBQVcsd0JBQWdCLENBQUMsd0JBQXdCLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2pFLFdBQU0sZUFBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxFQUFFOzRCQUMzRixRQUFRLEVBQUUsT0FBTzs0QkFDakIsS0FBSyxFQUFFLFNBQVM7eUJBQ2pCLENBQUMsRUFBQTs7b0JBSEksT0FBTyxHQUFHLFNBR2Q7b0JBR0YsSUFBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7d0JBQ2xCLE9BQU8sQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztxQkFDbEQ7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDL0I7b0JBR0QsV0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFDOzs7b0JBR2hDLFdBQUcsQ0FBQyxPQUFLLE9BQU8sZ0JBQVcsT0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRzVELE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBRzlCLFdBQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDOzs7OztDQUV0QixDQUFDIn0=