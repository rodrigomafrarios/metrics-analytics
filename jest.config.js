const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");
const { defaults: tsjPreset } = require("ts-jest/presets");

module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    ...tsjPreset.transform,
    "^.+\\.tsx?$": "ts-jest"
  },
  // setupFilesAfterEnv: ["./test-utils/setup.ts"],
  globalSetup: "./test-utils/global-setup.ts",
  globalTeardown: "./test-utils/tear-down.ts",
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
    "@testUtils": ["<rootDir>/test-utils"],
    "@core": ["./src/core"],
    "@type": ["./src/type"],
    "@entity": ["./src/entity"],
    "@handler": ["./src/handler"],
    "@error": ["./src/core/error"],
    "@interface": ["./src/interface"]
  },
};
