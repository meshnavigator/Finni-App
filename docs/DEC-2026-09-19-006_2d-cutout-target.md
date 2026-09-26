# DEC-2026-09-19-006 — Целевое layered 2D cutout / 2.5D-направление Финни

- Status: Accepted
- Accepted by owner: 2026-09-19
- Scope: visual medium, renderer boundary, character/room production pipeline,
  Sprint 7–10 dependency graph
- Supersedes: DEC-2026-09-18-002 only in the scope above
- Related tasks: S7-002–S7-006, S8-001–S8-003, S9-001–S9-004,
  S10-001–S10-002

## Контекст

R1–R4 подтвердили отдельные export/rig/GLB contracts, но не сохранили
узнаваемый образ `REF-001`: шерсть, лицо, глаза, пропорции и характер оставались
ниже художественного gate. Layered 2D cutout POC сохраняет образ существенно
лучше и допускает deterministic transforms, image swap, sprite animation и
статичные reduced-motion состояния без повторной генерации каждого кадра.

Пользователь явно принял формулировку: «принимаю 2D cutout/2.5D как целевой
подход». POC при этом остаётся generated derivative и не получает
production/art/legal/runtime PASS автоматически.

## Решение

- целевое представление Финни — layered 2D cutout; 2.5D означает слои,
  параллакс и ограниченные transform/image-swap/sprite эффекты, а не
  обязательную native 3D-сцену;
- `REF-001` остаётся обязательным identity/art reference;
- экономика, persistence, `shapeId`, `patternId`, стадии, catalog IDs,
  presentation-after-commit, HUD, доступность и release lineage не меняются;
- V4.2 сохраняется как renderer-neutral composition baseline;
- camera/frustum, GLB, skeleton, root sliding, Filament и Worklets перестают
  быть production требованиями после принятия и проверки 2D runtime technology;
- `Finni_S7-002_2D_POC` используется только как comparative/diagnostic
  evidence до отдельных art/provenance и runtime/release gates;
- R1–R4, 3D addendum, reviews и partial reports сохраняются неизменяемой
  историей и не удаляются при cleanup приложения;
- точная implementation technology не выбирается этим решением. После S7-005
  отдельная DEC-2026-09-19-007 должна принять конкретный runtime contract либо
  зафиксировать blocker; до этого она имеет статус Proposed/open;
- Sprint 6 и S7-001 не переписываются задним числом. S7-002 закрывается
  partial/superseded, S7-003 сохраняет blocker evidence, а новый путь задают
  S7-004–S7-006 и переработанные Sprint 8–10.

## Последствия

S7-004 отдельно принимает art/provenance, S7-005 проверяет локальный 2D runtime,
lifecycle, reduced motion и signed release. Только после S7-005 PASS и Accepted
DEC-2026-09-19-007 S7-006 удаляет из приложения Filament/Worklets/GLB
diagnostic boundary и закрывает superseded Babel blocker. Массовое производство
Sprint 8 ждёт art и runtime gates; Sprint 9 сохраняет domain/application
границу; Sprint 10 измеряет decode/cache/memory/lifecycle и проводит независимые
визуальную и функциональную приёмки.

DEC-2026-09-18-004 остаётся Accepted для renderer-neutral composition/HUD
baseline. DEC-2026-09-18-005 остаётся Accepted для evidence limits и
отложенного device gate; его Filament/S7-003 clauses становятся историческими
после S7-006.

## Verify

- пользователь явно принял направление 2026-09-19;
- `Finni_S7-002_2D_POC` содержит RGBA open/blink states, 12-frame idle sheet,
  local previews, provenance и hashes, но не интеграцию;
- belief map показывает production UI `AppRoot` отдельно от opt-in diagnostic
  boundary `HomeSceneSpike` и её GLB contract/dependents;
- приложение, signed release, API 26, 27 сочетаний, стадии, полный animation set,
  art/legal acceptance и performance этим решением не объявлены PASS;
- внешние GitHub-действия не выполнялись: `repository` пуст.
