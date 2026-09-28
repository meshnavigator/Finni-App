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

## Прогресс 2026-09-28 — full-body runtime candidate

По прямому поручению владельца, DIRECT Astra Medium, реализованы движения
головы/туловища/хвоста, новые lower-body жесты трёх окрасов, bowl/brush/planner/
coins/goal/stage recipes. Все формы ушей и мимика используют принятую графику.
Native renderer сохраняет fixed feet, preloads, bounded optional queue,
pause/cancel/skip и static equivalents; large-text portrait остаётся статичным.

Инженерная реализация и доступный Verify фиксируются в
`Finni App/artifacts/sprint-8/S8-003-body-runtime/README.md`: 12 AN-003–014
clip checkpoints и видео на API26 emulator, 27 gesture checkpoints 9×3,
motion-off pixel stability, lifecycle scenarios, source lineage и configured
verification. Новое owner art acceptance и физический Android/performance
не объявляются PASS. Задача остаётся открытой по этим внешним gates.

## Приёмка владельца 2026-09-28 и остаток работ

Владелец явно принял новые позы и анимации в продолжении этой задачи.
Owner art gate закрыт для представленного результата; точные source/export
hashes трёх lower-body поз закреплены в FINNI-GESTURE-V1/owner-acceptance.json.
Это обновляет ранее записанный pending art status, не подтверждая runtime QA.

До инженерного закрытия: атрибутировать Metro TypeError на чистом запуске,
исправить при воспроизведении и повторить финальные native transition/lifecycle
сценарии (rapid tap, priority interruption, modal/background/return, skip обеих
milestone сцен, static equivalents). Проверить рискованные движения головы/
предметов на трёх формах и крайних стадиях; полный Cartesian sweep не объявлять
обязательным без нового выявленного риска. Таблица clip × appearance × stage
должна явно различать PASS и NOT RUN. Детали — README evidence.

Physical API26 video/performance, настоящий TalkBack и release/offline gates
сохраняются в S10-001/002. По DEC-005 они не препятствуют engineering/art этапу,
но S8-003 не получает полный PASS по критерию target-device video без evidence.
Текущий task остаётся открытым: есть и инженерный QA остаток. Нового
архитектурного решения нет; IMPLEMENTATION_DECISIONS не меняется.

## Инженерная регрессия 2026-09-28

Исправлен подтверждённый повторный cancel после finish/skip из cleanup.
Финальные native сессии: 60 reactions/60 unique terminal callbacks; priority,
rapid taps, modal/background, оба skip, motion off/system reduced motion
проверены. TypeError не воспроизвёлся в чистом запуске ещё до исправления;
историческая причина неизвестна без прежнего stack. Сохранён новый clean log.
Повторены 12 clip checkpoints и 24 head/neck/prop risk checkpoints с шестью
пересъёмками; отдельные короткие snapshots не подтверждают активную фазу,
точные ограничения перечислены в regression/README.md. Новых visual blockers
не обнаружено. Полный npm run verify PASS: 155 tests, lint/typecheck/content/fixtures.

Инженерный scope запроса выполнен; задача остаётся открытой только по полному
целевому device/release gate и указанным границам evidence, без ложного device
PASS. Follow-up уже назначен S10-001/002; новый дублирующий task не создаётся.
