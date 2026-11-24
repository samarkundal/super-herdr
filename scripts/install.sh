#!/bin/sh
# Installs or updates Super Herdr in a Herdr App home: the layout, its mods and its keys.
#
#   git clone --depth 1 https://github.com/samarkundal/super-herdr && super-herdr/scripts/install.sh
#
# Safe to run again to update. Your projects, theme, sizes and other keys stay as they are.
# Real copies, not symlinks: Herdr App doesn't load a mod's own SVGs through a symlink.
set -eu

src=$(cd "$(dirname "$0")/.." && pwd)
app=${HERDR_APP_HOME:-$HOME/.config/herdr-app}
keys="$app/keys.json"
layout="$app/layouts/super-herdr.json"

say() { printf '%s\n' "$*"; }
fail() { printf 'super-herdr: %s\n' "$*" >&2; exit 1; }

for tool in jq rsync; do
  command -v "$tool" >/dev/null || fail "needs $tool (macOS: brew install $tool)"
done
[ -d "$app" ] || fail "no Herdr App home at $app. Open the Herdr app once, then run this again."
# Herdr writes its default keys.json on first start; never create a partial one in its place.
[ -f "$keys" ] || fail "no $keys yet. Open the Herdr app once, then run this again."

# Check every input before changing anything.
jq -e 'type == "object"' "$src/keys.json" >/dev/null 2>&1 || fail "the repo's keys.json isn't a JSON object"
jq -e 'type == "object"' "$keys" >/dev/null 2>&1 || fail "can't read $keys as a JSON object; nothing changed"
jq -e 'type == "object"' "$src/layouts/super-herdr.json" >/dev/null 2>&1 || fail "the repo's layout isn't valid JSON"

mkdir -p "$app/layouts" "$app/mods"

# 1. Mods. mod.json goes first, so Herdr never sees a half-copied mod and docks a stray copy of it.
for dir in "$src"/mods/super-*/; do
  name=$(basename "$dir")
  dest="$app/mods/$name"
  mkdir -p "$dest"
  cp "$dir/mod.json" "$dest/mod.json"
  rsync -a --delete --exclude gpui-kit.d.ts --exclude jsconfig.json --exclude '*.error' "$dir" "$dest/"
  say "mod     $name"
done

# 2. Layout and its Settings picture. An edited copy is kept beside it.
if [ -f "$layout" ] && ! cmp -s "$layout" "$src/layouts/super-herdr.json"; then
  backup="$layout.before-update-$(date +%Y%m%d-%H%M%S)"
  cp -p "$layout" "$backup"
  say "kept    your previous layout as $(basename "$backup")"
fi
cp "$src/layouts/super-herdr.json" "$layout"
cp "$src/layouts/super-herdr.svg" "$app/layouts/super-herdr.svg"
say "layout  super-herdr"

# 3. Keys: add the repo's sections to yours. Only keys the repo defines change.
tmp=$(mktemp "${TMPDIR:-/tmp}/super-herdr-keys.XXXXXX")
trap 'rm -f "$tmp"' EXIT
jq --slurpfile new "$src/keys.json" \
  'reduce ($new[0] | to_entries[]) as $e (.; .[$e.key] = ((.[$e.key] // {}) + $e.value))' \
  "$keys" > "$tmp"
if cmp -s "$tmp" "$keys"; then
  say "keys    already up to date"
else
  cp -p "$keys" "$keys.before-super-herdr"
  cat "$tmp" > "$keys"
  say "keys    merged (your previous keys.json is keys.json.before-super-herdr)"
fi

# 4. Check each mod loads, when the herdr-app command is available.
if command -v herdr-app >/dev/null 2>&1; then
  failed=0
  for dir in "$src"/mods/super-*/; do
    name=$(basename "$dir")
    herdr-app check "$app/mods/$name" >/dev/null 2>&1 || { say "check   FAILED: $name (run: herdr-app check $app/mods/$name)"; failed=1; }
  done
  [ "$failed" = 0 ] && say "check   all mods load"
fi

say ""
say "Done. Switch to it with Ctrl+Shift+L, Settings > Look, or:"
say "  herdr-app do layout.switch '{\"name\":\"super-herdr\"}'"
