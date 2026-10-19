// The site's tests: every `*.test.ts` beside the module it tests, under src/
// and the build's own plugins/, run in node under the site's own Vite
// configuration, so a test imports a module by the same aliases (`@/`,
// `@run-data/`) the site does.
//
// Given CI_GATE_ARTIFACTS (the typescript gate sets it), the run writes the
// JUnit report and the coverage summary into that directory, as ci/README.md
// names them; without it, it writes neither.
import { defineConfig, mergeConfig } from "vitest/config";
import site from "./vite.config.ts";

const artifacts = process.env.CI_GATE_ARTIFACTS;

export default mergeConfig(
  site,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "plugins/**/*.test.ts"],
      ...(artifacts
        ? {
            reporters: ["default", "junit"],
            outputFile: { junit: `${artifacts}/junit.xml` },
            coverage: {
              enabled: true,
              provider: "v8",
              reporter: ["json-summary"],
              reportsDirectory: artifacts,
              include: ["src/**/*.{ts,tsx}", "plugins/**/*.ts"],
              exclude: ["**/*.test.ts"],
            },
          }
        : {}),
    },
  }),
);
