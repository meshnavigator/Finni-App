# S7-003: Устранить Babel dependency blocker signed release

## Статус

**SUPERSEDED BY S7-006, 2026-09-19.** Blocker evidence сохраняется, но
поштучное добавление Babel transforms больше не является production path после
DEC-2026-09-19-006. Operational closure ждёт S7-005 PASS, Accepted DEC-007 и
clean signed release S7-006.

## Цель

Сохранить точный Worklets/Babel blocker как историческое evidence и не
продолжать dependency ladder после принятого перехода на layered 2D.

## Evidence

Fresh `npm ci` и полный source Verify проходят. Clean debug build проходит.
Release достигает `:app:createBundleReleaseJsAndAssets`. Первый gap,
`@babel/plugin-transform-shorthand-properties`, закреплён direct-версией
`7.29.7`, совпадающей с Babel 7.29.7 graph. Следующий bounded retry выявил
новый незаявленный `@babel/plugin-transform-arrow-functions`, вызываемый
`react-native-worklets-core@1.6.3`. Dependency ladder остановлена; release APK
не создан.

## Scope

- определить authoritative compatible version или upstream fix для Expo 57 /
  RN 0.86.3 / Worklets Core 1.6.3;
- определить полный, а не поштучный Babel dependency contract Worklets plugin;
- зафиксировать минимальную dependency/patch policy;
- повторить clean signed release из fresh ASCII staging;
- проверить подпись, manifest, четыре ABI и SHA-256 артефакта;
- обновить S7 technical decision по фактическому результату.

## Критерии приёмки

- решение версии опирается на upstream/official source, а не guess;
- fresh `npm ci` и configured Verify проходят;
- `:app:assembleRelease` завершается `BUILD SUCCESSFUL`;
- APK подписан штатным release key, запускается без Metro по статическому
  contract и содержит требуемые ABI;
- при невозможности исправления зафиксирован точный upstream blocker и выбран
  другой renderer/версия через Accepted decision.

## Зависимости

- S7-001 partial evidence;
- внешний release key/DPAPI credentials из S0-005;
- authoritative compatibility evidence для Babel plugin.

## Verify

- `npm ci` и `npm run verify`;
- clean signed release из ASCII staging;
- `apksigner verify --verbose --print-certs`;
- `aapt dump badging` и ABI inspection;
- SHA-256 и `git diff --check`.

## Out of scope

- физический Android runtime — S0-006/S10-001;
- production-модель Финни — S7-002/S8;
- произвольное обновление Expo, React Native или renderer без отдельного
  compatibility decision.
- удаление Filament/Worklets до S7-005 PASS и Accepted DEC-007 — S7-006.

## Закрытие 2026-09-19

Задача superseded, но release PASS не заявлен. Исторический blocker закрывается
операционно только после S7-006. Evidence:
[S7-003_superseded.md](done/S7-003_superseded.md).
