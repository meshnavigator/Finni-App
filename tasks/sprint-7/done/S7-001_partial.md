# S7-001 — completion evidence

- Статус: partial
- Дата Verify: 2026-09-18
- Scope: Filament diagnostic code contracts и native build boundary без
  физического runtime/performance gate.
- Follow-up: [S7-003](../S7-003_resolve-signed-release-babel-dependency.md),
  [S0-006](../../sprint-0/S0-006_verify-api26-runtime.md) и
  [S10-001](../../sprint-10/S10-001_3d-accessibility-lifecycle-performance.md).

## Результат

Зафиксирован `react-native-filament@1.11.0`, подключён локальный Khronos
Fox GLB как diagnostic-only licensed sample. Реализованы skeletal animation
contract, hit-testing path, RN HUD, modal scene/input blocking, AppState
unmount и освобождение source data. Fox не считается Финни или production
resource.

Fresh ASCII staging после `npm ci` собрал clean debug APK. Signed release
дошёл до Metro bundle. Для первого gap добавлен подтверждённый
`@babel/plugin-transform-shorthand-properties@7.29.7`; следующий bounded retry
остановился на новом незаявленном
`@babel/plugin-transform-arrow-functions`, вызываемом Worklets Core 1.6.3.
Поштучное добавление dependency ladder прекращено.

## Изменённые файлы

- `Finni App/src/ui/HomeSceneSpike.tsx`;
- `Finni App/src/ui/home-scene-spike-contract.ts`;
- `Finni App/scripts/build-release.ps1`;
- `Finni App/package.json`, `Finni App/package-lock.json`;
- `Finni App/tests/bootstrap.test.mjs`;
- `Finni App/tests/home-scene-spike-contract.test.mjs`;
- governance task/report/decision files.

## Источники решения

- 3D-дополнение §§10–12, TECH-001–004, PERF-001–002;
- SRS v1.3 §§14, 17–18;
- DEC-2026-09-18-004 и DEC-2026-09-18-005;
- Khronos sample asset license/attribution рядом с diagnostic asset.

## Фактический Verify

- `npm.cmd run verify` — PASS: lint, typecheck, 51 tests, content, fixtures;
- fresh staging `npm ci` — PASS;
- `clean assembleDebug --no-daemon --console=plain` — PASS,
  `BUILD SUCCESSFUL in 8m 24s`, 317 actionable tasks;
- temporary debug APK: 182,045,393 bytes, SHA-256
  `A9F8AE8E402A822AA9303BCED7A5C8DFB672F7EF4654840299193225AC3A22E9`;
  последующий release clean удалил временный файл;
- signed release — BLOCKED в `:app:createBundleReleaseJsAndAssets` на
  незаявленном Worklets Babel plugin; APK/signature/ABI evidence отсутствует;
- `git diff --check` — PASS, кроме информационных CRLF warnings;
- device/API26/frame-time/memory/cold-start — DEFERRED по решению пользователя.

## Commits и внешние действия

Коммиты, push, PR и GitHub-сущности не создавались. Изменения остаются в
рабочем дереве `Finni App` на `dev` от `f9232d2`.

## Оставшаяся работа и риски

- S7-003 должна выбрать authoritative compatible dependency/upstream fix и
  получить signed release;
- S0-006/S10-001 подтверждают установку, lifecycle ×10, navigation ×20,
  frame-time, memory, cold start и resource release на устройстве;
- renderer не получает Accepted production status до этих gates.
