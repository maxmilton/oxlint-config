// HACK: Bundle oxclippy into this package due to oxlint path resolution issues.

console.time("prebuild");
await Bun.$`rm -rf dist`;
await Bun.$`mkdir dist`;
await Bun.$`cp -r ${Bun.resolveSync("oxclippy/presets/pedantic.json", ".")} dist`;
await Bun.$`cp -r ${Bun.resolveSync("oxclippy/presets/recommended.json", ".")} dist`;
console.timeEnd("prebuild");

console.time("build");
await Bun.build({
  entrypoints: [Bun.resolveSync("oxclippy", ".")],
  outdir: "dist",
  target: "bun",
  minify: true,
});
console.timeEnd("build");
