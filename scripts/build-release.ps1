Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-EnvironmentVariable([string]$Name) {
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Переменная окружения $Name не задана."
    }

    return $value
}

$expectedNodeVersion = 'v22.18.0'
$expectedNpmVersion = '10.9.3'
$expectedJavaVersion = '17.0.18'

$actualNodeVersion = (& node --version).Trim()
if ($actualNodeVersion -ne $expectedNodeVersion) {
    throw "Требуется Node.js $expectedNodeVersion, обнаружен $actualNodeVersion."
}

$actualNpmVersion = (& npm.cmd --version).Trim()
if ($actualNpmVersion -ne $expectedNpmVersion) {
    throw "Требуется npm $expectedNpmVersion, обнаружен $actualNpmVersion."
}

$javaHome = Require-EnvironmentVariable 'JAVA_HOME'
$javaExecutable = Join-Path $javaHome 'bin\java.exe'
if (-not (Test-Path -LiteralPath $javaExecutable -PathType Leaf)) {
    throw 'JAVA_HOME не содержит bin\java.exe.'
}

$javaVersion = (& $javaExecutable -version 2>&1 | Out-String)
if ($javaVersion -notmatch ('"' + [regex]::Escape($expectedJavaVersion))) {
    throw "Требуется JDK $expectedJavaVersion. Фактический вывод: $javaVersion"
}

$androidSdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { $env:ANDROID_HOME }
if ([string]::IsNullOrWhiteSpace($androidSdkRoot) -or -not (Test-Path -LiteralPath $androidSdkRoot -PathType Container)) {
    throw 'Не найден Android SDK. Задайте ANDROID_SDK_ROOT (предпочтительно) или ANDROID_HOME.'
}

$requiredAndroidFiles = @(
    (Join-Path $androidSdkRoot 'platforms\android-36\android.jar'),
    (Join-Path $androidSdkRoot 'build-tools\36.0.0\aapt2.exe'),
    (Join-Path $androidSdkRoot 'platform-tools\adb.exe')
)
foreach ($requiredAndroidFile in $requiredAndroidFiles) {
    if (-not (Test-Path -LiteralPath $requiredAndroidFile -PathType Leaf)) {
        throw "Android SDK неполон: отсутствует $requiredAndroidFile"
    }
}

$storeFile = Require-EnvironmentVariable 'FINNI_RELEASE_STORE_FILE'
$null = Require-EnvironmentVariable 'FINNI_RELEASE_STORE_PASSWORD'
$null = Require-EnvironmentVariable 'FINNI_RELEASE_KEY_ALIAS'
$null = Require-EnvironmentVariable 'FINNI_RELEASE_KEY_PASSWORD'

if (-not (Test-Path -LiteralPath $storeFile -PathType Leaf)) {
    throw 'FINNI_RELEASE_STORE_FILE должен указывать на существующий внешний keystore-файл.'
}

& npm.cmd run verify
if ($LASTEXITCODE -ne 0) {
    throw "Проверки npm завершились с кодом $LASTEXITCODE."
}

$gradleWrapper = Join-Path $PSScriptRoot '..\android\gradlew.bat'
if (-not (Test-Path -LiteralPath $gradleWrapper -PathType Leaf)) {
    throw 'Не найден android/gradlew.bat. Каталог android должен быть сохранён после однократного prebuild.'
}

$appCxxDirectory = Join-Path $PSScriptRoot '..\android\app\.cxx'
if (Test-Path -LiteralPath $appCxxDirectory -PathType Container) {
    # Avoid CMake regenerating app autolinking while dependent module clean tasks
    # remove their generated codegen directories in parallel.
    Remove-Item -LiteralPath $appCxxDirectory -Recurse -Force
}

Push-Location (Split-Path -Parent $gradleWrapper)
try {
    $buildStartedAt = Get-Date
    & .\gradlew.bat clean :app:assembleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle release build завершился с кодом $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}

$apkPath = Join-Path $PSScriptRoot '..\android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apkPath -PathType Leaf)) {
    throw 'Gradle завершился без ожидаемого app-release.apk.'
}

$apk = Get-Item -LiteralPath $apkPath
if ($apk.LastWriteTime -lt $buildStartedAt) {
    throw 'Обнаружен только старый APK; новый release artifact не подтверждён.'
}

$apkHash = Get-FileHash -Algorithm SHA256 -LiteralPath $apkPath
Write-Host "Release APK: $($apk.FullName)"
Write-Host "SHA-256: $($apkHash.Hash)"
