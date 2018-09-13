"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
var plugin_transform_runtime_1 = __importDefault(require("@babel/plugin-transform-runtime"));
var preset_env_1 = __importDefault(require("@babel/preset-env"));
var preset_flow_1 = __importDefault(require("@babel/preset-flow"));
var preset_react_1 = __importDefault(require("@babel/preset-react"));
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
            preset_flow_1.default
        ]
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxGbG93UHJlc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JhYmVsRmxvd1ByZXNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtFQUFtRDtBQUNuRCw2RkFBOEQ7QUFDOUQsaUVBQTBDO0FBQzFDLG1FQUE0QztBQUM1QyxxRUFBOEM7QUFFOUMsK0NBQXVDO0FBRXZDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUM7QUFDdEQsSUFBQSwrQ0FBaUIsQ0FBYztBQUN0QyxJQUFNLFdBQVcsR0FBRyxDQUFDLG9CQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFDLFFBQVEsRUFBRSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxFQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ3hHLElBQU0sWUFBWSxHQUFHLENBQUMsb0JBQVMsQ0FBQyxDQUFDO0FBRWpDLGtCQUFlLDZCQUFPLENBQUMsVUFBQyxHQUFHO0lBQ3pCLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFckIsT0FBTztRQUNMLE9BQU8sRUFDRixzQkFBTztZQUNWLENBQUMsa0NBQWUsRUFBRTtvQkFDaEIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsV0FBVyxFQUFFLElBQUk7aUJBQ2xCLENBQUM7VUFDSDtRQUNELE9BQU8sRUFBRTtZQUNQLGlCQUFpQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxZQUFZO1lBQ3hELHNCQUFXO1lBQ1gscUJBQVU7U0FDWDtLQUNGLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyJ9