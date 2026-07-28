const jestConfig = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  globalSetup: "./tests/globalSetup.ts",
  globalTeardown: "./tests/globalTeardown.ts",
  setupFiles: ["./tests/setupEnv.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
};

export default jestConfig;
