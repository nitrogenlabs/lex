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
        }, "Linked " + msgModule + " Warning:");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUEwQjtBQUMxQixnREFBMEI7QUFDMUIsOERBQXNDO0FBQ3RDLDBDQUFvQjtBQUNwQiw4Q0FBd0I7QUFDeEIsNENBQXNCO0FBQ3RCLDhDQUF3QjtBQUVYLFFBQUEsR0FBRyxHQUFHLFVBQUMsT0FBZSxFQUFFLElBQXFCLEVBQUUsS0FBYTtJQUFwQyxxQkFBQSxFQUFBLGFBQXFCO0lBQUUsc0JBQUEsRUFBQSxhQUFhO0lBQ3ZFLElBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDVCxJQUFJLEtBQUssU0FBQSxDQUFDO1FBRVYsUUFBTyxJQUFJLEVBQUU7WUFDWCxLQUFLLE9BQU87Z0JBQ1YsS0FBSyxHQUFHLGVBQUssQ0FBQyxHQUFHLENBQUM7Z0JBQ2xCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE1BQU07WUFDUixLQUFLLFNBQVM7Z0JBQ1osS0FBSyxHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUM7Z0JBQzFCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQ3JCLE1BQU07WUFDUjtnQkFDRSxLQUFLLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQztnQkFDbkIsTUFBTTtTQUNUO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUMsQ0FBQztBQUVXLFFBQUEsYUFBYSxHQUFHLFVBQUMsS0FBYTtJQUFiLHNCQUFBLEVBQUEsYUFBYTtJQUN6QyxJQUFHLEtBQUssRUFBRTtRQUNSLE9BQU87WUFDTCxJQUFJLEVBQUUsY0FBTyxDQUFDO1lBQ2QsS0FBSyxFQUFFLGNBQU8sQ0FBQztZQUNmLE9BQU8sRUFBRSxjQUFPLENBQUM7U0FD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