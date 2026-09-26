# S7-002 — review vertical slice R2

## Вердикт

**IN PROGRESS / ART BLOCKED, 2026-09-19.** R2 снимает конкретный structural
blocker R1 и даёт воспроизводимый diagnostic candidate для non-device review.
Она не является `PET-MASTER`, finished room, production clip set или
identity/art PASS. S7-002 не закрывается и не переносится в `done`.

## Подтверждённая причина rejection R1

R1 использовала одну name→node map. Имя prop `Chest` совпало с именем rig joint,
так что prop перезаписал `FinniRig` joint и стал rotation target `idle`. Это
делало skin/animation семантику недостоверной, поэтому R1 **REJECTED**.

R2 namespaces rig joints как `Joint.*`, хранит отдельные immutable maps joints
и objects и имеет assertions: все skin joints несут `extras.isJoint=true`, а
root-level prop `Chest` не является animation target.

## R2 non-device evidence

| Проверка | Фактический результат |
|---|---|
| Артефакт | `docs/Finni_S7-002_vertical_slice/Finni_S7-002.glb`, 1,024,896 bytes; SHA-256 `d5e4ed776b32c04a06eed27eeffaf53746ab06cff19fa76cf00da69d6e20ca83` |
| Reproducibility | Повторная R2 procedural build в отдельной temporary output-папке прошла; источник не удалялся и output path параметризован |
| glTF structure | glTF Validator — PASS; 1 skin, 15 namespaced joints, отдельный `Chest`, четыре clips в порядке `idle`, `blink`, `interest`, `joy`; local embedded textures без remote URI |
| Provenance package | R2 package фиксирует `REF-001` hash `84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211`, не включает его файл и не содержит сторонних art assets по технической ведомости |
| Diagnostic integration | Static Metro require в `Finni App`; `EXPO_PUBLIC_FINNI_3D_DIAGNOSTIC=finni` выбирает R2, `=1`/`=fox` оставляют Khronos Fox, default остаётся `AppRoot` |
| Diagnostic controls | Renderer использует документированные индексы Filament: `idle=0`, `blink=1`, `interest=2`, `joy=3`; 48dp accessible clip controls, hit-test, HUD, modal input blocking, AppState lifecycle и reduced-motion contract реализованы |
| App Verify | `npm.cmd run verify` — PASS: lint, typecheck, 53/53 tests, content, fixtures; `git diff --check` — PASS с информационными CRLF warnings; full belief map: 32 source files, 32 nodes, 317 edges |

Источники structural evidence: `docs/Finni_S7-002_vertical_slice/slice-manifest.json`,
`README.md`, `INTEGRATION_NOTES.md`, `SHA256SUMS.txt`. App evidence относится
только к diagnostic path и не доказывает художественное качество или runtime.

## Открытые art gates

- исходный `REF-001` не был доступен отдельным PNG: обязательный side-by-side
  identity review не выполнен;
- technical provenance package не является product/legal acceptance; оба
  владельца `art` и `3D-source` остаются `TBD`;
- device/runtime/performance, frame time, memory, screenshot/video и signed
  release evidence не выполнялись для R2;
- нет независимого art acceptance и не выполнены 27 вариантов, 3 стадии,
  полный AN-001–016 или законченная комната.

## Следующее условие

Назначить art и 3D-source owners, провести side-by-side с оригиналом `REF-001`
и вынести product/legal provenance decision. Затем R2 может быть проверена на
release/device gate вместе с разблокировкой S7-003. До этого Sprint 8 остаётся
заблокированным art PASS S7-002, S7-003 и оценкой производства.
