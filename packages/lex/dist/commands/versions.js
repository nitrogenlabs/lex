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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvdmVyc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxrQ0FBNkI7QUFFN0IsSUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFFdkMsUUFBQSxZQUFZLEdBQUcsVUFBQyxjQUEyQjtJQUEzQiwrQkFBQSxFQUFBLG1CQUEyQjtJQUFhLE9BQUEsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO0FBQWpDLENBQWlDLENBQUM7QUFDMUYsUUFBQSxRQUFRLEdBQUc7SUFDdEIsS0FBSyxFQUFFLG9CQUFZLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM5RCxJQUFJLEVBQUUsb0JBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQztJQUNuRCxHQUFHLEVBQUUsYUFBYSxDQUFDLE9BQU87SUFDMUIsVUFBVSxFQUFFLG9CQUFZLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7SUFDL0QsT0FBTyxFQUFFLG9CQUFZLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUM7Q0FDMUQsQ0FBQztBQUNXLFFBQUEsWUFBWSxHQUFHLGNBQU0sT0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUksRUFBRSxHQUFHO0lBQ3RGLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxnQkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBSDJCLENBRzNCLENBQUM7QUFDSyxRQUFBLFFBQVEsR0FBRyxVQUFDLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJO0lBQzdELElBQUcsR0FBRyxDQUFDLElBQUksRUFBRTtRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLEVBQUUsR0FBRztZQUNoRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsZ0JBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVjtTQUFNO1FBQ0wsV0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEMsV0FBRyxDQUFDLFlBQVUsZ0JBQVEsQ0FBQyxHQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLFdBQUcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLFdBQUcsQ0FBQyxjQUFZLGdCQUFRLENBQUMsS0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRCxXQUFHLENBQUMsYUFBVyxnQkFBUSxDQUFDLElBQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsV0FBRyxDQUFDLG1CQUFpQixnQkFBUSxDQUFDLFVBQVksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0QsV0FBRyxDQUFDLGdCQUFjLGdCQUFRLENBQUMsT0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN0RDtJQUVELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyJ9