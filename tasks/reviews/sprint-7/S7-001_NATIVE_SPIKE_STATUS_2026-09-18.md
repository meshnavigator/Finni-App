# S7-001 — промежуточный статус native spike

## Вердикт

**PARTIAL / IN PROGRESS.** `react-native-filament` 1.11.0 и
`react-native-worklets-core` 1.6.3 собираются в debug APK на фактическом
Expo 57 / React Native 0.86.3 toolchain. Runtime PASS не получен:
Android API 26 AVD не дошёл до рабочего ADB transport.

## Что подтверждено

- Зафиксированы точные версии Filament 1.11.0 и Worklets Core 1.6.3.
- Добавлены Worklets Babel plugin и Metro asset extension `glb`.
- Добавлен изолированный `HomeSceneSpike`: native scene и React Native overlay
  явно разделены. Компонент не включён в production Home.
- `npm run verify`: PASS, 43 tests.
- `git diff --check`: PASS.
- `:app:assembleDebug`: PASS из ASCII staging path за 8m14s, 236 tasks;
  собраны `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
- Native configuration явно подтвердила Worklets integration в Filament.

## Исправленный blocker

Первая сборка с Worklets Core 1.6.2 упала на CMake target
`hermes-engine::libhermes`. React Native 0.82+ использует
`hermes-engine::hermesvm`. Upstream release 1.6.3 содержит ровно это
исправление; после обновления native build прошёл.

## Открытый runtime blocker

- Полный `system-images;android-26;google_apis;x86_64` установлен SDK Manager.
- Три отдельных AVD запускались с WHPX и без аппаратного ускорения.
- Каждый застыл до загрузки Android; ADB видел только
  `emulator-5554 offline` либо не видел transport.
- APK на API 26 не устанавливался, поэтому это не runtime FAIL
  Filament, а блокировка test environment.

## Что ещё нужно для PASS

- licensed/local GLB с skeletal clip;
- overlay, hit testing и modal blocking в runtime;
- pause/resume, navigation и resource-disposal cycles;
- frame time, memory, cold start;
- signed release APK without Metro;
- физическое или рабочее эмулируемое API 26 evidence.

## Риски зависимостей

`npm audit --omit=dev` показывает 10 moderate, 0 high, 0 critical.
Все 10 идут через текущий Expo toolchain; предлагаемый npm fix требует
несовместимый downgrade Expo и не применялся.

## Финальное обновление 2026-09-18

- source `npm run verify` — PASS: 51 tests, lint, typecheck, content, fixtures;
- fresh ASCII staging clean debug — PASS за 8m24s, 317 tasks;
- release script безопасно очищает только generated `android/app/.cxx`;
- direct `babel-preset-expo@~57.0.12` добавлен по существующему Expo 57
  constraint и устранил первый Metro blocker;
- `@babel/plugin-transform-shorthand-properties@7.29.7` добавлен после проверки
  официального пакета и совпадающего Babel graph;
- следующий bounded signed-release retry остановлен на новом незаявленном
  `@babel/plugin-transform-arrow-functions`, вызываемом Worklets Core 1.6.3;
  dependency ladder прекращена;
- задача закрыта как `partial`, release follow-up — S7-003, аппаратный evidence
  — S0-006/S10-001.
