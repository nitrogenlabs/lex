"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
var plugin_transform_runtime_1 = __importDefault(require("@babel/plugin-transform-runtime"));
var preset_env_1 = __importDefault(require("@babel/preset-env"));
var preset_react_1 = __importDefault(require("@babel/preset-react"));
var preset_typescript_1 = __importDefault(require("@babel/preset-typescript"));
var babelPlugins_1 = require("./babelPlugins");
var lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
var targetEnvironment = lexConfig.targetEnvironment;
var babelWebEnv = [preset_env_1.default, { modules: false, targets: { browsers: ['last 5 versions', 'ie >= 10'] } }];
var babelNodeEnv = [preset_env_1.default];
exports.default = helper_plugin_utils_1.declare(function (api) {
    api.assertVersion(7);
    return {
        plugins: babelPlugins_1.plugins.concat([
            [plugin_transform_runtime_1.default, {
                    helpers: false,
                    regenerator: true
                }]
        ]),
        presets: [
            targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
            preset_react_1.default,
            preset_typescript_1.default
        ]
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxUeXBlc2NyaXB0UHJlc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFiZWxUeXBlc2NyaXB0UHJlc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0VBQW1EO0FBQ25ELDZGQUE4RDtBQUM5RCxpRUFBMEM7QUFDMUMscUVBQThDO0FBQzlDLCtFQUF3RDtBQUV4RCwrQ0FBdUM7QUFFdkMsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUN0RCxJQUFBLCtDQUFpQixDQUFjO0FBQ3RDLElBQU0sV0FBVyxHQUFHLENBQUMsb0JBQVMsRUFBRSxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUMsUUFBUSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLEVBQUMsRUFBQyxDQUFDLENBQUM7QUFDeEcsSUFBTSxZQUFZLEdBQUcsQ0FBQyxvQkFBUyxDQUFDLENBQUM7QUFFakMsa0JBQWUsNkJBQU8sQ0FBQyxVQUFDLEdBQUc7SUFDekIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVyQixPQUFPO1FBQ0wsT0FBTyxFQUNGLHNCQUFPO1lBQ1YsQ0FBQyxrQ0FBZSxFQUFFO29CQUNoQixPQUFPLEVBQUUsS0FBSztvQkFDZCxXQUFXLEVBQUUsSUFBSTtpQkFDbEIsQ0FBQztVQUNIO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsaUJBQWlCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVk7WUFDeEQsc0JBQVc7WUFDWCwyQkFBZ0I7U0FDakI7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMifQ==