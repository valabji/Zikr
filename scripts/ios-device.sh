#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCHEME="Zikr"
CONFIG="${IOS_CONFIG:-Release}"
ENTITLEMENTS="ios/Zikr/Zikr.entitlements"

DEVICE_ID="${1:-${DEVICE_ID:-}}"
if [ -z "$DEVICE_ID" ]; then
  DEVICE_ID="$(xcrun xctrace list devices 2>/dev/null \
    | grep -E "iPhone|iPad" | grep -v "Simulator" \
    | sed -E 's/.*\(([0-9A-Fa-f-]+)\)$/\1/' | head -1)"
fi
if [ -z "$DEVICE_ID" ]; then
  echo "✗ No physical iPhone/iPad found. Plug in, unlock, and 'Trust' this Mac." >&2
  exit 1
fi
echo "› Target device: $DEVICE_ID"

if [ ! -d "ios/$SCHEME.xcworkspace" ]; then
  echo "› ios/ workspace missing — running prebuild"
  npx expo prebuild -p ios --non-interactive
fi

# Free Apple IDs can't sign the Push Notifications capability; local notifications don't need it.
/usr/libexec/PlistBuddy -c "Delete :aps-environment" "$ENTITLEMENTS" 2>/dev/null || true

xcodebuild -workspace "ios/$SCHEME.xcworkspace" -scheme "$SCHEME" -configuration "$CONFIG" \
  -destination "id=$DEVICE_ID" \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration build

APP="$(ls -dt "$HOME"/Library/Developer/Xcode/DerivedData/"$SCHEME"-*/Build/Products/"$CONFIG"-iphoneos/"$SCHEME".app 2>/dev/null | head -1)"
if [ -z "$APP" ] || [ ! -d "$APP" ]; then
  echo "✗ Built .app not found in DerivedData." >&2
  exit 1
fi
echo "› Installing $APP"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP"

echo
echo "✓ Installed. If this is a free Apple ID, trust it on the device first:"
echo "  Settings → General → VPN & Device Management → Apple Development → Trust"
