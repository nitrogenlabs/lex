"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var boxen_1 = __importDefault(require("boxen"));
var chalk_1 = __importDefault(require("chalk"));
var find_file_up_1 = __importDefault(require("find-file-up"));
var fs_1 = __importDefault(require("fs"));
var glob_1 = __importDefault(require("glob"));
var ora_1 = __importDefault(require("ora"));
var path_1 = __importDefault(require("path"));
exports.log = function (message, type, quiet) {
    if (type === void 0) { type = 'info'; }
    if (quiet === void 0) { quiet = false; }
    if (!quiet) {
        var color = void 0;
        switch (type) {
            case 'error':
                color = chalk_1.default.red;
                break;
            case 'note':
                color = chalk_1.default.grey;
                break;
            case 'success':
                color = chalk_1.default.greenBright;
                break;
            case 'warn':
                color = chalk_1.default.yellow;
                break;
            default:
                color = chalk_1.default.cyan;
                break;
        }
        console.log(color(message));
    }
};
exports.createSpinner = function (quiet) {
    if (quiet === void 0) { quiet = false; }
    if (quiet) {
        return {
            fail: function () { },
            start: function () { },
            succeed: function () { }
        };
    }
    return ora_1.default({ color: 'yellow' });
};
exports.getPackageJson = function (packagePath) {
    var formatPath = packagePath || process.cwd() + "/package.json";
    var packageData = fs_1.default.readFileSync(formatPath).toString();
    return JSON.parse(packageData);
};
exports.setPackageJson = function (json, packagePath) {
    if (!json) {
        return;
    }
    var formatPath = packagePath || process.cwd() + "/package.json";
    fs_1.default.writeFileSync(formatPath, JSON.stringify(json, null, 2));
};
exports.linkedModules = function (startPath) {
    var workingPath = startPath || process.cwd();
    var modulePath;
    var prefix = '';
    if (workingPath.includes('@')) {
        prefix = "@" + workingPath.split('@').pop();
        modulePath = workingPath;
    }
    else {
        modulePath = path_1.default.join(workingPath, 'node_modules');
    }
    var foundPaths = glob_1.default.sync(modulePath + "/*");
    return foundPaths.reduce(function (list, foundPath) {
        try {
            var stats = fs_1.default.lstatSync(foundPath);
            if (stats.isDirectory()) {
                var deepList = exports.linkedModules(foundPath);
                list.push.apply(list, deepList);
            }
            else if (stats.isSymbolicLink()) {
                list.push({ name: prefix + "/" + path_1.default.basename(foundPath), path: foundPath });
            }
            return list;
        }
        catch (fsError) {
            throw fsError;
        }
    }, []);
};
exports.checkLinkedModules = function () {
    var linked = exports.linkedModules();
    if (linked.length) {
        var msgModule = linked.length > 1 ? 'Modules' : 'Module';
        var linkedMsg = linked.reduce(function (msg, linkedModule) {
            return msg + "\n * " + linkedModule.name;
        }, "Linked " + msgModule + ":");
        exports.log(boxen_1.default(linkedMsg, { borderStyle: 'round', dimBorder: true, padding: 1 }), 'warn');
    }
};
exports.relativeFilePath = function (filename, nodePath, backUp) {
    if (backUp === void 0) { backUp = 0; }
    var nestDepth = 10;
    if (backUp) {
        var filePath = find_file_up_1.default.sync(filename, nodePath, nestDepth);
        var previousPath = Array(backUp).fill(null).map(function () { return '../'; }).join('');
        return path_1.default.resolve(filePath, previousPath);
    }
    return find_file_up_1.default.sync(filename, nodePath, nestDepth);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBMEI7QUFDMUIsZ0RBQTBCO0FBQzFCLDhEQUFzQztBQUN0QywwQ0FBb0I7QUFDcEIsOENBQXdCO0FBQ3hCLDRDQUFzQjtBQUN0Qiw4Q0FBd0I7QUFFWCxRQUFBLEdBQUcsR0FBRyxVQUFDLE9BQWUsRUFBRSxJQUFxQixFQUFFLEtBQWE7SUFBcEMscUJBQUEsRUFBQSxhQUFxQjtJQUFFLHNCQUFBLEVBQUEsYUFBYTtJQUN2RSxJQUFHLENBQUMsS0FBSyxFQUFFO1FBQ1QsSUFBSSxLQUFLLFNBQUEsQ0FBQztRQUVWLFFBQU8sSUFBSSxFQUFFO1lBQ1gsS0FBSyxPQUFPO2dCQUNWLEtBQUssR0FBRyxlQUFLLENBQUMsR0FBRyxDQUFDO2dCQUNsQixNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULEtBQUssR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNuQixNQUFNO1lBQ1IsS0FBSyxTQUFTO2dCQUNaLEtBQUssR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDO2dCQUMxQixNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULEtBQUssR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNyQixNQUFNO1lBQ1I7Z0JBQ0UsS0FBSyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE1BQU07U0FDVDtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDN0I7QUFDSCxDQUFDLENBQUM7QUFFVyxRQUFBLGFBQWEsR0FBRyxVQUFDLEtBQWE7SUFBYixzQkFBQSxFQUFBLGFBQWE7SUFDekMsSUFBRyxLQUFLLEVBQUU7UUFDUixPQUFPO1lBQ0wsSUFBSSxFQUFFLGNBQU8sQ0FBQztZQUNkLEtBQUssRUFBRSxjQUFPLENBQUM7WUFDZixPQUFPLEVBQUUsY0FBTyxD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