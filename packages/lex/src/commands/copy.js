"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var utils_1 = require("../utils");
exports.copyFileSync = function (source, target) {
    var targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
};
exports.copyFolderRecursiveSync = function (source, target) {
    var files = [];
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                exports.copyFolderRecursiveSync(curSource, targetFolder);
            }
            else {
                exports.copyFileSync(curSource, targetFolder);
            }
        });
    }
};
exports.copy = function (from, to, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    var _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, quiet = cmd.quiet;
    utils_1.log(cliName + " copying \"" + to + "\"...", 'info', quiet);
    if (!fs.existsSync(from)) {
        utils_1.log("\n" + cliName + " Error: Path not found, \"" + from + "\"...", 'error', quiet);
        return callback(1);
    }
    if (fs.lstatSync(from).isDirectory()) {
        try {
            exports.copyFolderRecursiveSync(from, to);
        }
        catch (error) {
            utils_1.log("\n" + cliName + " Error: Cannot copy \"" + from + "\". " + error.message, 'error', quiet);
            return callback(1);
        }
    }
    else {
        try {
            exports.copyFileSync(from, to);
        }
        catch (error) {
            utils_1.log("\n" + cliName + " Error: Cannot copy \"" + from + "\" " + error.message, 'error', quiet);
            return callback(1);
        }
    }
    return callback(0);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvcHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUNBQXlCO0FBQ3pCLHlDQUE2QjtBQUU3QixrQ0FBNkI7QUFFaEIsUUFBQSxZQUFZLEdBQUcsVUFBQyxNQUFjLEVBQUUsTUFBYztJQUN6RCxJQUFJLFVBQVUsR0FBVyxNQUFNLENBQUM7SUFHaEMsSUFBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3hCLElBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNyQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ3ZEO0tBQ0Y7SUFFRCxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQyxDQUFDO0FBRVcsUUFBQSx1QkFBdUIsR0FBRyxVQUFDLE1BQWMsRUFBRSxNQUFjO0lBQ3BFLElBQUksS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUd6QixJQUFNLFlBQVksR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFdEUsSUFBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUU7UUFDL0IsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUM1QjtJQUdELElBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNyQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBWTtZQUN6QixJQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVsRCxJQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ3hDLCtCQUF1QixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUNsRDtpQkFBTTtnQkFDTCxvQkFBWSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDLENBQUM7QUFFVyxRQUFBLElBQUksR0FBRyxVQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7SUFDNUUsSUFBQSxnQkFBZSxFQUFmLG9DQUFlLEVBQUUsaUJBQUssQ0FBUTtJQUdyQyxXQUFHLENBQUksT0FBTyxtQkFBYSxFQUFFLFVBQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEQsSUFBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdkIsV0FBRyxDQUFDLE9BQUssT0FBTyxrQ0FBNEIsSUFBSSxVQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0lBRUQsSUFBRyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQ25DLElBQUk7WUFFRiwrQkFBdUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbkM7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8sOEJBQXdCLElBQUksWUFBTSxLQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtLQUNGO1NBQU07UUFDTCxJQUFJO1lBRUYsb0JBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDeEI7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8sOEJBQXdCLElBQUksV0FBSyxLQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtLQUNGO0lBRUQsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDIn0=