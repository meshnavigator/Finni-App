# Commit 658e109 — demo M1, Android security и анимации Финни

- Ветка: `S8-001/production-layer-prototype`; родитель: `d243107`.
- Сообщение: `feat(m1): integrate demo, Android security and Finni motion`.
- Задачи: [S4-001](../../sprint-4/S4-001_demo-fixture-and-appendix-a.md), [S4-003](../../sprint-4/S4-003_security-offline-backup-and-licenses.md), [S8-003](../../sprint-8/S8-003_animation-set-and-transitions.md).
- Объём: 32 файла, включая код, тесты, `docs/`, реестр задач и QA evidence.

## Изменение и источники

- `src/application/demo-scenario.ts`, runtime, взрослый экран и fixture: управляемый переход между пятью demo-днями, воспроизводимый маршрут A.1–A.12 и проверки начисления только при открытии дня. Источник сценария — [M1_DEMO_ROUTE](../../../docs/M1_DEMO_ROUTE.md), S4-001, ТЗ и SRS.
- `android/app/src/`, `plugins/with-finni-android-security.js`, `app.json`: отключён backup, добавлены правила исключения локальных данных, лишние разрешения удалены из release. Конфигурация Expo сохраняет изменение после `prebuild --clean`; debug-доступ к Metro сохранён. Основание — S4-003 и [Android QA evidence](../../../artifacts/sprint-4/M1-security-api26-qa/README.md).
- `src/ui/FinniHomeScene.tsx` и presentation: контроллер AN-001–014 подключён к доступным эффектам и событиям без изменения источника денежных операций. Неутверждённые кадры движений тела в production не включены.
- Обновлены `docs/CURRENT_IMPLEMENTATION.md`, `docs/INDEX.md`, `docs/mermaid/PROJECT_FLOW_MERMAID.md` и `tasks/TASKS.md`. Нового Accepted-решения не потребовалось.

## Verify

- После подготовки полного diff `npm run verify` — PASS: lint, typecheck, 149 тестов, content и fixtures.
- `git diff --cached --check` — PASS; корневые `docs/` и `tasks/` сверены с версионируемыми копиями по SHA256.
- По нативному [QA-отчёту](../../../artifacts/sprint-4/M1-security-api26-qa/README.md): тестовый release APK на API 26 открылся офлайн; `aapt` подтвердил разрешения и backup-конфигурацию; переход с 17 на 18 сентября сохранил B20/S40, а открытие второго дня дало B120/S40; после перезапуска в режиме полёта состояние восстановилось.

## Ограничения

- QA APK подписан Android Debug сертификатом; проверка поставочной подписи остаётся открытой.
- Полный маршрут A.1–A.12 через APK, backup/restore и визуальные клипы всех AN-001–014 не проверены. Для части движений нет утверждённых поз и раздельных частей персонажа; S8-003 остаётся открытой в этом объёме.
