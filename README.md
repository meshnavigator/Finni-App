# Питомец Финни

Стартовый Expo SDK 57 / React Native / TypeScript каркас версии 0.1.0 для команды Better Together.
Android package: `com.meshnavigator.finni`. Ориентация: portrait. Минимальная
поддерживаемая версия Android: API 26 (Android 8.0).

## Локальная проверка

```powershell
npm ci
npm run verify
```

Каталог `android` сохранён в проекте. Обычная release-сборка не запускает
prebuild. Намеренная регенерация выполняется только отдельным изменением с
review native diff; известный Windows workaround для пути с кириллицей описан
в `docs/environment.md`.

## Release APK

Сначала подготовьте Android SDK и внешний release keystore. Ключ, пароли и
файлы `.env` никогда не добавляются в Git. Затем задайте в текущем PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot'
$env:ANDROID_SDK_ROOT = 'C:\Android\Sdk'
$env:FINNI_RELEASE_STORE_FILE = 'D:\secure\finni-release.keystore'
$env:FINNI_RELEASE_STORE_PASSWORD = '...'
$env:FINNI_RELEASE_KEY_ALIAS = '...'
$env:FINNI_RELEASE_KEY_PASSWORD = '...'
npm run android:release
```

Скрипт не выводит пароли, не использует debug fallback и перед Gradle запускает
`lint`, `typecheck`, `test`, `content` и `fixtures`. APK появляется по пути
`android/app/build/outputs/apk/release/app-release.apk`.

Точные версии toolchain и необходимые SDK packages перечислены в
`docs/environment.md`. Проверка установки и запуска на устройстве API 26 без
Metro выполняется после подключения устройства; до этого она не считается
пройденной.
