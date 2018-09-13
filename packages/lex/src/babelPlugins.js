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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWxQbHVnaW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFiZWxQbHVnaW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsOENBQXdCO0FBRXhCLGlDQUF5QztBQUV6QyxJQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzVELElBQU0sVUFBVSxHQUFXLHdCQUFnQixDQUFDLHNDQUFzQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUVwRixRQUFBLE9BQU8sR0FBRztJQUVsQixVQUFVLG1DQUFnQztJQUcxQyxVQUFVLHlDQUFzQztJQUNoRCxVQUFVLGtEQUErQztJQUM1RCxDQUFJLFVBQVUsdUNBQW9DLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUM7SUFDbkUsQ0FBSSxVQUFVLHVDQUFvQyxFQUFFLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBQyxDQUFDO0lBQzFFLENBQUksVUFBVSxpREFBOEMsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUMxRSxVQUFVLG9DQUFpQztJQUc5QyxDQUFJLFVBQVUsZ0NBQTZCLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFDekQsVUFBVSxtQ0FBZ0M7SUFDMUMsVUFBVSwyQ0FBd0M7SUFDbEQsVUFBVSx1Q0FBb0M7SUFDOUMsVUFBVSx1Q0FBb0M7SUFHOUMsVUFBVSxrQ0FBK0I7SUFDekMsVUFBVSwrQkFBNEI7SUFDekMsQ0FBSSxVQUFVLHNDQUFtQyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDO0lBQy9ELFVBQVUsa0NBQStCO0NBQzdDLENBQUMifQ==