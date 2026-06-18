@echo off
REM Gradle wrapper delegate for Capacitor Android projects on Windows

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%android"

echo ------ CAPACITOR ANDROID BUILD: DELEGATING TO ./android ------
call gradlew.bat %*
if %ERRORLEVEL% neq 0 (
  echo ❌ gradle failed inside nested 'android' folder with exit code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

set "APK_SRC=app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_SRC%" (
  echo ✓ Successfully located compiled APK at nested path: %APK_SRC%
  if not exist "%SCRIPT_DIR%app\build\outputs\apk\debug" mkdir "%SCRIPT_DIR%app\build\outputs\apk\debug"
  copy "%APK_SRC%" "%SCRIPT_DIR%app\build\outputs\apk\debug\app-debug.apk" > nul
  echo ✓ Copied android artifact to root: %SCRIPT_DIR%app\build\outputs\apk\debug\app-debug.apk
)

exit /b 0
