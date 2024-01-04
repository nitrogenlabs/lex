/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import type { Config } from "jest";

const config: Config = {
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
  // transformIgnorePatterns: [
  //   "[/\\\\]node_modules[/\\\\].+\\.(js|ts|tsx)$",
  //   pathResolve(
  //     dirName,
  //     "./packages/execa-mock/node_modules[/\\\\].+\\.(js|ts|tsx)$"
  //   ),
  //   pathResolve(
  //     dirName,
  //     "./packages/favicons-webpack-plugin/node_modules[/\\\\].+\\.(js|ts|tsx)$"
  //   ),
  //   pathResolve(dirName, "./packages/lex/node_modules[/\\\\].+\\.(js|ts|tsx)$"),
  //   pathResolve(
  //     dirName,
  //     "./packages/starfire/node_modules[/\\\\].+\\.(js|ts|tsx)$"
  //   ),
  //   pathResolve(
  //     dirName,
  //     "./packages/static-site-webpack-plugin/node_modules[/\\\\].+\\.(js|ts|tsx)$"
  //   ),
  // ],
  coverageDirectory: "<rootDir>/coverage/",
  projects: [
    '<rootDir>/packages/*'
  ],
  verbose: true
};

export default config;
