# S7-006: Удалить superseded 3D stack и восстановить signed release

## Статус

**DONE, 2026-09-21.** Accepted 2D master подключён к production Home;
Filament/Worklets/GLB diagnostic boundary и временный spike path удалены.
Configured Verify и clean signed release на API 26 emulator прошли.

## Цель

Удалить из приложения больше не нужную diagnostic 3D boundary и её native/Babel
dependencies, сохранив historical evidence вне app runtime, затем получить
воспроизводимый signed release на принятом 2D stack.

## Контекст

Сейчас `App.tsx` условно импортирует `src/ui/HomeSceneSpike.tsx`, который
использует `home-scene-spike-contract.ts`; его dependents —
`HomeSceneSpikeFinniCandidate.tsx` и `HomeSceneSpikeFoxDiagnostic.tsx`.
`package.json`/lockfile всё ещё содержат `react-native-filament@1.11.0`,
`react-native-worklets-core@1.6.3` и связанный Babel workaround. Эти файлы и
dependencies удаляются только после доказанной замены, а не в этом planning
rebaseline.

## Состав работ

- удалить 3D diagnostic routing/imports из `Finni App/App.tsx`;
- удалить `Finni App/src/ui/HomeSceneSpike.tsx`,
  `home-scene-spike-contract.ts`, `HomeSceneSpikeFinniCandidate.tsx` и
  `HomeSceneSpikeFoxDiagnostic.tsx` вместе с их targeted tests;
- удалить app-local `assets/3d/diagnostic` и `assets/3d/candidates` только после
  проверки, что historical packages в governance `docs/` сохранены;
- удалить Filament/Worklets и только ставшие ненужными Babel/Metro/native
  настройки из package/lock/config/native build files;
- подтвердить, что default `src/ui/AppRoot.tsx` и новый 2D Home path используют
  прежний application/domain/persistence boundary;
- выполнить clean install, configured Verify и signed release без Metro;
- обновить current implementation, dependency evidence и release manifest.

## Источники

- DEC-2026-09-19-006;
- Accepted future DEC-2026-09-19-007;
- S7-001/S7-003 historical build evidence и S7-005 PASS report;
- current code boundary: `App.tsx`, `src/ui/AppRoot.tsx`,
  `src/ui/HomeSceneSpike*`, `src/ui/home-scene-spike-contract.ts`,
  `package.json` and lockfile.

## Критерии приёмки

- нет runtime/import/native dependency от Filament/Worklets и старых GLB
  diagnostic paths; lockfile соответствует manifest;
- 2D Home path остаётся локальным, не владеет финансовыми данными и имеет
  missing-asset fallback;
- configured Verify и clean signed release проходят; APK подписан, содержит
  нужные ABI и запускается без Metro;
- historical R1–R4, 3D addendum/reviews и POC не удалены и не переписаны;
- документация больше не объявляет S7-003 production gate.

## Зависимости

- **S7-005 PASS** с release/runtime evidence;
- **DEC-2026-09-19-007 Status: Accepted** с точной implementation technology;
- S7-004 PASS до production wiring;
- release key/DPAPI process из S0-005.

## Verify

- `rg` по Filament/Worklets/HomeSceneSpike/GLB imports с классификацией
  допустимых historical references;
- fresh `npm ci`, configured Verify и dependency/license audit;
- clean signed release, `apksigner`, manifest/ABI/SHA-256 и install/run;
- full belief-map rebuild после удаления imports/files;
- `git diff --check` и сверка сохранности governance evidence.

## Out of scope

- удаление `docs/Finni_3D_Addendum_v1.0`, R1–R4 или review reports;
- изменение economy-v2, schema, catalog IDs или release lineage;
- массовое производство 2D assets Sprint 8.
