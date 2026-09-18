# S1-005 — Android runtime evidence

- Дата: 2026-09-18
- Итог: **PASS** для интерактивного plan/fact-сценария
- AVD: `small_phone`, Android 16 / API 36, viewport 360×640 dp
- Проверяемая сборка: debug из текущей task-ветки, package
  `com.meshnavigator.finni.debug`, запуск с Metro

## Сборка

Прямая Android-сборка из пути проекта остановлена штатной проверкой Gradle из-за
кириллицы в пути. Для runtime-проверки исходники без `.git`, `artifacts`, cache
и build-каталогов скопированы во временный ASCII staging
`C:\tmp\finni-s1-005-runtime-20260918`. В staging-only `build.gradle` добавлен
`applicationIdSuffix ".debug"`, чтобы не перезаписывать сохранённый release APK
S1-004/S1-006. Исходный проект этим workaround не изменён.

- `assembleDebug` — **PASS**;
- установка `com.meshnavigator.finni.debug` — **PASS**;
- запуск на сохранённом AVD — **PASS**.

## Фактический сценарий

| Gate | Результат | Evidence |
|---|---|---|
| Новый профиль и начало дня | PASS — открыт период с доступными 100 монетами | `s1-005-plan-draft.xml` |
| Маршрут CTA | PASS — `Составить план` открывает `ПЛАН НА ДЕНЬ` | `s1-005-plan-draft.xml` |
| Draft 40/20/40 | PASS — распределено 100, осталось 0, подтверждение доступно | `s1-005-plan-filled.xml` |
| Confirm без движения денег | PASS — plan/fact активен; после cold restart доступно по-прежнему 100, копилка 0 | `s1-005-plan-active.xml`, `s1-005-restart-home.xml` |
| Plan/fact | PASS — отдельно показаны первоначальный план, добавления, текущий ориентир и факт | `s1-005-plan-active.xml` |
| File-backed restart | PASS — force-stop/cold launch восстановил 40/20/40 и состояние plan/fact | `s1-005-restart-plan.xml`, `s1-005-restart-plan.png` |
| Touch targets | PASS — основные controls имеют не менее 96 px при density 2, то есть 48 dp | XML bounds и source-contract test |

## Граница runtime-проверки

Экран выдачи награды за урок относится к Sprint 3, поэтому новый доход нельзя
получить через текущий пользовательский маршрут. Распределение дополнительного
дохода, его отдельная история, idempotency, запрет превышения и восстановление
после повторного открытия проверены автоматическим file-backed SQLite test.
На runtime-экране при нулевой квоте корректно показано, что доход ещё не получен
или уже распределён.

Это evidence debug-сценария, а не новый release artifact. Отдельный gate
физического Android API 26 (S0-006) остаётся открытым.
