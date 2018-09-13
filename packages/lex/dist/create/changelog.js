"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var execa_1 = __importDefault(require("execa"));
var fs_1 = __importDefault(require("fs"));
var capitalize_1 = __importDefault(require("lodash/capitalize"));
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var luxon_1 = require("luxon");
var path_1 = __importDefault(require("path"));
var utils_1 = require("../utils");
exports.createChangelog = function (_a) {
    var cliName = _a.cliName, config = _a.config, _b = _a.outputFile, outputFile = _b === void 0 ? 'changelog.tmp.md' : _b, quiet = _a.quiet;
    return __awaiter(_this, void 0, void 0, function () {
        var spinner, gitOptions, git, stdout, entries, gitJSON, headerPattern_1, commitContent_1, version_1, formatLog, logFile, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    spinner = utils_1.createSpinner(quiet);
                    gitOptions = [
                        'log',
                        '-3',
                        '--pretty=format:{"authorName": "%an", "authorEmail": "%ae", "hashShort": "%h", "hashFull": "%h", "tag": "%D", "date": %ct, "subject": "%s","comments": "%b"}[lex_break]'
                    ];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4, execa_1.default('git', gitOptions, {
                            encoding: 'utf-8'
                        })];
                case 2:
                    git = _c.sent();
                    if (!git.status) {
                        stdout = git.stdout;
                        entries = stdout.split('[lex_break]').filter(function (item) { return !!item; });
                        gitJSON = JSON.parse("[" + entries.join(',') + "]");
                        headerPattern_1 = /^(\w*)(?:\(([\w\$\.\-\* ]*)\))?\: (.*)$/;
                        commitContent_1 = {};
                        version_1 = 'Unreleased';
                        gitJSON.forEach(function (item) {
                            var comments = item.comments, authorEmail = item.authorEmail, authorName = item.authorName, date = item.date, hashFull = item.hashFull, hashShort = item.hashShort, tag = item.tag;
                            var formatDate = luxon_1.DateTime.fromMillis(date).toFormat('DDD');
                            if (!isEmpty_1.default(tag)) {
                                var refs = tag.split(', ');
                                var updatedVersion = refs.reduce(function (ref, tagItem) {
                                    var updatedRef = ref;
                                    if (updatedRef === '' && tagItem.includes('tag: v')) {
                                        updatedRef = tagItem.replace('tag: v', '').trim();
                                    }
                                    return updatedRef;
                                }, '');
                                if (!isEmpty_1.default(updatedVersion)) {
                                    version_1 = updatedVersion;
                                    commitContent_1[version_1] = { date: formatDate, version: updatedVersion };
                                }
                            }
                            var subjectLines = comments.split('\n');
                            if (!commitContent_1[version_1]) {
                                commitContent_1[version_1] = {};
                            }
                            commitContent_1[version_1].list = subjectLines.reduce(function (list, nextLine) {
                                var formatLine = nextLine.trim();
                                var matches = formatLine.match(headerPattern_1);
                                if (matches) {
                                    var itemType = capitalize_1.default(matches[1]);
                                    var itemScope = matches[2];
                                    var itemDetails = matches[3];
                                    var details = {
                                        authorEmail: authorEmail,
                                        authorName: authorName,
                                        details: itemType + " " + itemDetails,
                                        hashFull: hashFull,
                                        hashShort: hashShort
                                    };
                                    if (!list[itemScope]) {
                                        list[itemScope] = [];
                                    }
                                    list[itemScope].push(details);
                                }
                                return list;
                            }, {});
                        });
                        formatLog = Object.keys(commitContent_1).reduce(function (content, versionKey) {
                            var _a = commitContent_1[versionKey], date = _a.date, _b = _a.list, list = _b === void 0 ? {} : _b, version = _a.version;
                            var formatScopes = Object.keys(list);
                            var updatedContent = content;
                            updatedContent += "\n## " + version + " (" + date + ")\n";
                            formatScopes.forEach(function (scopeName) {
                                var scopeList = list[scopeName];
                                updatedContent += "\n### " + scopeName + "\n\n";
                                scopeList.forEach(function (changes) {
                                    var authorEmail = changes.authorEmail, authorName = changes.authorName, details = changes.details, hashFull = changes.hashFull, hashShort = changes.hashShort;
                                    var gitUrl = config.gitUrl;
                                    var hash = "#" + hashShort;
                                    if (!isEmpty_1.default(gitUrl)) {
                                        var commitPath = 'commits';
                                        if (gitUrl.includes('github.com')) {
                                            commitPath = 'commit';
                                        }
                                        hash = "[#" + hashShort + "](" + gitUrl + "/" + commitPath + "/" + hashFull + ")";
                                    }
                                    updatedContent += "  * " + details + " ([" + authorName + "](mailto:" + authorEmail + ") in " + hash + ")\n";
                                });
                            });
                            return updatedContent;
                        }, '# Changes\n');
                        logFile = path_1.default.join(process.cwd(), outputFile);
                        fs_1.default.writeFileSync(logFile, formatLog);
                        spinner.succeed('Git change log complete!');
                    }
                    else {
                        spinner.fail('Failed1 generating change.log!');
                    }
                    return [2, git.status];
                case 3:
                    error_1 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Failed2 generating change.log!');
                    return [2, 1];
                case 4: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWF0ZS9jaGFuZ2Vsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBOElBOztBQTlJQSxnREFBMEI7QUFDMUIsMENBQW9CO0FBQ3BCLGlFQUEyQztBQUMzQywyREFBcUM7QUFDckMsK0JBQStCO0FBQy9CLDhDQUF3QjtBQUV4QixrQ0FBNEM7QUFFL0IsUUFBQSxlQUFlLEdBQUcsVUFBTyxFQUF5RDtRQUF4RCxvQkFBTyxFQUFFLGtCQUFNLEVBQUUsa0JBQStCLEVBQS9CLG9EQUErQixFQUFFLGdCQUFLOzs7Ozs7b0JBRXRGLE9BQU8sR0FBRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUcvQixVQUFVLEdBQWE7d0JBQzNCLEtBQUs7d0JBQ0wsSUFBSTt3QkFDSix5S0FBeUs7cUJBQzFLLENBQUM7Ozs7b0JBSVksV0FBTSxlQUFLLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTs0QkFDekMsUUFBUSxFQUFFLE9BQU87eUJBQ2xCLENBQUMsRUFBQTs7b0JBRkksR0FBRyxHQUFHLFNBRVY7b0JBRUYsSUFBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7d0JBQ1AsTUFBTSxHQUFJLEdBQUcsT0FBUCxDQUFRO3dCQUNmLE9BQU8sR0FBYSxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUksSUFBSyxPQUFBLENBQUMsQ0FBQyxJQUFJLEVBQU4sQ0FBTSxDQUFDLENBQUM7d0JBQ3pFLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQUksT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBRyxDQUFDLENBQUM7d0JBQy9DLGtCQUF3Qix5Q0FBeUMsQ0FBQzt3QkFDbEUsa0JBQWdCLEVBQUUsQ0FBQzt3QkFDckIsWUFB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