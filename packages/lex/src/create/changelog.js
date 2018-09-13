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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhbmdlbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlCQThJQTs7QUE5SUEsZ0RBQTBCO0FBQzFCLDBDQUFvQjtBQUNwQixpRUFBMkM7QUFDM0MsMkRBQXFDO0FBQ3JDLCtCQUErQjtBQUMvQiw4Q0FBd0I7QUFFeEIsa0NBQTRDO0FBRS9CLFFBQUEsZUFBZSxHQUFHLFVBQU8sRUFBeUQ7UUFBeEQsb0JBQU8sRUFBRSxrQkFBTSxFQUFFLGtCQUErQixFQUEvQixvREFBK0IsRUFBRSxnQkFBSzs7Ozs7O29CQUV0RixPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHL0IsVUFBVSxHQUFhO3dCQUMzQixLQUFLO3dCQUNMLElBQUk7d0JBQ0oseUtBQXlLO3FCQUMxSyxDQUFDOzs7O29CQUlZLFdBQU0sZUFBSyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7NEJBQ3pDLFFBQVEsRUFBRSxPQUFPO3lCQUNsQixDQUFDLEVBQUE7O29CQUZJLEdBQUcsR0FBRyxTQUVWO29CQUVGLElBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFO3dCQUNQLE1BQU0sR0FBSSxHQUFHLE9BQVAsQ0FBUTt3QkFDZixPQUFPLEdBQWEsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLElBQUssT0FBQSxDQUFDLENBQUMsSUFBSSxFQUFOLENBQU0sQ0FBQyxDQUFDO3dCQUN6RSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQUcsQ0FBQyxDQUFDO3dCQUMvQyxrQkFBd0IseUNBQXlDLENBQUM7d0JBQ2xFLGtCQUFnQixFQUFFLENBQUM7d0JBQ3JCLFlBQWtCLFlBQVksQ0FBQzt3QkFF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