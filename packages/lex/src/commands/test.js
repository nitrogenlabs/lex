'use strict';
let __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(((resolve, reject) => {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    }));
};
let __generator = (this && this.__generator) || function(thisArg, body) {
  let _ = {label: 0, sent() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: []}; var f; var y; var t; var g;
  return g = {next: verb(0), throw: verb(1), return: verb(2)}, typeof Symbol === 'function' && (g[Symbol.iterator] = function() {
 return this; 
}), g;
  function verb(n) {
 return function(v) {
 return step([n, v]); 
}; 
}
  function step(op) {
    if(f) {throw new TypeError("Generator is already executing.");}
    while(_) {try {
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
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }}
    if(op[0] & 5) {throw op[1];} return {value: op[0] ? op[1] : void 0, done: true};
  }
};
let __importDefault = (this && this.__importDefault) || function(mod) {
  return (mod && mod.__esModule) ? mod : {'default': mod};
};
let __importStar = (this && this.__importStar) || function(mod) {
  if(mod && mod.__esModule) {return mod;}
  let result = {};
  if(mod != null) {for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];}
  result.default = mod;
  return result;
};
let _this = this;
Object.defineProperty(exports, '__esModule', {value: true});
let execa_1 = __importDefault(require('execa'));
let path = __importStar(require('path'));

let LexConfig_1 = require('../LexConfig');
let utils_1 = require('../utils');

exports.test = function(cmd, callback) {
  if(callback === void 0) {
 callback = process.exit; 
}
  return __awaiter(_this, void 0, void 0, function() {
    let _a; var cliName; var config; var detectOpenHandles; var quiet; var removeCache; var setup; var update; var watch; var spinner; var useTypescript; var nodePath; var jestPath; var jestConfigFile; var jestSetupFile; var jestOptions; var cwd; var jest_1; var error_1;
    return __generator(this, (_b) => {
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
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQWlGQTs7QUFqRkEsZ0RBQTBCO0FBQzFCLHlDQUE2QjtBQUU3QiwwQ0FBdUM7QUFDdkMsa0NBQThEO0FBRWpELFFBQUEsSUFBSSxHQUFHLFVBQU8sR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7Ozs7OztvQkFDeEQsS0FBd0YsR0FBRyxRQUE1RSxFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQUUsTUFBTSxHQUFpRSxHQUFHLE9BQXBFLEVBQUUsaUJBQWlCLEdBQThDLEdBQUcsa0JBQWpELEVBQUUsS0FBSyxHQUF1QyxHQUFHLE1BQTFDLEVBQUUsV0FBVyxHQUEwQixHQUFHLFlBQTdCLEVBQUUsS0FBSyxHQUFtQixHQUFHLE1BQXRCLEVBQUUsTUFBTSxHQUFXLEdBQUcsT0FBZCxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFFbkcsV0FBRyxDQUFJLE9BQU8sZ0JBQWEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBR3RDLE9BQU8sR0FBRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUdyQyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFcEIsYUFBYSxHQUFJLHFCQUFTLENBQUMsTUFBTSxjQUFwQixDQUFxQjtvQkFFekMsSUFBRyxhQUFhLEVBQUU7d0JBRWhCLHFCQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztxQkFDbkM7b0JBR0ssUUFBUSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7b0JBQ2pFLFFBQVEsR0FBVyx3QkFBZ0IsQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDdEUsY0FBYyxHQUFXLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO29CQUNuRixhQUFhLEdBQVcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDcEMsV0FBVyxHQUFhLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUczRCxJQUFHLFdBQVcsRUFBRTt3QkFDZCxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNoQztvQkFFRCxJQUFHLGFBQWEsS0FBSyxFQUFFLEVBQUU7d0JBQ2pCLEdBQUcsR0FBVyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQ2xDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0NBQWtDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBRyxDQUFDLENBQUM7cUJBQ3hGO29CQUdELElBQUcsaUJBQWlCLEVBQUU7d0JBQ3BCLFdBQVcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDekM7b0JBR0QsSUFBRyxNQUFNLEVBQUU7d0JBQ1QsV0FBVyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3FCQUN0QztvQkFFRCxJQUFHLEtBQUssRUFBRTt3QkFDUixXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUM3Qjs7OztvQkFJYyxXQUFNLGVBQUssQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFOzRCQUM5QyxRQUFRLEVBQUUsT0FBTzs0QkFDakIsS0FBSyxFQUFFLFNBQVM7eUJBQ2pCLENBQUMsRUFBQTs7b0JBSEksU0FBTyxTQUdYO29CQUVGLElBQUcsQ0FBQyxNQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNmLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztxQkFDdkM7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3FCQUNqQztvQkFHRCxXQUFPLFFBQVEsQ0FBQyxNQUFJLENBQUMsTUFBTSxDQUFDLEVBQUM7OztvQkFHN0IsV0FBRyxDQUFDLE9BQUssT0FBTyxnQkFBVyxPQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFHNUQsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO29CQUdoQyxXQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQzs7Ozs7Q0FFdEIsQ0FBQyJ9
