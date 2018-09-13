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
exports.dev = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, config, open, quiet, remove, variables, spinner, _b, outputFullPath, useTypescript, variablesObj, webpackConfig, webpackOptions, nodePath, webpackDevPath, webpack, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, config = cmd.config, open = cmd.open, quiet = cmd.quiet, remove = cmd.remove, variables = cmd.variables;
                    spinner = utils_1.createSpinner(quiet);
                    utils_1.log(cliName + " start development server...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    _b = LexConfig_1.LexConfig.config, outputFullPath = _b.outputFullPath, useTypescript = _b.useTypescript;
                    variablesObj = { NODE_ENV: 'development' };
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
                    if (useTypescript) {
                        LexConfig_1.LexConfig.checkTypescriptConfig();
                    }
                    if (!remove) return [3, 2];
                    spinner.start('Cleaning output directory...');
                    return [4, clean_1.removeFiles(outputFullPath)];
                case 1:
                    _c.sent();
                    spinner.succeed('Successfully cleaned output directory!');
                    _c.label = 2;
                case 2:
                    webpackConfig = config || path.resolve(__dirname, '../../webpack.config.js');
                    webpackOptions = ['--config', webpackConfig];
                    if (open) {
                        webpackOptions.push('--open');
                    }
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    nodePath = path.resolve(__dirname, '../../node_modules');
                    webpackDevPath = utils_1.relativeFilePath('webpack-dev-server/bin/webpack-dev-server.js', nodePath);
                    return [4, execa_1.default(webpackDevPath, webpackOptions, {
                            encoding: 'utf-8',
                            stdio: 'inherit'
                        })];
                case 4:
                    webpack = _c.sent();
                    if (!webpack.status) {
                        spinner.succeed('Development server stopped.');
                    }
                    else {
                        spinner.fail('There was an error while running Webpack.');
                    }
                    return [2, callback(webpack.status)];
                case 5:
                    error_1 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('There was an error while running Webpack.');
                    return [2, callback(1)];
                case 6: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGV2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQTBGQTs7QUExRkEsZ0RBQTBCO0FBQzFCLHlDQUE2QjtBQUU3QiwwQ0FBdUM7QUFDdkMsa0NBQThEO0FBQzlELGlDQUFvQztBQUV2QixRQUFBLEdBQUcsR0FBRyxVQUFPLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7b0JBQ3ZELEtBQTJELEdBQUcsUUFBL0MsRUFBZixPQUFPLG1CQUFHLEtBQUssS0FBQSxFQUFFLE1BQU0sR0FBb0MsR0FBRyxPQUF2QyxFQUFFLElBQUksR0FBOEIsR0FBRyxLQUFqQyxFQUFFLEtBQUssR0FBdUIsR0FBRyxNQUExQixFQUFFLE1BQU0sR0FBZSxHQUFHLE9BQWxCLEVBQUUsU0FBUyxHQUFJLEdBQUcsVUFBUCxDQUFRO29CQUdoRSxPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHckMsV0FBRyxDQUFJLE9BQU8saUNBQThCLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUc3RCxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFckIsS0FBa0MscUJBQVMsQ0FBQyxNQUFNLEVBQWpELGNBQWMsb0JBQUEsRUFBRSxhQUFhLG1CQUFBLENBQXFCO29CQUdyRCxZQUFZLEdBQVcsRUFBQyxRQUFRLEVBQUUsYUFBYSxFQUFDLENBQUM7b0JBRXJELElBQUcsU0FBUyxFQUFFO3dCQUNaLElBQUk7NEJBQ0YsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7eUJBQ3RDO3dCQUFDLE9BQU0sS0FBSyxFQUFFOzRCQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8scUVBQWtFLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUNwRyxXQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQzt5QkFDcEI7cUJBQ0Y7b0JBRUQsT0FBTyxDQUFDLEdBQUcsZ0JBQU8sT0FBTyxDQUFDLEdBQUcsRUFBSyxZQUFZLENBQUMsQ0FBQztvQkFFaEQsSUFBRyxhQUFhLEVBQUU7d0JBRWhCLHFCQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztxQkFDbkM7eUJBR0UsTUFBTSxFQUFOLGNBQU07b0JBRVAsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO29CQUc5QyxXQUFNLG1CQUFXLENBQUMsY0FBYyxDQUFDLEVBQUE7O29CQUFqQyxTQUFpQyxDQUFDO29CQUdsQyxPQUFPLENBQUMsT0FBTyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7OztvQkFJdEQsYUFBYSxHQUFXLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO29CQUdyRixjQUFjLEdBQWEsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBRTdELElBQUcsSUFBSSxFQUFFO3dCQUNQLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQy9COzs7O29CQUlPLFFBQVEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNqRSxjQUFjLEdBQVcsd0JBQWdCLENBQUMsOENBQThDLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFGLFdBQU0sZUFBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUU7NEJBQzFELFFBQVEsRUFBRSxPQUFPOzRCQUNqQixLQUFLLEVBQUUsU0FBUzt5QkFDakIsQ0FBQyxFQUFBOztvQkFISSxPQUFPLEdBQUcsU0FHZDtvQkFHRixJQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTt3QkFDbEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO3FCQUNoRDt5QkFBTTt3QkFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7cUJBQzNEO29CQUVELFdBQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBQzs7O29CQUdoQyxXQUFHLENBQUMsT0FBSyxPQUFPLGdCQUFXLE9BQUssQ0FBQyxPQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUc1RCxPQUFPLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7b0JBRzFELFdBQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDOzs7OztDQUV0QixDQUFDIn0=