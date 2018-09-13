"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var utils_1 = require("./utils");
var nodePath = path_1.default.resolve(__dirname, '../node_modules');
var pluginPath = utils_1.relativeFilePath('@babel/plugin-proposal-function-bind', nodePath, 1);
exports.plugins = [
    pluginPath + "/plugin-proposal-function-bind",
    pluginPath + "/plugin-proposal-export-default-from",
    pluginPath + "/plugin-proposal-logical-assignment-operators",
    [pluginPath + "/plugin-proposal-optional-chaining", { loose: false }],
    [pluginPath + "/plugin-proposal-pipeline-operator", { proposal: 'minimal' }],
    [pluginPath + "/plugin-proposal-nullish-coalescing-operator", { loose: false }],
    pluginPath + "/plugin-proposal-do-expressions",
    [pluginPath + "/plugin-proposal-decorators", { legacy: true }],
    pluginPath + "/plugin-proposal-function-sent",
    pluginPath + "/plugin-proposal-export-namespace-from",
    pluginPath + "/plugin-proposal-numeric-separator",
    pluginPath + "/plugin-proposal-throw-expressions",
    pluginPath + "/plugin-syntax-dynamic-import",
    pluginPath + "/plugin-syntax-import-meta",
    [pluginPath + "/plugin-proposal-class-properties", { loose: false }],
    pluginPath + "/plugin-proposal-json-strings"
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxQbHVnaW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JhYmVsUGx1Z2lucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDhDQUF3QjtBQUV4QixpQ0FBeUM7QUFFekMsSUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUM1RCxJQUFNLFVBQVUsR0FBVyx3QkFBZ0IsQ0FBQyxzQ0FBc0MsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFcEYsUUFBQSxPQUFPLEdBQUc7SUFFbEIsVUFBVSxtQ0FBZ0M7SUFHMUMsVUFBVSx5Q0FBc0M7SUFDaEQsVUFBVSxrREFBK0M7SUFDNUQsQ0FBSSxVQUFVLHVDQUFvQyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDO0lBQ25FLENBQUksVUFBVSx1Q0FBb0MsRUFBRSxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztJQUMxRSxDQUFJLFVBQVUsaURBQThDLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUM7SUFDMUUsVUFBVSxvQ0FBaUM7SUFHOUMsQ0FBSSxVQUFVLGdDQUE2QixFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDO0lBQ3pELFVBQVUsbUNBQWdDO0lBQzFDLFVBQVUsMkNBQXdDO0lBQ2xELFVBQVUsdUNBQW9DO0lBQzlDLFVBQVUsdUNBQW9DO0lBRzlDLFVBQVUsa0NBQStCO0lBQ3pDLFVBQVUsK0JBQTRCO0lBQ3pDLENBQUksVUFBVSxzQ0FBbUMsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUMvRCxVQUFVLGtDQUErQjtDQUM3QyxDQUFDIn0=