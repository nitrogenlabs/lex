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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHFDQUF5QjtBQUN6Qix5Q0FBNkI7QUFFN0Isa0NBQTZCO0FBRWhCLFFBQUEsWUFBWSxHQUFHLFVBQUMsTUFBYyxFQUFFLE1BQWM7SUFDekQsSUFBSSxVQUFVLEdBQVcsTUFBTSxDQUFDO0lBR2hDLElBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN4QixJQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDckMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUN2RDtLQUNGO0lBRUQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQztBQUVXLFFBQUEsdUJBQXVCLEdBQUcsVUFBQyxNQUFjLEVBQUUsTUFBYztJQUNwRSxJQUFJLEtBQUssR0FBYSxFQUFFLENBQUM7SUFHekIsSUFBTSxZQUFZLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRXRFLElBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO1FBQy9CLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDNUI7SUFHRCxJQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7UUFDckMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQVk7WUFDekIsSUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbEQsSUFBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUN4QywrQkFBdUIsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDbEQ7aUJBQU07Z0JBQ0wsb0JBQVksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDO0FBRVcsUUFBQSxJQUFJLEdBQUcsVUFBQyxJQUFZLEVBQUUsRUFBVSxFQUFFLEdBQVEsRUFBRSxRQUE0QjtJQUE1Qix5QkFBQSxFQUFBLFdBQWdCLE9BQU8sQ0FBQyxJQUFJO0lBQzVFLElBQUEsZ0JBQWUsRUFBZixvQ0FBZSxFQUFFLGlCQUFLLENBQVE7SUFHckMsV0FBRyxDQUFJLE9BQU8sbUJBQWEsRUFBRSxVQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXBELElBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3ZCLFdBQUcsQ0FBQyxPQUFLLE9BQU8sa0NBQTRCLElBQUksVUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4RSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwQjtJQUVELElBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNuQyxJQUFJO1lBRUYsK0JBQXVCLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTSxLQUFLLEVBQUU7WUFDYixXQUFHLENBQUMsT0FBSyxPQUFPLDhCQUF3QixJQUFJLFlBQU0sS0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkYsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEI7S0FDRjtTQUFNO1FBQ0wsSUFBSTtZQUVGLG9CQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTSxLQUFLLEVBQUU7WUFDYixXQUFHLENBQUMsT0FBSyxPQUFPLDhCQUF3QixJQUFJLFdBQUssS0FBSyxDQUFDLE9BQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEYsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEI7S0FDRjtJQUVELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyJ9