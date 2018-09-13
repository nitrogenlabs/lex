"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
var lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
var _a = lexConfig.babelPlugins, plugins = _a === void 0 ? [] : _a, _b = lexConfig.babelPresets, presets = _b === void 0 ? [] : _b;
exports.default = helper_plugin_utils_1.declare(function (api) {
    api.assertVersion(7);
    return { plugins: plugins, presets: presets };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxQcmVzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JhYmVsUHJlc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtFQUFtRDtBQUVuRCxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQ3RELElBQUEsMkJBQTBCLEVBQTFCLGlDQUEwQixFQUFFLDJCQUEwQixFQUExQixpQ0FBMEIsQ0FBYztBQUUzRSxrQkFBZSw2QkFBTyxDQUFDLFVBQUMsR0FBRztJQUN6QixHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLE9BQU8sRUFBQyxPQUFPLFNBQUEsRUFBRSxPQUFPLFNBQUEsRUFBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDIn0=