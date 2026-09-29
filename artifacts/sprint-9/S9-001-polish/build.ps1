$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:/Program Files/Microsoft/jdk-17.0.18.8-hotspot'
$env:ANDROID_SDK_ROOT = 'C:/tmp/finni-s2-006-android-sdk'
# Public local debug credentials: QA package only.
$env:FINNI_RELEASE_STORE_FILE = 'C:/tmp/finni-prebuild-sdk57-20260916/android/app/debug.keystore'
$env:FINNI_RELEASE_STORE_PASSWORD = 'android'
$env:FINNI_RELEASE_KEY_ALIAS = 'androiddebugkey'
$env:FINNI_RELEASE_KEY_PASSWORD = 'android'
& ./android/gradlew.bat -p android :app:assembleRelease -PreactNativeArchitectures=x86_64 --offline *> artifacts/sprint-9/S9-001-polish/build-final.log
exit $LASTEXITCODE

