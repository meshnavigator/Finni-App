# S0-005 — completion evidence

- Статус: partial
- Дата Verify: 2026-09-17
- Scope: Expo/React Native bootstrap, Android release toolchain, подписанный
  APK и обязательный runtime-gate API 26.
- Follow-up: [S0-006](../S0-006_verify-api26-runtime.md).

## Результат

Создан каркас Expo SDK 57 + React Native + TypeScript с сохранённым native
Android project, package `com.meshnavigator.finni`, portrait,
`minSdkVersion=26`, `compileSdkVersion=36` и `targetSdkVersion=36`. Версии
закреплены в `package-lock.json`; добавлены lint, typecheck, test, content и
fixture checks.

На Windows подготовлены JDK 17.0.18, Android SDK 36, Build Tools 36.0.0,
NDK 27.1.12297006 и CMake 3.22.1. Release-key RSA-4096 создан вне Git под
владением владельца проекта; credentials защищены Windows DPAPI. Release
Gradle-конфигурация требует внешние переменные подписи и не имеет fallback на
debug key.

Clean release build завершён `BUILD SUCCESSFUL`. Подписанный APK сохранён в
`Finni App/artifacts/sprint-0/finni-0.1.0-release.apk`, размер 68 582 088 байт,
SHA-256
`062590A99C4541BB860F1F95DADA904D9F6D232ABBF4C63FE2BE3CC19273257F`.
Подпись APK Signature Scheme v2, manifest, package, SDK и четыре ABI проверены.

Обязательная установка и запуск на физическом Android API 26 без Metro не
выполнены: `adb devices -l` вернул пустой список. По явному решению пользователя
эта незавершённая часть вынесена в S0-006, поэтому статус задачи — `partial`, а
не `done`.

## Изменённые файлы

- bootstrap приложения и lockfile в `Finni App`;
- сохранённый `Finni App/android`;
- `Finni App/scripts`, `tests`, `content` и `fixtures`;
- `Finni App/docs/environment.md` и `Finni App/README.md`;
- `Finni App/artifacts/sprint-0`;
- `tasks/TASKS.md`;
- `tasks/sprint-0/SPRINT0_EXECUTION_ORDER.md`;
- `tasks/sprint-0/S0-006_verify-api26-runtime.md`;
- `docs/CURRENT_IMPLEMENTATION.md`;
- `tasks/sprint-0/done/S0-005_partial.md`.

## Источники решения

- `tasks/sprint-0/S0-005_bootstrap-android-release.md`;
- `tasks/sprint-0/SPRINT0_EXECUTION_ORDER.md`;
- `docs/IMPLEMENTATION_DECISIONS.md`,
  `DEC-2026-09-16-001`;
- `docs/Finni_SRS_v1.3_2026-09-16.md`, DEV-01/02 и требования Android 8+,
  release APK без Metro;
- официальное ТЗ, §§3.1–3.4.

## Решения

- Использованы ранее принятые `applicationId=com.meshnavigator.finni`, команда
  Better Together и внешний владелец release-ключа.
- Из-за кириллицы в workspace контрольная сборка выполнялась из временного
  ASCII-пути; фактическая схема SDK/CMake зафиксирована в
  `Finni App/docs/environment.md`.
- Нового архитектурного решения не принято:
  `IMPLEMENTATION_DECISIONS.md` не менялся.

## Verify

- `npm.cmd run verify` — PASS: ESLint, TypeScript, 3 bootstrap-теста, content и
  fixtures;
- `npx expo-doctor@latest` — PASS: 20/20 checks;
- clean `npm run android:release` / Gradle `:app:assembleRelease` — PASS:
  `BUILD SUCCESSFUL in 7m 50s`;
- `apksigner verify --verbose --print-certs` — PASS: v2, один подписант,
  RSA-4096;
- `aapt dump badging` — PASS: package `com.meshnavigator.finni`, version
  `0.1.0`/`1`, SDK 26/36, portrait, четыре ABI;
- повторный `Get-FileHash -Algorithm SHA256` — PASS: хеш совпадает;
- поиск release-keystore, CLIXML и `.env` в репозитории — PASS: release
  material отсутствует; стандартный debug keystore игнорируется `*.keystore`;
- `git diff --check` — PASS для tracked diff; дополнительный
  `git diff --no-index --check` — PASS для 37 новых текстовых файлов;
- `adb devices -l` — FAIL: подключённых устройств нет;
- установка и запуск на физическом API 26 — NOT RUN: устройство будет
  подключено позже.

## Commits и внешние действия

Коммиты, ветки, push, PR и GitHub-сущности не создавались. Governance-корень
остаётся вне Git; bootstrap-файлы в `Finni App` остаются untracked относительно
исходного commit `6002528`.

## Оставшаяся работа и риски

- S0-006 должна подтвердить физический Android API 26, установку и запуск
  текущего APK без Metro.
- До runtime evidence совместимость первого экрана с API 26 остаётся
  непроверенной.
- Временные ASCII staging/CMake paths являются локальным Windows workaround и
  не входят в репозиторий.

`CURRENT_IMPLEMENTATION.md` и `SPRINT0_EXECUTION_ORDER.md` обновлены по
фактическому bootstrap и вынесенному S0-006 runtime-gate. Mermaid не менялась:
в проекте нет отдельной диаграммы этого workflow; Accepted-решения не
изменились.
