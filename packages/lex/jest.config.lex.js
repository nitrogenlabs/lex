import { createDefaultPreset } from "ts-jest";
import { resolve as pathResolve } from "path";
import { URL } from "url";

import { getNodePath } from "./dist/utils/file.js";

const rootDir = process.cwd();
const { jest, sourceFullPath, targetEnvironment, useTypescript } = JSON.parse(
  process.env.LEX_CONFIG || "{}"
);

const dirName = new URL(".", import.meta.url).pathname;
const nodePath = pathResolve(dirName, "./node_modules");

let testEnvironment = "node";
let testEnvironmentOptions = {};

if (targetEnvironment === "web") {
  testEnvironment = "jsdom";
  testEnvironmentOptions = {
    url: "http://localhost",
  };
}

let moduleFileExtensions = ["js", "json"];
let testRegex = "(/__tests__/.*|\\.(test|spec))\\.(js)?$";
let transformIgnorePatterns = ["[/\\\\]node_modules[/\\\\].+\\.(js)$"];

if (useTypescript) {
  moduleFileExtensions = ["js", "ts", "tsx", "json"];
  testRegex = "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)?$";
  transformIgnorePatterns = ["[/\\\\]node_modules[/\\\\].+\\.(js|ts|tsx)$"];
}

export default {
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist",
    "/lib",
    "__snapshots__",
    ".d.ts",
  ],
  coverageReporters: ["html", "text"],
  moduleDirectories: ["node_modules", nodePath],
  moduleFileExtensions,
  moduleNameMapper: {
    "\\.(css|jpg|png|svg|txt)$": pathResolve(dirName, "./emptyModule"),
  },
  modulePaths: [rootDir, `${rootDir}/node_modules`, nodePath, sourceFullPath],
  resolver: pathResolve(dirName, "./resolver.cjs"),
  rootDir,
  setupFiles: [
    getNodePath("core-js"),
    getNodePath("regenerator-runtime/runtime.js"),
  ],
  testEnvironment,
  testEnvironmentOptions,
  testPathIgnorePatterns: ["/node_modules/", `${nodePath}/`],
  testRegex,
  testRunner: getNodePath("jest-circus/runner.js"),
  transform: {
    ...createDefaultPreset().transform,
    "\\.(gql|graphql)$": "jest-transform-graphql",
  },
  transformIgnorePatterns,
  verbose: true,
  ...jest,
};
