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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var find = __importStar(require("find-file-up"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var utils_1 = require("./utils");
var cwd = process.cwd();
var LexConfig = (function () {
    function LexConfig() {
    }
    LexConfig.updateConfig = function (updatedConfig) {
        var outputFullPath = updatedConfig.outputFullPath, outputPath = updatedConfig.outputPath, sourcePath = updatedConfig.sourcePath, sourceFullPath = updatedConfig.sourceFullPath, useTypescript = updatedConfig.useTypescript;
        var cwd = process.cwd();
        if (useTypescript !== undefined) {
            LexConfig.useTypescript = useTypescript;
        }
        if (outputPath !== undefined && outputFullPath === undefined) {
            updatedConfig.outputFullPath = path.resolve(cwd, outputPath);
        }
        if (sourcePath !== undefined && sourceFullPath === undefined) {
            updatedConfig.sourceFullPath = path.resolve(cwd, sourcePath);
        }
        LexConfig.config = __assign({}, LexConfig.config, updatedConfig);
        return LexConfig.config;
    };
    Object.defineProperty(LexConfig, "useTypescript", {
        set: function (value) {
            LexConfig.config.useTypescript = value;
            var sourceFullPath = LexConfig.config.sourceFullPath;
            var entryJS = LexConfig.config.entryJS;
            if (entryJS === 'index.js' && value) {
                var indexPath = path.resolve(cwd, sourceFullPath, 'index.tsx');
                var hasIndexTsx = fs.existsSync(indexPath);
                if (hasIndexTsx) {
                    LexConfig.config.entryJS = 'index.tsx';
                }
                else {
                    LexConfig.config.entryJS = 'index.ts';
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    LexConfig.addConfigParams = function (cmd, params) {
        var nameProperty = '_name';
        var babelPlugins = cmd.babelPlugins, babelPresets = cmd.babelPresets, environment = cmd.environment, outputPath = cmd.outputPath, sourcePath = cmd.sourcePath, typescript = cmd.typescript;
        if (outputPath !== undefined) {
            params.outputPath = outputPath;
            params.outputFullPath = path.resolve(cwd, outputPath);
        }
        if (sourcePath !== undefined) {
            params.sourcePath = sourcePath;
            params.sourceFullPath = path.resolve(cwd, sourcePath);
        }
        if (typescript !== undefined) {
            params.useTypescript = typescript;
        }
        if (babelPlugins !== undefined) {
            var plugins = babelPlugins.split(',');
            params.babelPlugins = plugins.map(function (plugin) { return path.resolve(cwd, './node_modules') + "/" + plugin + "}"; });
        }
        if (babelPresets !== undefined) {
            var presets = babelPresets.split(',');
            params.babelPresets = presets.map(function (preset) { return path.resolve(cwd, './node_modules') + "/" + preset + "}"; });
        }
        if (environment !== undefined) {
            params.targetEnvironment = environment === 'web' ? 'web' : 'node';
        }
        process.env.LEX_CONFIG = JSON.stringify(__assign({}, LexConfig.updateConfig(params), { commandName: cmd[nameProperty], isStatic: cmd.static }), null, 0);
    };
    LexConfig.parseConfig = function (cmd, isRoot) {
        if (isRoot === void 0) { isRoot = true; }
        var _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, lexConfig = cmd.lexConfig, lexConfigName = cmd.lexConfigName, quiet = cmd.quiet, typescript = cmd.typescript;
        var configName = lexConfigName || 'lex.config.js';
        var defaultConfigPath = isRoot ? path.resolve(cwd, "./" + configName) : find.sync(configName, cwd, 5);
        var configPath = lexConfig || defaultConfigPath;
        var configExists = fs.existsSync(configPath);
        if (configExists) {
            utils_1.log("Using " + cliName + " configuration file: " + configPath, 'note', quiet);
            var ext = path.extname(configPath);
            if (ext === '.json') {
                var configContent = fs.readFileSync(configPath, 'utf8');
                if (configContent) {
                    var configJson = void 0;
                    try {
                        configJson = JSON.parse(configContent);
                    }
                    catch (error) {
                        configJson = {};
                    }
                    LexConfig.addConfigParams(cmd, configJson);
                }
                else {
                    utils_1.log("\n" + cliName + " Error: Config file malformed, " + configPath, 'error', quiet);
                }
            }
            else if (ext === '.js') {
                var lexCustomConfig = require(configPath);
                LexConfig.addConfigParams(cmd, lexCustomConfig);
            }
            else {
                utils_1.log("\n" + cliName + " Error: Config file must be a JS or JSON file.", 'error', quiet);
            }
        }
        else {
            LexConfig.useTypescript = !!typescript;
            LexConfig.addConfigParams(cmd, LexConfig.config);
        }
    };
    LexConfig.checkTypescriptConfig = function () {
        var tsconfigPath = path.resolve(cwd, './tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) {
            fs.writeFileSync(tsconfigPath, fs.readFileSync(path.resolve(__dirname, '../tsconfig.json')));
        }
    };
    LexConfig.config = {
        babelPlugins: [],
        babelPresets: [],
        entryHTML: 'index.html',
        entryJS: 'index.js',
        env: null,
        outputFullPath: path.resolve(cwd, './dist'),
        outputHash: false,
        outputPath: './dist',
        packageManager: 'yarn',
        sourceFullPath: path.resolve(cwd, './src'),
        sourcePath: './src',
        targetEnvironment: 'node',
        useTypescript: false
    };
    return LexConfig;
}());
exports.LexConfig = LexConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGV4Q29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0xleENvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFxQztBQUNyQyxxQ0FBeUI7QUFDekIseUNBQTZCO0FBRTdCLGlDQUE0QjtBQUU1QixJQUFNLEdBQUcsR0FBVyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7QUFzQmxDO0lBQUE7SUFnS0EsQ0FBQztJQTlJUSxzQkFBWSxHQUFuQixVQUFvQixhQUE0QjtRQUN2QyxJQUFBLDZDQUFjLEVBQUUscUNBQVUsRUFBRSxxQ0FBVSxFQUFFLDZDQUFjLEVBQUUsMkNBQWEsQ0FBa0I7UUFDOUYsSUFBTSxHQUFHLEdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBR2xDLElBQUcsYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUM5QixTQUFTLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztTQUN6QztRQUdELElBQUcsVUFBVSxLQUFLLFNBQVMsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQzNELGFBQWEsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDOUQ7UUFHRCxJQUFHLFVBQVUsS0FBSyxTQUFTLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUMzRCxhQUFhLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsU0FBUyxDQUFDLE1BQU0sZ0JBQU8sU0FBUyxDQUFDLE1BQU0sRUFBSyxhQUFhLENBQUMsQ0FBQztRQUMzRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVELHNCQUFXLDBCQUFhO2FBQXhCLFVBQXlCLEtBQWM7WUFDckMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFD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