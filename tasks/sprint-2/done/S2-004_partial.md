# S2-004 — completion report

- Статус: **partial**
- Дата Verify: 2026-09-21
- Ветка: `S2-001/shop-purchases-and-ledger`
- Follow-up: [S2-006](../S2-006_verify-sprint2-android-runtime.md)

## Результат
History и Help доступны ребёнку без барьера. Adult flow использует 3-секундное
удержание или доступную арифметическую альтернативу, memory-only unlock и
relock при background/exit/mode/idle. Production shell загружается через
AppControlStore/LifecycleCoordinator до игровой БД; все действия идут через
captured sessionEpoch. Reset/delete удаляют только известный normal/demo файл
после закрытия общей очереди и восстанавливают pending intent до bootstrap.

## Изменения
- SQLite control DB `finni-control.db` с transactional CAS;
- production controller/runtime factory/admin driver;
- `AdultScreen`, `HistoryScreen`, `HelpScreen`, AppState relock;
- Node-safe barrels и tests adult/history/control/coordinator recovery.

## Verify
- adult/control targeted 5/5 и coordinator recovery 8/8 — PASS;
- `test:core` 52/52; полный suite 69/69 — PASS;
- lint/typecheck/content/fixtures/diff-check — PASS;
- Android child↔adult, mode switch, reset/delete runtime — **NOT RUN**.

## Решения, риски и документация
Без `expo-file-system` verify delete означает успешный `deleteDatabaseAsync`
и идемпотентный replay; отсутствующую БД не открываем для проверки. Физическое
подтверждение вынесено в S2-006. Коммит/push не выполнялись.
