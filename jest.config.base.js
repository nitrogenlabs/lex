/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const { resolve: pathResolve } = require("path");
// const { fileURLToPath } = require("url");

const dirName = __dirname; // fileURLToPath(new URL(".", import.meta.url));

module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "(tests/.*.mock).(jsx?|tsx?)$",
  ],
  coverageReporters: ["html", "text"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 80,
      statements: 80,
    },
  },
  moduleDirectories: ["./node_modules"],
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  modulePaths: ["node_modules"],
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": [
      "ts-jest",
      // `${__dirname}/node_modules/@nlabs/esbuild-jest/dist/index.js`,
      // {
      //   loaders: {
      //     ".js": "js",
      //     ".ts": "ts",
      //     ".test.ts": "ts",
      //     ".tsx": "tsx",
      //     ".test.tsx": "tsx",
      //   },
      //   presets: ["react", "react-native", "typescript"],
      //   sourcemap: true,
      // },
    ],
    "\\.(gql|graphql)$": "jest-transform-graphql",
  },
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\].+\\.(js|ts|tsx)$",
    pathResolve(
      dirName,
      "./packages/execa-mock/node_modules[/\\\\].+\\.(js|ts|tsx)$"
    ),
    pathResolve(
      dirName,
      "./packages/favicons-webpack-plugin/node_modules[/\\\\].+\\.(js|ts|tsx)$"
    ),
    pathResolve(dirName, "./packages/lex/node_modules[/\\\\].+\\.(js|ts|tsx)$"),
    pathResolve(
      dirName,
      "./packages/starfire/node_modules[/\\\\].+\\.(js|ts|tsx)$"
    ),
    pathResolve(
      dirName,
      "./packages/static-site-webpack-plugin/node_modules[/\\\\].+\\.(js|ts|tsx)$"
    ),
  ],
  verbose: true,
};
