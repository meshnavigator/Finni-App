# S1-005 — completion report

- Статус: **done**
- Дата: 2026-09-18
- Ветка: `S1-005/budget-plan-and-fact`
- Task-коммит: `c6edb25`
- Локальный merge в `dev`: `6742c92`

## Результат

Реализован сохраняемый план бюджета по направлениям «Нужно», «Хочется» и «На
мечту». Draft принимает только целые неотрицательные суммы, показывает
распределённую сумму и остаток, блокирует превышение доступного баланса и
требует подтверждения предупреждения при доле необходимого ниже ориентира.

ConfirmPlan фиксирует immutable initial plan, баланс и ledger boundary, но не
создаёт проводку и не меняет wallet. Новый доход распределяется отдельными
immutable дополнениями с revision, audit и persisted receipt; исходный план не
перезаписывается. Plan/fact отдельно показывает исходный план, добавления,
текущий ориентир, покупки, чистое изменение копилки и получение цели.

## Persistence и UI

- schema обновлена с v2 до v3 без удаления существующих данных;
- добавлены `budget_at_confirm`, `ledger_seq_at_confirm` и
  `period_plan_addition`;
- `BudgetPlanRepository` строит snapshot и атомарно распределяет новый доход;
- `AppRuntime` загружает бюджет и проводит ConfirmPlan/AllocateAdditionalIncome;
- CTA «Составить план» открывает полноценный экран draft, а после подтверждения
  — plan/fact и историю дополнений;
- основные controls имеют минимум 48 dp.

## Источники

- официальное ТЗ, §2.5.5;
- `docs/Finni_SRS_v1.3_2026-09-16.md`, §§7.4, UC-03/25, SC-05/23;
- FR-08–10/57, DEV-08/44, TC-007–013 и TC-153–158;
- принятые инварианты `docs/IMPLEMENTATION_DECISIONS.md` и фактическая карта
  `docs/CURRENT_IMPLEMENTATION.md`.

Нового архитектурного решения не потребовалось: реализация применяет уже
зафиксированные economy-v2, command receipt, revision и SQLite transaction
boundaries.

## Verify

- `npm run verify` — **PASS**:
  - ESLint — PASS;
  - TypeScript — PASS;
  - tests — **43/43 PASS**;
  - content — PASS;
  - fixtures — PASS;
- `git diff --cached --check` — PASS;
- file-backed SQLite integration — PASS: confirm без новой ledger entry,
  stale revision, idempotent replay, превышение квоты, запрет после close,
  restart с исходным/effective plan и историей дополнений;
- Android debug runtime на AVD API 36 / 360×640 dp — PASS: новый профиль →
  начало дня → CTA → draft 40/20/40 → confirm → plan/fact → force-stop/cold
  launch; баланс остался 100, план восстановлен;
- runtime evidence:
  `Finni App/artifacts/sprint-1/runtime/S1-005_RUNTIME_EVIDENCE.md`;
- full belief-map rebuild — PASS: 28 modules, 238 entities, 272 edges;
  boundary `budget-plan-repository` проанализирован.

## Ограничения и риски

- Сквозной UI-маршрут получения учебной награды относится к Sprint 3, поэтому
  add-income UI runtime после фактической награды пока недоступен; persistence,
  quota, история и restart подтверждены file-backed integration test.
- Runtime выполнен debug-сборкой с Metro на AVD API 36 через временный ASCII
  staging. Это не новый release artifact и не закрывает физический API 26 gate.
- S0-006 остаётся открытым carry-over: Sprint 1 нельзя объявлять полностью
  пройденным до установки и запуска release APK на физическом Android API 26.

## Документация

- обновлена `docs/CURRENT_IMPLEMENTATION.md`;
- обновлена `docs/mermaid/PROJECT_FLOW_MERMAID.md` для plan/fact data flow;
- `docs/IMPLEMENTATION_DECISIONS.md` не менялась: нового решения нет;
- обновлены `tasks/TASKS.md` и `SPRINT1_EXECUTION_ORDER.md`.

Внешние GitHub-действия не выполнялись: `repository` в конфигурации пуст.
