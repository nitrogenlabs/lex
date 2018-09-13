"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
var lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
var _a = lexConfig.babelPlugins, plugins = _a === void 0 ? [] : _a, _b = lexConfig.babelPresets, presets = _b === void 0 ? [] : _b;
exports.default = helper_plugin_utils_1.declare(function (api) {
    api.assertVersion(7);
    return { plugins: plugins, presets: presets };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxQcmVzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFiZWxQcmVzZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsa0VBQW1EO0FBRW5ELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUM7QUFDdEQsSUFBQSwyQkFBMEIsRUFBMUIsaUNBQTBCLEVBQUUsMkJBQTBCLEVBQTFCLGlDQUEwQixDQUFjO0FBRTNFLGtCQUFlLDZCQUFPLENBQUMsVUFBQyxHQUFHO0lBQ3pCLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckIsT0FBTyxFQUFDLE9BQU8sU0FBQSxFQUFFLE9BQU8sU0FBQSxFQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMifQ==