"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
var packageConfig = require('../../package.json');
exports.parseVersion = function (packageVersion) {
    if (packageVersion === void 0) { packageVersion = ''; }
    return packageVersion.replace(/\^/g, '');
};
exports.packages = {
    babel: exports.parseVersion(packageConfig.dependencies['@babel/core']),
    jest: exports.parseVersion(packageConfig.dependencies.jest),
    lex: packageConfig.version,
    typescript: exports.parseVersion(packageConfig.dependencies.typescript),
    webpack: exports.parseVersion(packageConfig.dependencies.webpack)
};
exports.jsonVersions = function () { return JSON.stringify(Object.keys(exports.packages).reduce(function (list, key) {
    list[key] = exports.packages[key];
    return list;
}, {})); };
exports.versions = function (cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    if (cmd.json) {
        console.log(JSON.stringify(Object.keys(exports.packages).reduce(function (list, key) {
            list[key] = exports.packages[key];
            return list;
        }, {})));
    }
    else {
        utils_1.log('Versions:', 'info', false);
        utils_1.log("  Lex: " + exports.packages.lex, 'info', false);
        utils_1.log('  ----------', 'note', false);
        utils_1.log("  Babel: " + exports.packages.babel, 'info', false);
        utils_1.log("  Jest: " + exports.packages.jest, 'info', false);
        utils_1.log("  Typescript: " + exports.packages.typescript, 'info', false);
        utils_1.log("  Webpack: " + exports.packages.webpack, 'info', false);
    }
    return callback(0);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ZXJzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtDQUE2QjtBQUU3QixJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUV2QyxRQUFBLFlBQVksR0FBRyxVQUFDLGNBQTJCO0lBQTNCLCtCQUFBLEVBQUEsbUJBQTJCO0lBQWEsT0FBQSxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7QUFBakMsQ0FBaUMsQ0FBQztBQUMxRixRQUFBLFFBQVEsR0FBRztJQUN0QixLQUFLLEVBQUUsb0JBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzlELElBQUksRUFBRSxvQkFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ25ELEdBQUcsRUFBRSxhQUFhLENBQUMsT0FBTztJQUMxQixVQUFVLEVBQUUsb0JBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQztJQUMvRCxPQUFPLEVBQUUsb0JBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztDQUMxRCxDQUFDO0FBQ1csUUFBQSxZQUFZLEdBQUcsY0FBTSxPQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsSUFBSSxFQUFFLEdBQUc7SUFDdEYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGdCQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFIMkIsQ0FHM0IsQ0FBQztBQUNLLFFBQUEsUUFBUSxHQUFHLFVBQUMsR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7SUFDN0QsSUFBRyxHQUFHLENBQUMsSUFBSSxFQUFFO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUksRUFBRSxHQUFHO1lBQ2hFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxnQkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNWO1NBQU07UUFDTCxXQUFHLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoQyxXQUFHLENBQUMsWUFBVSxnQkFBUSxDQUFDLEdBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsV0FBRyxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsV0FBRyxDQUFDLGNBQVksZ0JBQVEsQ0FBQyxLQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pELFdBQUcsQ0FBQyxhQUFXLGdCQUFRLENBQUMsSUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxXQUFHLENBQUMsbUJBQWlCLGdCQUFRLENBQUMsVUFBWSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxXQUFHLENBQUMsZ0JBQWMsZ0JBQVEsQ0FBQyxPQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3REO0lBRUQsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDIn0=