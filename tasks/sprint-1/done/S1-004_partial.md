# S1-004 — completion report

- Статус: **partial**
- Дата: 2026-09-17
- Task-ветка: `S1-004/onboarding-pet-and-home`
- Task-коммит: `58464ba`
- Merge в `dev`: **не выполнен**, ждёт device-gate S1-006

## Результат

Реализована первая normal-mode пользовательская вертикаль: статичное loading-
состояние, retryable storage error, знакомство с тремя направлениями денег,
создание одного локального профиля без регистрации/PII, конструктор 3×3 с
preview, edit-route из домика и compact home. Имя питомца нормализуется через
NFC, trim и схлопывание пробелов, проверяется по единому правилу 2–16 Unicode
code points. Все девять shape/pattern сочетаний перечисляются автоматически.

`ProfileRepository` одной транзакцией создаёт `profile`, нулевые
`wallet_projection`/`profile_state` и `game_clock`. Повторное подтверждение не
создаёт второй профиль. UpdatePet сохраняет ID, деньги и историю, проверяет
revision и меняет только имя/вид. `AppRuntime` использует существующие
`migrateDatabase`, `NormalClock` и `LifecycleRepository`; нажатие «Начать день»
создаёт реальный период и единственный доход, а UI не вычисляет clock/revision
самостоятельно.

Домик одновременно содержит имя/день, баланс, копилку, пустое состояние цели,
питомца, еду/уход/эмоцию, активное занятие, основное действие, четыре пункта
навигации, прогресс/помощь и отдельную кнопку взрослого раздела. План доступен
с DRAFT, покупки и копилка — с ACTIVE. Основные цели касания имеют минимум
48 dp; ScrollView оставляет полный текст доступным при увеличенном шрифте.

## Изменённые файлы

### Приложение

- `Finni App/App.tsx`, `src/ui/AppRoot.tsx` — app shell и экраны;
- `src/domain/pet-profile.ts`, `src/domain/index.ts` — имя и каталог 3×3;
- `src/persistence/profile-repository.ts`, `src/persistence/index.ts` —
  атомарный профиль и UpdatePet;
- `src/application/app-runtime.ts`, `src/application/ui-model.ts`,
  `src/application/index.ts` — UI integration и state-based screen models;
- `tests/profile-ui.test.mjs` — onboarding/home/loading/error, profile restart;
- `README.md` — актуальное фактическое состояние;
- `artifacts/sprint-1/` — подписанный APK, hash и runtime note.

### Governance

- `docs/CURRENT_IMPLEMENTATION.md` — фактическая архитектура, frontend и Verify;
- `docs/mermaid/PROJECT_FLOW_MERMAID.md` — profile/lifecycle UI data flow;
- `tasks/TASKS.md`, `tasks/sprint-1/SPRINT1_EXECUTION_ORDER.md` — partial gate;
- `tasks/sprint-1/S1-006_verify-onboarding-home-runtime.md` — device follow-up;
- этот completion report.

## Источники решения

- официальное ТЗ §§2.5.1–2.5.3, 2.6;
- SRS v1.3: UC-01, SC-01–04, FR-01–05/55/62;
- DEV-06/07/47; TC-001–004, TC-075/076, TC-183–185;
- S1-002 SQLite/migration/executor и S1-003 clocks/lifecycle contracts.

Нового Accepted-решения не принято: реализация следует существующему SRS.
`IMPLEMENTATION_DECISIONS.md` не менялся.

## Verify

- `npm.cmd run verify` — **PASS**;
- `npm.cmd run lint` — **PASS**;
- `npm.cmd run typecheck` — **PASS**;
- `npm.cmd run test` — **PASS**, 40/40 tests;
- `npm.cmd run content` — **PASS**;
- `npm.cmd run fixtures` — **PASS**;
- `git diff --check` и `git diff --cached --check` — **PASS**;
- file-backed SQLite restart — **PASS**: двойное создание оставляет один
  профиль; UpdatePet сохраняет ID и нулевые деньги; после close/reopen
  восстанавливается вторая комбинация `floppy/stripes`;
- `expo export --platform android` — **PASS**, 629 modules;
- clean signed release build — **PASS**, `BUILD SUCCESSFUL` за 6 мин 48 с;
- APK — 75 814 457 bytes, SHA-256
  `066830FD54824AE9C6DC0D73167E6D4819B91FFEA8FBA165DE3E59798ABD9930`;
- full belief-map rebuild — **PASS**: 25 modules, 207 entities, 233 edges;
- `analyze src/application/app-runtime` — 5 entities, 8 imports, 1 data flow,
  11 refs, 2 dependents, 11 boundary files;
- Android 360×640/fontScale1 runtime — **NOT RUN**: нет устройства/AVD;
- force-stop/relaunch с восстановлением — **NOT RUN**: нет устройства/AVD;
- вторая комбинация в фактическом APK UI — **NOT RUN**: нет устройства/AVD.

## Commits и внешние действия

Код и подписанный APK зафиксированы task-коммитом `58464ba`. Локальный merge в
`dev`, push, PR, issue и project board не выполнялись. `repository` в
конфигурации пуст; внешние действия не входят в scope. Merge намеренно ждёт
обязательного device evidence.

## Оставшаяся работа и риски

- S1-006 должен установить неизменный APK с указанным SHA, проверить 360×640,
  две комбинации, отмену edit и восстановление после force-stop/relaunch;
- до PASS S1-006 нельзя объявлять S1-004 done, объединять её в `dev` или
  запускать зависимую S1-005;
- component/source checks подтверждают состав и layout budget, но не доказывают
  отсутствие реального Android clipping, keyboard overlap или OEM font issues;
- screen shell пока normal-only; подключение mode/admin операций
  `LifecycleCoordinator` относится к взрослому разделу S2-004.

## Влияние на документацию и диаграммы

Обновлены `CURRENT_IMPLEMENTATION.md` и `PROJECT_FLOW_MERMAID.md`. Нового
архитектурного решения, отклоняющегося от SRS, нет. Completion status — partial,
поскольку обязательный runtime evidence не заменён автоматическими тестами.
