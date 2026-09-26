# S2-006 — done

- Статус: `done`
- Дата: 2026-09-22
- Ветка: `S2-006/verify-sprint2-android-runtime`
- Base commit: `498aef7`
- Evidence: `Finni App/docs/S2-006_emulator-runtime-evidence.md`

## Результат

Sprint 2 проверен production-representative signed release APK на Android 8.0 /
API 26 AVD без Metro. Пройдены Shop, Savings, Ledger/History, PeriodResult,
Help/Adult, normal↔demo, reset/delete, force-stop/relaunch, 360 dp/48 dp и пять
cold starts. Controlled APK со schema v4 и тем же applicationId/certificate
успешно обновлён до v5 с сохранением профиля и wallet.

## Изменения

- добавлен воспроизводимый emulator evidence report;
- критерий S2-006 уточнён по DEC-2026-09-22-009;
- Sprint 2 закрыт, historical partial-отчёты S2-001–S2-005 сохранены;
- physical-device/OEM/full-disk/performance gate добавлен в S10-001.

Исходный код приложения не изменялся.

## Verify

- signed release build — PASS, `BUILD SUCCESSFUL`;
- APK: 78 786 477 bytes,
  SHA-256 `BA29F9160D6CE6F14A384D97787FA1E4FDAA889CAEBD0C7E0BD487F4887369AD`;
- APK Signature Scheme v2, certificate SHA-256
  `902d920bbc11ef0d704766edfe9e983d2cf96581417b30376ebe974e15495b7d`;
- API 26 install/cold start без Metro — PASS;
- runtime financial/admin smoke — PASS;
- five cold starts — 920/869/1108/872/1007 ms, mean 955.2 ms;
- 360 dp и ключевые controls 48 dp — PASS;
- controlled same-signing v4→v5, `user_version` 4→5 — PASS;
- bounded 512 MiB storage pressure и cleanup — PASS;
- настоящий full-disk — NOT RUN: перенесён в physical-device gate Sprint 10;
- `npm run lint` — PASS;
- `npm run typecheck` — PASS;
- `npm run test` — PASS, 69/69;
- `npm run content` — PASS;
- `npm run fixtures` — PASS;
- `git diff --check` — PASS.

## Решения и документация

Принята DEC-2026-09-22-009: AVD evidence закрывает Sprint 2, но не подменяет
physical-device acceptance. Обновлены TASKS, CURRENT_IMPLEMENTATION, S2-006 и
S10-001. Workflow diagram не изменялась: data/runtime flow остался прежним.

## Commit и внешние действия

Новый commit, push и PR в рамках S2-006 не выполнялись. Base `498aef7` уже
находится в `dev`; evidence и governance changes остаются локальными.

## Оставшиеся риски

Physical device, OEM lifecycle/storage behavior, настоящий full-disk,
TalkBack/system bars, thermal/memory/frame budgets и финальная release lineage
остаются обязательными критериями S10-001/S10-002.
