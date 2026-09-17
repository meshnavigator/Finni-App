# Окружение Android и release-сборка

## Зафиксированный bootstrap

- Expo: `57.0.23` (SDK 57);
- React Native: `0.86.3`;
- React: `19.2.3`;
- TypeScript: `6.0.3`;
- Node.js: `22.18.0`;
- npm: `10.9.3`;
- JDK: Microsoft OpenJDK `17.0.18`;
- Gradle Wrapper: `9.3.1`;
- Android Gradle Plugin: `8.12.0`;
- Kotlin Gradle Plugin: `2.1.20`;
- Android compile/target SDK: `36`;
- Android Build Tools: `36.0.0`;
- Android minimum SDK: `26`;
- Android NDK: `27.1.12297006`.

Точные транзитивные версии находятся в `package-lock.json`. Версии
`expo-build-properties`, ESLint и конфигурации ESLint также фиксируются там.

## Первичная подготовка

1. Установите JDK 17.0.18 и задайте `JAVA_HOME`.
2. Установите Android SDK packages `platform-tools`, `platforms;android-36`,
   `build-tools;36.0.0` и `ndk;27.1.12297006`.
3. Задайте `ANDROID_SDK_ROOT` (либо совместимый `ANDROID_HOME`) на каталог SDK.
4. Выполните `npm ci` и `npm run verify`.

Каталог `android` уже создан однократным Expo prebuild и является сохраняемым
исходным кодом. Обычная release-сборка его не регенерирует. На этом Windows-host
Expo prebuild не смог работать из пути с кириллицей и пробелом; исходная
конфигурация была скопирована во временный ASCII-путь, там выполнен clean
prebuild, после чего проверенный `android` перенесён обратно. Повторять эту
операцию можно только как отдельное намеренное изменение с review native diff.
Проверка Expo Doctor `appConfigFieldsNotSyncedCheck` отключена намеренно:
проект работает как сохранённый native Android project, а соответствие package,
версии, minSdk и signing между app config и native-файлами проверяют
`tests/bootstrap.test.mjs`.

## Фактическое окружение контрольной сборки

Контрольная сборка 2026-09-16 выполнена на Windows с Android SDK в
`C:\00.MIDAS\PROJECTS\28. ЛЦТ. 2026\tmp\android-sdk`. Установлены и приняты
лицензии для `platform-tools`, `platforms;android-36`,
`build-tools;36.0.0`, `ndk;27.1.12297006` и CMake `3.22.1`.

Gradle/CMake/Ninja некорректно обрабатывают кириллицу в абсолютном пути этого
workspace. Поэтому подтверждённая clean release-сборка выполнялась из
`C:\tmp\finni-release-build`, а CMake был скопирован в
`C:\tmp\finni-cmake-3.22.1`. В `android/local.properties` временной копии были
заданы `sdk.dir=S:/` и `cmake.dir=C:/tmp/finni-cmake-3.22.1`, где диск `S:`
создан командой `subst` и указывает на установленный SDK. Эти временные пути не
входят в репозиторий и не меняют исходный native-проект.

На этом host защищённые учётные данные подписи находятся в
`C:\Users\skoro\.finni-signing\finni-release-credentials.clixml`, а keystore —
в `C:\Users\skoro\.finni-signing\finni-release.keystore`. CLIXML зашифрован
Windows DPAPI и читается только тем же пользователем на том же компьютере.
Пароль передаётся в переменные процесса и не выводится в консоль.

## Внешняя подпись

Владелец проекта хранит keystore и его резервную копию вне Git. Перед release
сборкой определяются только в сессии PowerShell: `FINNI_RELEASE_STORE_FILE`,
`FINNI_RELEASE_STORE_PASSWORD`, `FINNI_RELEASE_KEY_ALIAS`,
`FINNI_RELEASE_KEY_PASSWORD`. `scripts/build-release.ps1` требует все четыре
значения и существующий keystore, проверяет точные Node/npm/JDK/Android SDK,
запускает все verify-команды и затем clean `:app:assembleRelease`. Release
Gradle-конфигурация не имеет fallback на debug key.

## Evidence API 26

После сборки установите release APK на физическое устройство Android API 26 и
запустите его при отключённом Metro. Зафиксируйте модель устройства, версию ОС,
команду установки, результат запуска, версию APK и наблюдения. Без этого
фактического прогона S0-005 не получает final PASS.

## Evidence release APK

Clean release build завершён с `BUILD SUCCESSFUL` за 7 мин 50 с. Полученный
APK сохранён как `artifacts/sprint-0/finni-0.1.0-release.apk` (68 582 088 байт),
SHA-256:
`062590A99C4541BB860F1F95DADA904D9F6D232ABBF4C63FE2BE3CC19273257F`.

`apksigner verify --verbose --print-certs` подтвердил APK Signature Scheme v2,
одного подписанта `CN=Better Together, O=Better Together, C=RU` и RSA-ключ
4096 бит. `aapt dump badging` подтвердил package
`com.meshnavigator.finni`, version `0.1.0` / code `1`, `sdkVersion=26`,
`targetSdkVersion=36`, portrait и ABI `arm64-v8a`, `armeabi-v7a`, `x86`,
`x86_64`. Установка и запуск на API 26 остаются отдельным обязательным gate.
