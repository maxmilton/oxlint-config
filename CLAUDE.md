# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this repo is

`@maxmilton/oxlint-config` publishes shareable [oxlint](https://oxc.rs/docs/guide/usage/linter.html)
config presets targeting Bun ecosystem. Package has no runtime code —
product is JSON config files; "tests" verify those JSON files valid,
loadable oxlint configs.

## Commands

```sh
bun install                # install deps (peer dep: oxlint)
bun run lint               # biome check + oxlint + eslint + tsc --noEmit (all must pass)
bun run lint:fmt           # biome check only
bun run lint:js            # oxlint only
bun run lint:js2           # eslint only (rules oxlint doesn't cover yet)
bun run lint:ts            # tsc --noEmit only
bun test                   # run tests (--only-failures)
bun test:ci                # coverage + randomized + rerun-each=3 (what CI runs)
bun test test/index.test.ts -t "is valid JSON"   # run a single test/pattern
```

No build step — `main` in package.json points straight at `recommended.json`.

## Architecture

Three presets published (see `files` in package.json); nothing else ships to npm:

- **`recommended.json`** — base ruleset. Package `main`. Sets `plugins`, tunes individual rules, `overrides` for
  `*.cjs`, `*.ts`, `*.d.ts`, `*.config.{ts,mjs,js}`, test files (`*.test.ts`, `*.spec.ts`,
  `test/**`), and `build.ts`.
- **`pedantic.json`** — small set of stricter, opt-in rules (e.g. `no-magic-numbers`,
  `node/no-process-env: error`). Meant combined via `extends`, not standalone.
- **`stage1.json`** — relaxes DOM-manipulation rules for projects w/ component-style files.

`.oxlintrc.json` = this repo's own dev-time lint config — `extends` `recommended.json` +
`pedantic.json`, escalates most categories to `"error"`, sets `env`/`globals` for Bun. Excluded
from published package (`.npmignore`); good reference for how consumers combine presets via
`extends`.

`eslint.config.js` runs second lint pass using `eslint-plugin-oxlint` to auto-disable any ESLint
rule already covered by `.oxlintrc.json` — only catches what oxlint doesn't (yet) support, so
new failures there usually mean real gap, not duplicate finding.

`biome.jsonc` handles formatting + third linter pass; overrides allow JSONC
(comments/trailing commas) in published config files, `.oxlintrc.json`, `tsconfig.json`.

### Tests (`test/index.test.ts`)

For each published config file (`pedantic.json`, `recommended.json`, `stage1.json`), suite
checks: exists w/ correct MIME type, parses as plain JSON-serializable object, and —
critically — `oxlint --config="<file>" --print-config` exits 0 w/ empty stderr, i.e. oxlint
actually accepts it as valid config. Separate `describe("oxlint")` block exercises oxlint's own
config-resolution behavior (missing file, explicit config, default config), asserts malformed
fixtures in `test/fixtures/invalid-config*.json` rejected.

Adding/changing rule in any preset: run whole suite (`bun test`) over single file —
`--print-config` check catches invalid oxlint syntax, cheap.

## Conventions

- Config files are JSON w/ comments (JSONC) — comments explain *why* rule off/tuned, e.g.
  `"eslint/curly": "off", // covered by formatters`. Keep style: state reason, not rule.
- Keep `recommended.json`/`pedantic.json`/`stage1.json` rules alphabetically sorted within their
  `rules` object (mirrors existing ordering).
- Renovate manages dependency updates (`.github/renovate.json`); commit messages like
  `Update dependency X to vY` come from that.
