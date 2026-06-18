#!/usr/bin/env bash
# Gradle wrapper delegate for Capacitor Android projects
# Redirects root-level gradle build commands to the android/ nested directory
# and copies the compiled APK back to the expected /app/build outputs path.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/android" || exit 1

echo "------ CAPACITOR ANDROID BUILD: DELEGATING TO ./android ------"
./gradlew "$@"
GRADLE_EXIT_CODE=$?

if [ $GRADLE_EXIT_CODE -ne 0 ]; then
  echo "❌ gradle failed inside nested 'android' folder with exit code $GRADLE_EXIT_CODE"
  exit $GRADLE_EXIT_CODE
fi

# Locate compiled APK and copy to the expected root location
APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_SRC" ]; then
  echo "✓ Successfully located compiled APK at nested path: $APK_SRC"
  mkdir -p "$SCRIPT_DIR/app/build/outputs/apk/debug"
  cp "$APK_SRC" "$SCRIPT_DIR/app/build/outputs/apk/debug/app-debug.apk"
  echo "✓ Copied android artifact to root: $SCRIPT_DIR/app/build/outputs/apk/debug/app-debug.apk"
fi

exit 0
