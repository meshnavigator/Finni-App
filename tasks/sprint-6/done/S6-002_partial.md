# S6-002 — completion evidence

- Статус: partial
- Дата Verify: 2026-09-18
- Scope: responsive Home/HUD, state mapping, accessibility contracts и
  overlay/back behavior без аппаратной приёмки.
- Follow-up: [S9-001](../../sprint-9/S9-001_home-scene-hud-integration.md) и
  [S10-001](../../sprint-10/S10-001_3d-accessibility-lifecycle-performance.md).

## Результат

Реализованы ordinary, compact и scroll-fallback профили; при 150% финансы и
primary CTA остаются до сцены, при 200% интерфейс показывает явный
`reviewConflict` и не выдаёт fallback за PASS §2.5.3. Интерактивные элементы
сохраняют 48 dp contract, длинное имя допускает две строки. Справка открывается
native modal, Android Back закрывает её, а underlying Home не заменяется новым
route и не получает касания.

Задача закрыта как `partial`: independent design review, реальные system safe
areas/TalkBack и одновременная видимость на 360×640/200% не подтверждены.
Пользователь отдельно отложил device evidence; это не объявляется PASS.

## Изменённые файлы

- `Finni App/src/ui/AppRoot.tsx`;
- `Finni App/tests/profile-ui.test.mjs`;
- task registry, decision/current implementation и gate diagram.

## Источники решения

- официальный ТЗ §2.5.3 и §3.6;
- SRS v1.3 §§9, 11–12;
- 3D-дополнение §§2–6, HUD-001–006, QA-005–006;
- DEC-2026-09-18-004 и DEC-2026-09-18-005.

## Фактический Verify

- `npm.cmd run verify` — PASS: lint, typecheck, 51 tests, content, fixtures;
- `profile-ui.test.mjs` подтверждает modal/back contract, 48 dp source
  contract и явную маркировку 200% conflict;
- `git diff --check` — PASS, кроме информационных CRLF warnings;
- web runtime — NOT RUN: проект не содержит `react-dom`/`react-native-web`;
- device/TalkBack/system bars — DEFERRED по решению пользователя.

## Commits и внешние действия

Коммиты, push, PR и GitHub-сущности не создавались. Изменения остаются в
рабочем дереве `Finni App` на `dev` от `f9232d2`.

## Оставшаяся работа и риски

- принять либо изменить 200% scroll fallback при интеграции S9-001;
- выполнить независимый design/product walkthrough всех состояний;
- подтвердить TalkBack, keyboard, system safe areas и scene blocking в S10-001.
