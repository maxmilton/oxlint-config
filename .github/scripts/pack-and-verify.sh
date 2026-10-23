#!/usr/bin/env bash
set -euo pipefail

fail() {
  local status=$?
  printf '::error::%s\n' "$1"
  exit "$status"
}

PACK_JSON="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/pack.json"

echo "::group::npm pack output (pack.json)"
# TODO: Use bun pm pack when it supports --json; https://github.com/oven-sh/bun/issues/38191
npm pack --ignore-scripts --json | tee "$PACK_JSON" \
  || fail "Package creation failed"
echo "::endgroup::"

jq -e '.[keys[0]].name == "@maxmilton/oxlint-config"' "$PACK_JSON" \
  || fail "Unexpected package name"
jq -e '
  .[keys[0]].files | map(.path) |
  index("LICENSE") != null and
  index("LICENSE") != null and
  index("dist/oxclippy.js") != null and
  index("dist/pedantic.json") != null and
  index("dist/recommended.json") != null and
  index("package.json") != null and
  index("pedantic.json") != null and
  index("recommended.json") != null and
  index("stage1.json") != null
' "$PACK_JSON" \
  || fail "Required package files missing"
jq -e '.[keys[0]].entryCount == 8' "$PACK_JSON" \
  || fail "Expected 8 packed files"
filename="$(jq -er '.[keys[0]].filename' "$PACK_JSON")" \
  || fail "Package filename missing"
mv -- "$filename" publish.tgz \
  || fail "Could not rename package"
