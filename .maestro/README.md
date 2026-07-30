# Maestro E2E flows

End-to-end tests against the real Android app, run in CI on every PR.

## Run locally

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Start an Android emulator (or plug in a device with USB debugging).
3. Build a release APK (debug-signed; release variant is required — see below):
   ```
   npx expo prebuild --platform android --clean --non-interactive
   cd android && ./gradlew assembleRelease --no-daemon \
     -x lint -x lintVitalRelease -x lintVitalAnalyzeRelease
   ```
4. Install: `adb install -r android/app/build/outputs/apk/release/app-release.apk`
5. Run a flow: `maestro test .maestro/smoke.yaml`

### Why release, not debug?

A debug APK enables React Native's dev support manager, which keeps polling
Metro and can trigger a React instance reload during boot. That reload races
with expo-av's ExoPlayer teardown (released from a background thread) and
hangs the app on the splash screen. The release variant has dev support
disabled and boots cleanly.

The `app/build.gradle` release block is configured to sign with the local
debug keystore, so no extra signing setup is needed.

## CI

`.github/workflows/e2e-android.yml` runs every flow in this directory on PR to
`master` and on manual dispatch. It builds the release APK via `expo prebuild`
+ `./gradlew assembleRelease`, boots an Android 13 (API 33) emulator, installs
the APK, and runs the flows.

The Android package id under test is `com.valabji.zikr`.
