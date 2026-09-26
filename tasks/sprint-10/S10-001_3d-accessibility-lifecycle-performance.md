# S10-001: Проверить 2D accessibility, lifecycle и performance

## Цель
Доказать, что layered 2D/2.5D-версия доступна, офлайн-работоспособна и стабильна
на целевом Android без скрытия превышенных бюджетов или потери данных.

## Контекст
Красивый отдельный preview не закрывает аппаратную проверку. Production-профиль
должен сохранять лицо, силуэт и обязательные состояния REF-001 при реальных
ограничениях декодирования, памяти, lifecycle и reduced motion.

## Состав работ
- пройти QA-005–020 и заполнить evidence для каждого результата;
- проверить 360 dp, 100/150/200%, TalkBack, keyboard, back и 48 dp;
- измерить cold start, decode/cache, local feedback, dropped frames, память и
  нагрев;
- выполнить offline, background/return, process kill, low-memory и asset-error
  recovery;
- повторить финансовый цикл Sprint 2 на физическом устройстве, включая
  OEM storage pressure, recovery и release upgrade lineage;
- проверить motion/sound off, очистку image/animation cache и lifecycle resource
  disposal;
- исправить подтверждённые blockers и повторить тот же протокол.

## Источники
- DEC-2026-09-19-006, DEC-2026-09-19-007 и DEC-2026-09-22-009;
- 3D-дополнение §§12–13 только как renderer-neutral ограничения;
  PERF-001–002, QA-005–020;
- VR-011; S9-001–S9-004;
- официальный ТЗ §§3.1, 3.4, 3.6.

## Критерии приёмки
- QA-005–020 имеют привязанное к build/device evidence;
- API 26, устройство от 3 ГБ, offline и release APK подтверждены;
- Sprint 2 process/storage/recovery повторены на physical device без подмены AVD;
- 15-минутный stress, 20 navigation transitions и 10 background cycles стабильны;
- safe asset/animation failure не удаляет профиль и оставляет доступ к данным;
- motion/sound off не меняют операции и объяснения.

## Зависимости
- готовность реализации S9-001–S9-004 по DEC-2026-09-26-014;
- итоговый внешний PASS Sprint 9 определяется после S10-001/002 и не блокирует вход в S10-001.

## Verify
- physical device matrix, идентификация APK/commit и decode/cache evidence;
- 15-minute stress, navigation ×20, background ×10;
- TalkBack, font scale matrix, airplane mode и process kill;
- полный configured Verify, belief-map rebuild и `git diff --check`.

## Out of scope
- тестирование всех Android-моделей;
- молчаливое повышение числовых бюджетов;
- подмена physical evidence эмулятором.


## Входное evidence S9-001 — 2026-09-25

`Finni App/artifacts/sprint-9/S9-001-layout/README.md`:81 design-профиль,66 native geometry-профилей и9 финальных size/font профилей PASS; offline QA release API26. Повторить на физическом устройстве TalkBack traversal/озвучивание, corrupt/missing asset recovery, reduced motion и события мимики, decode/cache/performance. QA APK подписан debug keystore; production signing/arm64 acceptance этим не закрываются. Исходные данные и настройки AVD восстановлены.

## Вход 2026-09-26

Готовность реализации Sprint 9 достигнута: S9-002 `done`, S9-001/003/004 `partial` только по внешним gate; native schema 2→6 install-over проверен. Evidence: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`. S10-001 разблокирована для фактической физической проверки; её собственные критерии остаются открытыми.
