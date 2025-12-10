import { beforeAll, describe, expect, test } from "bun:test";
import { $ } from "bun";

const configFiles = [
  ["pedantic.json", "application/json;charset=utf-8"],
  ["recommended.json", "application/json;charset=utf-8"],
  ["stage1.json", "application/json;charset=utf-8"],
] as const;

describe.each(configFiles)("%s", (filename, mimetype) => {
  const file = Bun.file(filename);
  let content: object;

  beforeAll(async () => {
    content = (await import(`../${filename}`, { with: { type: "jsonc" } })) as object;
  });

  test("exists with correct MIME type", () => {
    expect.assertions(3);
    expect(file.exists()).resolves.toBeTruthy();
    expect(file.size).toBeGreaterThan(0);
    expect(file.type).toBe(mimetype);
  });

  test("is an object", () => {
    expect.assertions(3);
    expect(content).toBeObject();
    expect(content).not.toBeNull();
    expect(content).not.toBeArray();
  });

  test("is valid JSON", () => {
    expect.assertions(1);
    // oxlint-disable-next-line prefer-structured-clone
    expect(JSON.parse(JSON.stringify(content))).toEqual(content);
  });

  test("is a valid oxlint configuration", async () => {
    expect.assertions(3);
    const result = await $`oxlint --config="${filename}" --print-config`.nothrow().quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toHaveLength(0);
    expect(result.stdout).not.toHaveLength(0);
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
    const result = await $`oxlint --config=".oxlintrc.json" --print-config`.nothrow().quiet();
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
    "invalid-config3.json",
  ];

  test.each(invalidConfigFixtures)("returns non-zero exit code when for %s", async (fixture) => {
    expect.assertions(2);
    const result = await $`oxlint --config="test/fixtures/${fixture}" --print-config`
      .nothrow()
      .quiet();
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout.toString()).toContain("Failed to parse configuration file.");
  });
});
