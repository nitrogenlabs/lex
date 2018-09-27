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
var merge_1 = __importDefault(require("lodash/merge"));
var luxon_1 = require("luxon");
var path_1 = __importDefault(require("path"));
var utils_1 = require("../utils");
exports.createChangelog = function (_a) {
    var cliName = _a.cliName, config = _a.config, _b = _a.outputFile, outputFile = _b === void 0 ? 'changelog.tmp.md' : _b, quiet = _a.quiet;
    return __awaiter(_this, void 0, void 0, function () {
        var spinner, gitOptions, git, stdout, entries, gitJSON, commitContent_1, version_1, formatLog, logFile, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    spinner = utils_1.createSpinner(quiet);
                    gitOptions = [
                        'log',
                        '-3',
                        '--pretty=format:{"authorName": "%an", "authorEmail": "%ae", "hashShort": "%h", "hashFull": "%H", "tag": "%D", "date": %ct, "subject": "%s","comments": "%b"}[lex_break]'
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
                        gitJSON = JSON.parse(("[" + entries.join(',') + "]").replace(/"[^"]*(?:""[^"]*)*"/g, function (match) { return match.replace(/\n/g, '[lex_break]'); }));
                        commitContent_1 = {};
                        version_1 = 'Unreleased';
                        gitJSON.forEach(function (item) {
                            var _a;
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
                            if (!commitContent_1[version_1]) {
                                commitContent_1[version_1] = { list: {} };
                            }
                            var subjectLines = comments.split('[lex_break]');
                            var topics = {};
                            for (var idx = 0, len = subjectLines.length; idx < len; idx++) {
                                var nextLine = subjectLines[idx];
                                var formatLine = nextLine.trim();
                                var headerPattern = /^(\w*)(?:\(([\w\$\.\-\* ]*)\))?\: (.*)$/;
                                var matches = formatLine.match(headerPattern);
                                if (matches) {
                                    var itemType = capitalize_1.default(matches[1]);
                                    var itemScope = matches[2];
                                    var itemDetails = matches[3];
                                    var details = {
                                        authorEmail: authorEmail,
                                        authorName: authorName,
                                        details: itemDetails,
                                        hashFull: hashFull,
                                        hashShort: hashShort,
                                        type: itemType
                                    };
                                    if (!topics[itemScope]) {
                                        topics[itemScope] = (_a = {}, _a[itemType] = [details], _a);
                                    }
                                    else {
                                        topics[itemScope][itemType].push(details);
                                    }
                                }
                            }
                            commitContent_1[version_1] = merge_1.default(commitContent_1[version_1], { list: topics });
                        });
                        formatLog = Object.keys(commitContent_1).reduce(function (content, versionKey) {
                            var _a = commitContent_1[versionKey], date = _a.date, _b = _a.list, list = _b === void 0 ? {} : _b, version = _a.version;
                            var formatScopes = Object.keys(list);
                            var updatedContent = content;
                            var versionLabel = version ? version : 'Unreleased';
                            var headerLabels = [versionLabel];
                            if (date) {
                                headerLabels.push("(" + date + ")");
                            }
                            updatedContent += "\n## " + headerLabels.join(' ') + "\n";
                            formatScopes.forEach(function (scopeName) {
                                updatedContent += "\n### " + scopeName + "\n\n";
                                var itemList = list[scopeName];
                                var itemNames = Object.keys(itemList);
                                itemNames.forEach(function (itemName) {
                                    updatedContent += "* " + itemName + "\n";
                                    itemList[itemName].forEach(function (changes) {
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
                            });
                            return updatedContent;
                        }, '# Changes\n');
                        logFile = path_1.default.join(process.cwd(), outputFile);
                        fs_1.default.writeFileSync(logFile, formatLog);
                        spinner.succeed('Git change log complete!');
                    }
                    else {
                        spinner.fail('Failed generating change log!');
                    }
                    return [2, git.status];
                case 3:
                    error_1 = _c.sent();
                    utils_1.log("\n" + cliName + " Error: " + error_1.message, 'error', quiet);
                    spinner.fail('Failed generating change log!');
                    return [2, 1];
                case 4: return [2];
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWF0ZS9jaGFuZ2Vsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBaUtBOztBQWpLQSxnREFBMEI7QUFDMUIsMENBQW9CO0FBQ3BCLGlFQUEyQztBQUMzQywyREFBcUM7QUFDckMsdURBQWlDO0FBQ2pDLCtCQUErQjtBQUMvQiw4Q0FBd0I7QUFFeEIsa0NBQTRDO0FBRS9CLFFBQUEsZUFBZSxHQUFHLFVBQU8sRUFBeUQ7UUFBeEQsb0JBQU8sRUFBRSxrQkFBTSxFQUFFLGtCQUErQixFQUEvQixvREFBK0IsRUFBRSxnQkFBSzs7Ozs7O29CQUV0RixPQUFPLEdBQUcscUJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFHL0IsVUFBVSxHQUFhO3dCQUMzQixLQUFLO3dCQUNMLElBQUk7d0JBQ0oseUtBQXlLO3FCQUMxSyxDQUFDOzs7O29CQUlZLFdBQU0sZUFBSyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7NEJBQ3pDLFFBQVEsRUFBRSxPQUFPO3lCQUNsQixDQUFDLEVBQUE7O29CQUZJLEdBQUcsR0FBRyxTQUVWO29CQUVGLElBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFO3dCQUNQLE1BQU0sR0FBSSxHQUFHLE9BQVAsQ0FBUTt3QkFDZixPQUFPLEdBQWEsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLElBQUssT0FBQSxDQUFDLENBQUMsSUFBSSxFQUFOLENBQU0sQ0FBQyxDQUFDO3dCQUN6RSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FDeEIsQ0FBQyxNQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxVQUFDLEtBQUssSUFBSyxPQUFB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