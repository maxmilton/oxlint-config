import { describe, expect, test } from "bun:test";
import { $ } from "bun";
import type { OxlintConfig } from "oxlint";
import pedanticConfig from "../pedantic.json" with { type: "jsonc" };
import recommendedConfig from "../recommended.json" with { type: "jsonc" };
import stage1Config from "../stage1.json" with { type: "jsonc" };

const configs = [
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  ["recommended.json", recommendedConfig as unknown as OxlintConfig],
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  ["pedantic.json", pedanticConfig as unknown as OxlintConfig],
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  ["stage1.json", stage1Config as unknown as OxlintConfig],
] as const;

describe.each(configs)("%s", (filename, config) => {
  test("exists with correct MIME type", () => {
    expect.assertions(3);
    const file = Bun.file(filename);
    expect(file.exists()).resolves.toBeTruthy();
    expect(file.size).toBeGreaterThan(0);
    expect(file.type).toBe("application/json;charset=utf-8");
  });

  test("is an object", () => {
    expect.assertions(3);
    expect(config).toBeObject();
    expect(config).not.toBeNull();
    expect(config).not.toBeArray();
  });

  test("is valid JSON", () => {
    expect.assertions(1);
    // oxlint-disable-next-line unicorn/prefer-structured-clone
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });

  test("is a valid oxlint configuration", async () => {
    expect.assertions(3);
    const result = await $`oxlint --config="${filename}" --print-config`.nothrow().quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toHaveLength(0);
    expect(result.stdout).not.toHaveLength(0);
  });

  test.if("rules" in config)("rules are alphabetically sorted", () => {
    expect.assertions(2);
    expect(config.rules).toBeObject();
    // oxlint-disable-next-line typescript/no-non-null-assertion
    const keys = Object.keys(config.rules!);
    expect(keys).toEqual(keys.toSorted((keyA, keyB) => keyA.localeCompare(keyB)));
  });

  describe.if("overrides" in config)("overrides", () => {
    test("rules are alphabetically sorted", () => {
      expect.hasAssertions();
      expect(config.overrides).toBeArray();
      // oxlint-disable-next-line typescript/no-non-null-assertion
      for (const override of config.overrides!) {
        // oxlint-disable-next-line vitest/no-conditional-in-test
        if ("rules" in override) {
          expect(override.rules).toBeObject();
          const keys = Object.keys(override.rules);
          expect(keys).toEqual(keys.toSorted((keyA, keyB) => keyA.localeCompare(keyB)));
        }
      }
    });
  });
});

describe("extends composition", () => {
  const extendsFixtures = [
    "extends-recommended-pedantic.json",
    "extends-recommended-stage1.json",
    "extends-all.json",
  ];

  test.each(extendsFixtures)("%s is a valid oxlint configuration", async (fixture) => {
    expect.assertions(2);
    const result = await $`oxlint --config="test/fixtures/${fixture}" --print-config`
      .nothrow()
      .quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toHaveLength(0);
  });
});

describe("oxlint", () => {
  test("returns non-zero exit code when config file is not found", async () => {
    expect.assertions(2);
    const result = await $`oxlint --config="nonexistent.json" --print-config`.nothrow().quiet();
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout.toString()).toContain("No such file or directory");
  });

  test("returns zero exit code when specified config file is found", async () => {
    expect.assertions(2);
    const result = await $`oxlint --config=".oxlintrc.jsonc" --print-config`.nothrow().quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).not.toContain("No such file or directory");
  });

  test("returns zero exit code when default config file is found", async () => {
    expect.assertions(2);
    const result = await $`oxlint --print-config`.nothrow().quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).not.toContain("No such file or directory");
  });

  const invalidConfigFixtures = [
    "invalid-config1.json",
    "invalid-config2.json",
    "invalid-config3.jsonc",
  ];

  test.each(invalidConfigFixtures)("returns non-zero exit code for %s", async (fixture) => {
    expect.assertions(2);
    const result = await $`oxlint --config="test/fixtures/${fixture}" --print-config`
      .nothrow()
      .quiet();
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout.toString()).toContain("Failed to parse oxlint configuration file.");
  });
});
