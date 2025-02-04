/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const { createDefaultPreset } = require("ts-jest");
const base = require("../../jest.config.base");
const pack = require("./package.json");

module.exports = {
  ...base,
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
  displayName: pack.name,
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  rootDir: "./",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/**/*.test.ts*"],
  transform: {
    ...createDefaultPreset().transform,
    "\\.(gql|graphql)$": "jest-transform-graphql",
  },
  transformIgnorePatterns: ["!/node_modules/(?!execa)"],
};
