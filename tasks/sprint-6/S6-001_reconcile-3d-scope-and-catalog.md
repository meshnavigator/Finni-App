# S6-001: Согласовать 3D scope и связать ресурсы с каноническим каталогом

## Статус

**PARTIAL, 2026-09-18.** Доказательная сверка выполнена, а владелец проекта
принял M1 release target в DEC-2026-09-18-002. Реализованные каталоги и
назначенные art, engineering и QA/device owners всё ещё отсутствуют.

## Цель
Разрешить конфликт 2D-базовой SRS и 3D-дополнения, определить release target и
связать будущие ресурсы только с реальными сущностями приложения.

## Контекст
Художественный эталон и M1 rebaseline утверждены DEC-2026-09-18-002.
SRS v1.3 теперь доступна, хотя отсутствовала в исходном архиве дополнения.
Производство по примерным суммам, велосипеду или подписям концепта запрещено.

## Состав работ
- сопоставить ТЗ, SRS, current implementation и VIS/PET/ROOM/HUD/EVT/TECH;
- выбрать post-M2 либо явно rebaseline M1/M2 и назначить владельцев поставок;
- построить таблицу `itemId/goalId/lessonId/state → assetId`;
- проверить признаки еды/ухода, внешность, стадии, навигацию и состояния периода;
- перевести DEC-2026-09-18-002 в Accepted или Rejected с явным scope;
- обновить README дополнения и manifest только подтверждёнными результатами.

## Источники
- официальный ТЗ, §§2.5–3.6;
- SRS v1.3, §§2, 7–12, 14;
- 3D-дополнение v1.0, §§1–15; VR-001; `asset-manifest.json`;
- `docs/IMPLEMENTATION_DECISIONS.md` и `docs/CURRENT_IMPLEMENTATION.md`.

## Критерии приёмки
- решение имеет owner, release target и статус Accepted/Rejected;
- каждый planned catalog asset связан с каноническим ID либо помечен blocked;
- все расхождения имеют решение, владельца и ссылку на источник;
- новая валюта, прогулка, мебельный магазин и выдуманные цели не добавлены;
- M1/M2 lineage не изменена без отдельного Accepted rebaseline.

## Зависимости
- S2-001, S2-002 и S3-004 либо принятый эквивалентный каталог.

## Verify
- review traceability-таблицы и всех неизвестных ID;
- JSON/schema-проверка manifest;
- проверка ссылок на ТЗ/SRS/решения;
- `git diff --check` в затронутом Git-контуре и ручная whitespace-проверка governance.

## Out of scope
- выбор renderer и изменение native Android;
- производство моделей, клипов и финальных макетов;
- изменение economy-v2.

## Результат 2026-09-18

- traceability и decision options: `docs/Finni_3D_Addendum_v1.0/S6-001_TRACEABILITY.md`;
- machine-readable bindings: `docs/Finni_3D_Addendum_v1.0/asset-manifest.json`;
- подтверждены 3×3 внешность, стадии 1–3, реакции и period states;
- `IT-01..08`, `GL-01..03`, `LS-*` не объявлены реализованным каталогом:
  индивидуальные assets имеют blocked binding;
- M1 принят как release target для настоящей 3D-сцены Home; renderer и бюджеты
  подтверждаются только S7 spikes и аппаратными измерениями;
- открытый риск: art, engineering и QA/device owners ещё не назначены.


## Актуализация 2026-09-23

Реализованный каталог `Finni App/src/domain/catalog.ts` содержит
`IT-01…IT-08` и `GL-01…GL-03`. S8-002 назначила им локальные
изображения `CAT-IT-*`/`CAT-GL-*` с путями и SHA-256; записи
`reconciliation.bindings.items/goals.individualBindings` в общем
`asset-manifest.json` обновлены. Историческая формулировка о
непоявившихся каталогах выше относится к срезу 2026-09-18.
Технический binding gate закрыт; задача сохраняет PARTIAL из-за
owner/art/device gates и не объявляет новый 2D пакет принятым.
