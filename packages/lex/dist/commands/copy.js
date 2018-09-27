"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var utils_1 = require("../utils");
exports.copy = function (from, to, cmd, callback) {
    if (callback === void 0) { callback = process.exit; }
    var _a = cmd.cliName, cliName = _a === void 0 ? 'Lex' : _a, quiet = cmd.quiet;
    utils_1.log(cliName + " copying \"" + to + "\"...", 'info', quiet);
    if (!fs_1.default.existsSync(from)) {
        utils_1.log("\n" + cliName + " Error: Path not found, \"" + from + "\"...", 'error', quiet);
        return callback(1);
    }
    if (fs_1.default.lstatSync(from).isDirectory()) {
        try {
            utils_1.copyFolderRecursiveSync(from, to);
        }
        catch (error) {
            utils_1.log("\n" + cliName + " Error: Cannot copy \"" + from + "\". " + error.message, 'error', quiet);
            return callback(1);
        }
    }
    else {
        try {
            utils_1.copyFileSync(from, to);
        }
        catch (error) {
            utils_1.log("\n" + cliName + " Error: Cannot copy \"" + from + "\" " + error.message, 'error', quiet);
            return callback(1);
        }
    }
    return callback(0);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMENBQW9CO0FBRXBCLGtDQUFvRTtBQUV2RCxRQUFBLElBQUksR0FBRyxVQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsR0FBUSxFQUFFLFFBQTRCO0lBQTVCLHlCQUFBLEVBQUEsV0FBZ0IsT0FBTyxDQUFDLElBQUk7SUFDNUUsSUFBQSxnQkFBZSxFQUFmLG9DQUFlLEVBQUUsaUJBQUssQ0FBUTtJQUdyQyxXQUFHLENBQUksT0FBTyxtQkFBYSxFQUFFLFVBQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEQsSUFBRyxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdkIsV0FBRyxDQUFDLE9BQUssT0FBTyxrQ0FBNEIsSUFBSSxVQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0lBRUQsSUFBRyxZQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQ25DLElBQUk7WUFFRiwrQkFBdUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbkM7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8sOEJBQXdCLElBQUksWUFBTSxLQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtLQUNGO1NBQU07UUFDTCxJQUFJO1lBRUYsb0JBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDeEI7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLFdBQUcsQ0FBQyxPQUFLLE9BQU8sOEJBQXdCLElBQUksV0FBSyxLQUFLLENBQUMsT0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtLQUNGO0lBRUQsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDIn0=