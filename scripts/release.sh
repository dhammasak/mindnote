#!/usr/bin/env bash
# Build a MindNote release DMG and drop it into the iCloud Drive Releases
# folder so any Mac running the app can pick it up via the in-app
# "Check for Update" flow.
#
# Usage:
#   scripts/release.sh            # bump patch  (0.8.3 -> 0.8.4)
#   scripts/release.sh patch      # bump patch
#   scripts/release.sh minor      # bump minor  (0.8.3 -> 0.9.0)
#   scripts/release.sh major      # bump major  (0.8.3 -> 1.0.0)
#   scripts/release.sh skip       # don't bump, rebuild current version
#   scripts/release.sh "Release notes here"   # bump patch with notes
#
# Final positional arg may be release notes (any string with spaces).
# Run from the repo root.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TAURI_CONF="apps/desktop/src-tauri/tauri.conf.json"
ICLOUD_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/MindNote/Releases"

# --- Parse args ----------------------------------------------------------
BUMP="patch"
NOTES=""
for arg in "$@"; do
  case "$arg" in
    major|minor|patch|skip) BUMP="$arg" ;;
    *) NOTES="$arg" ;;
  esac
done

# --- Read current version ------------------------------------------------
CURRENT_VERSION=$(node -p "require('./$TAURI_CONF').version")
echo "Current version: $CURRENT_VERSION"

# --- Compute new version -------------------------------------------------
if [ "$BUMP" = "skip" ]; then
  NEW_VERSION="$CURRENT_VERSION"
else
  IFS='.' read -r MAJ MIN PATCH <<< "$CURRENT_VERSION"
  case "$BUMP" in
    major) MAJ=$((MAJ + 1)); MIN=0; PATCH=0 ;;
    minor) MIN=$((MIN + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
  esac
  NEW_VERSION="$MAJ.$MIN.$PATCH"
fi
echo "New version:     $NEW_VERSION"
[ -n "$NOTES" ] && echo "Notes:           $NOTES"

# --- Write new version into tauri.conf.json ------------------------------
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  node -e "
    const fs = require('fs');
    const p = '$TAURI_CONF';
    const c = JSON.parse(fs.readFileSync(p, 'utf8'));
    c.version = '$NEW_VERSION';
    fs.writeFileSync(p, JSON.stringify(c, null, '\t') + '\n');
  "
  echo "Updated $TAURI_CONF -> $NEW_VERSION"
fi

# --- Build the DMG -------------------------------------------------------
echo ""
echo "==> Building release DMG (this takes 3-8 minutes for a clean build)..."
pnpm -C apps/desktop tauri build

# --- Locate the produced DMG --------------------------------------------
DMG_SRC=$(find target/release/bundle/dmg -name "*.dmg" -type f -print0 | xargs -0 ls -t 2>/dev/null | head -n 1 || true)
if [ -z "$DMG_SRC" ] || [ ! -f "$DMG_SRC" ]; then
  echo "ERROR: No .dmg found under target/release/bundle/dmg/" >&2
  exit 1
fi
echo ""
echo "Built DMG: $DMG_SRC"

# --- Copy to iCloud Drive ------------------------------------------------
mkdir -p "$ICLOUD_DIR"
DMG_NAME="MindNote-$NEW_VERSION.dmg"
DMG_DEST="$ICLOUD_DIR/$DMG_NAME"
cp "$DMG_SRC" "$DMG_DEST"
echo "Copied to:  $DMG_DEST"

# --- Write the manifest --------------------------------------------------
RELEASED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ESCAPED_NOTES=$(printf '%s' "$NOTES" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

cat > "$ICLOUD_DIR/latest.json" <<EOF
{
  "version": "$NEW_VERSION",
  "released": "$RELEASED_AT",
  "dmg": "$DMG_NAME",
  "notes": $ESCAPED_NOTES
}
EOF

echo "Wrote manifest: $ICLOUD_DIR/latest.json"
echo ""
echo "Done. iCloud Drive will sync the new DMG + manifest to all your Macs;"
echo "the in-app 'Check for Update' flow will pick it up within 24 hours"
echo "(or immediately when triggered manually from the MindNote menu)."
