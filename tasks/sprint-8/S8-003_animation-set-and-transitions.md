# S8-003: Изготовить и проверить animation set

## Цель
Поставить полный набор deterministic transform/image-swap/sprite состояний
Финни с безопасными переходами, прерываниями и статичными эквивалентами.

## Контекст
Анимация не является условием награды и не рассчитывает состояние. Бесплатное
касание не создаёт деньги/рост, а goal/stage-сцены должны пропускаться.

## Состав работ
- изготовить AN-001–014 на совместимом layer/anchor contract;
- задать AN-015 priorities, transitions, compatibility, cancel и skip;
- реализовать AN-016 для независимых motion/sound settings;
- подготовить static pose для каждого обязательного результата;
- ограничить touch queue и фоновые реакции;
- зарегистрировать states/sequences, versions, source files и timing guidelines.

## Источники
- DEC-2026-09-19-006/007; историческое 3D-дополнение §7;
  AN-000–016, QA-002, QA-016;
- VR-007; S8-001 layer contract; `asset-manifest.json`.

## Критерии приёмки
- каждый AN-001–016 имеет state/sequence/rule либо static equivalent;
- переходы не дают jitter, popping, identity drift и бесконечной очереди;
- важная реакция не прерывается декоративным движением;
- goal/stage можно пропустить без потери результата;
- reduced motion и sound off не меняют игровое состояние.

## Зависимости
- S7-005 PASS и Accepted DEC-2026-09-19-007;
- S8-001.

## Verify
- transition/priority matrix tests;
- loop, interruption, cancel, skip и rapid-tap scenarios;
- video review на целевом устройстве;
- manifest/hash/license review.

## Out of scope
- фоновая музыка и сетевые аудиосервисы;
- награды за касание или просмотр клипа;
- изменение economy/reaction persistence.


## Прогресс 2026-09-23

Задача начата после коммита layer contract S8-001. Реестр AN-001–014,
переходы/очередь/skip/cancel AN-015 и независимые сохраняемые настройки
motion/sound AN-016 реализованы как инженерный контракт и control DB.
Взрослый раздел предоставляет два переключателя; Home применяет motion flag
к принятому idle/blink. Полные визуальные последовательности и device video
остаются открыты до production character layers.

Промежуточный результат запушен и включён в `dev` merge-коммитом `b49a52c`;
задача остаётся открытой до полной приёмки.

## Прогресс 2026-09-25 — runtime реакций

В Home подключены happy/thoughtful/inspired по успешным событиям. Goal/stage skip, замена старой реакции, отмена при навигации/модальной паузе/background и static equivalent для reduced motion реализованы. Android API 26 debug+Metro: thoughtful/inspired/happy и skip/cancel записаны на видео; 27/27 сочетаний Home 9×3 прошли. Доказательства: `Finni App/artifacts/sprint-8/S8-001-expression-runtime/QA.md`. Реестр AN-001–016 не считается целиком визуально принятым: видео покрывает реакцию лица, но не все full-body clip recipes. Физическое устройство, signed/offline и S10 gate остаются открытыми.

## Прогресс 2026-09-26 — подключение реестра

`FinniHomeScene` подключена к `FINNI_ANIMATION_SET` и применяет правила
очереди, приоритета, отмены, пропуска, скрытия и reduced motion. Persisted
receipts передают конкретный clip ID; ConfirmPlan тоже создаёт presentation
event после commit. Доступные предметные ассеты используются для эффектов
плана, монет и цели. Для отсутствующих совместимых поз лап, еды и ухода
остаётся статичное состояние с принятым выражением лица. Полный набор
визуальных движений AN-001–014 и device-video приёмка всё ещё открыты;
новые позы требуют отдельного art gate для девяти внешностей и трёх стадий.
