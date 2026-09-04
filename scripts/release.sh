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
# Patch only the version line. Re-serialising the whole file with
# JSON.stringify would expand every single-line array back out and bury the
# one-line bump in a 20-line reformat diff.
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  NEW_VERSION="$NEW_VERSION" TAURI_CONF="$TAURI_CONF" node -e "
    const fs = require('fs');
    const p = process.env.TAURI_CONF;
    const src = fs.readFileSync(p, 'utf8');
    const out = src.replace(
      /^(\t\"version\": \")[^\"]+(\",)\$/m,
      \`\$1\${process.env.NEW_VERSION}\$2\`,
    );
    if (out === src) {
      console.error('ERROR: could not find the version line in ' + p);
      process.exit(1);
    }
    fs.writeFileSync(p, out);
  "
  echo "Updated $TAURI_CONF -> $NEW_VERSION"
fi

# --- Build the DMG -------------------------------------------------------
# CI=true tells Tauri's bundle_dmg.sh to skip the AppleScript step that sets
# the DMG window's icon positions and view style. That step needs interactive
# Finder access (System Settings -> Privacy -> Automation), which fails in
# most build contexts. The resulting DMG looks plainer (no custom layout) but
# functions identically for the drag-to-Applications install flow.
# Always build a universal binary. Without an explicit target, Tauri builds for
# the host arch only, so a release cut on the Intel iMac Pro would ship an
# x86_64-only DMG that then syncs to the Apple Silicon MacBook Pro and installs
# itself over a native build. Universal costs extra build time and is worth it.
TARGET="universal-apple-darwin"
for ARCH_TARGET in x86_64-apple-darwin aarch64-apple-darwin; do
  if ! rustup target list --installed | grep -qx "$ARCH_TARGET"; then
    echo "==> Installing missing Rust target: $ARCH_TARGET"
    rustup target add "$ARCH_TARGET"
  fi
done

echo ""
echo "==> Building universal release DMG (10-20 minutes for a clean build)..."
CI=true pnpm -C apps/desktop tauri build --target "$TARGET"

# --- Locate the produced DMG --------------------------------------------
# A targeted build lands under target/<target>/release/, not target/release/.
BUNDLE_DIR="target/$TARGET/release/bundle/dmg"
DMG_SRC=$(find "$BUNDLE_DIR" -name "*.dmg" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -n 1 || true)
if [ -z "$DMG_SRC" ] || [ ! -f "$DMG_SRC" ]; then
  echo "ERROR: No .dmg found under $BUNDLE_DIR/" >&2
  exit 1
fi

# Guard the whole point of the exercise: refuse to publish a single-arch DMG.
APP_BIN=$(find "target/$TARGET/release/bundle/macos" -type f -perm +111 -path "*/Contents/MacOS/*" 2>/dev/null | head -n 1 || true)
if [ -n "$APP_BIN" ]; then
  ARCHS=$(lipo -archs "$APP_BIN" 2>/dev/null || echo "")
  echo "Built binary archs: ${ARCHS:-unknown}"
  case "$ARCHS" in
    *x86_64*arm64*|*arm64*x86_64*) ;;
    *) echo "ERROR: expected a universal binary, got '${ARCHS:-unknown}'. Refusing to publish." >&2
       exit 1 ;;
  esac
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
