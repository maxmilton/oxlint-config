import { describe, expect, test } from "bun:test";

describe("dist files", () => {
  const distFiles: [filename: string, type: string][] = [
    ["oxclippy.js", "text/javascript;charset=utf-8"],
    ["pedantic.json", "application/json;charset=utf-8"],
    ["recommended.json", "application/json;charset=utf-8"],
  ];

  describe.each(distFiles)("%s", (filename, type) => {
    const file = Bun.file(`dist/${filename}`);

    test("exists with correct MIME type", () => {
      expect.assertions(3);
      expect(file.exists()).resolves.toBeTrue();
      expect(file.size).toBeGreaterThan(0);
      expect(file.type).toBe(type);
    });
  });

  test("contains no unexpected files", () => {
    expect.assertions(1);
    const expectedFiles = new Set(distFiles.map(([filename]) => filename));
    const actualFiles = new Set(new Bun.Glob("**").scanSync({ cwd: "dist" }));
    expect(actualFiles.difference(expectedFiles)).toBeEmpty();
  });
});
