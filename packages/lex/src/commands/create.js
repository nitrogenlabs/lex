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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var changelog_1 = require("../create/changelog");
var LexConfig_1 = require("../LexConfig");
var utils_1 = require("../utils");
exports.create = function (type, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, cliName, outputFile, quiet, useTypescript, config, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, outputFile = cmd.outputFile, quiet = cmd.quiet;
                    utils_1.log(cliName + " create " + type + "...", 'info', quiet);
                    LexConfig_1.LexConfig.parseConfig(cmd);
                    useTypescript = LexConfig_1.LexConfig.config.useTypescript;
                    if (useTypescript) {
                        LexConfig_1.LexConfig.checkTypescriptConfig();
                    }
                    config = LexConfig_1.LexConfig.config;
                    _b = type;
                    switch (_b) {
                        case 'changelog': return [3, 1];
                    }
                    return [3, 3];
                case 1:
                    _c = callback;
                    return [4, changelog_1.createChangelog({ cliName: cliName, config: config, outputFile: outputFile, quiet: quiet })];
                case 2: return [2, _c.apply(void 0, [_d.sent()])];
                case 3: return [2, callback(0)];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3JlYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQTJCQTs7QUEzQkEsaURBQW9EO0FBQ3BELDBDQUF1QztBQUN2QyxrQ0FBNkI7QUFFaEIsUUFBQSxNQUFNLEdBQUcsVUFBTyxJQUFZLEVBQUUsR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7Ozs7OztvQkFDeEUsS0FBc0MsR0FBRyxRQUExQixFQUFmLE9BQU8sbUJBQUcsS0FBSyxLQUFBLEVBQUUsVUFBVSxHQUFXLEdBQUcsV0FBZCxFQUFFLEtBQUssR0FBSSxHQUFHLE1BQVAsQ0FBUTtvQkFDakQsV0FBRyxDQUFJLE9BQU8sZ0JBQVcsSUFBSSxRQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUduRCxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFcEIsYUFBYSxHQUFJLHFCQUFTLENBQUMsTUFBTSxjQUFwQixDQUFxQjtvQkFFekMsSUFBRyxhQUFhLEVBQUU7d0JBRWhCLHFCQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztxQkFDbkM7b0JBRU0sTUFBTSxHQUFJLHFCQUFTLE9BQWIsQ0FBYztvQkFFcEIsS0FBQSxJQUFJLENBQUE7OzZCQUNKLFdBQVcsQ0FBQyxDQUFaLGNBQVc7Ozs7b0JBQ1AsS0FBQSxRQUFRLENBQUE7b0JBQUMsV0FBTSwyQkFBZSxDQUFDLEVBQUMsT0FBTyxTQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUMsQ0FBQyxFQUFBO3dCQUEzRSxXQUFPLGtCQUFTLFNBQTJELEVBQUMsRUFBQzt3QkFHakYsV0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUM7Ozs7Q0FDcEIsQ0FBQyJ9