# S9-002: Связать эффекты только с подтверждёнными command results

## Цель
Реализовать presentation controller, который проигрывает эффекты после commit,
не дублирует операции и очищает устаревшие события между сессиями.

## Контекст
Источником истины остаются command receipts и persisted snapshots. Анимация
после crash/replay не имеет права повторно начислять деньги, рост или цель.

## Состав работ
- определить presentation event с commandId/profile/mode/sessionEpoch/revision;
- создавать event только из persisted success result;
- задать idempotent replay, queue priorities, cancel и completion;
- очищать очередь при profile/mode/epoch/navigation/reset;
- связать purchase, savings, lesson, goal и stage effects;
- сохранить точные before/after amounts независимо от длительности эффекта.

## Источники
- 3D-дополнение §8 только как renderer-neutral contract; EVT-001–004,
  AN-015–016, QA-008–015;
- DEC-2026-09-19-006;
- VR-009; доменные contracts и repository receipts;
- SRS v1.3 §§7, 15–16.

## Критерии приёмки
- эффект начинается только после успешного сохранения;
- duplicate delivery одного commandId не повторяет операцию/праздник;
- cancel, failure, crash-after-commit и stale epoch сохраняют точные данные;
- mode/profile/reset не показывают чужие эффекты;
- economy-v2 контрольные итоги не изменены.

## Зависимости
- S9-001;
- S2-001–S2-004 и S3-001.

## Verify
- integration tests EVT-001–004;
- double submit, cancel, storage error, crash-after-commit, stale epoch;
- normal/demo/profile isolation и restart;
- economy fixture B=40, S=30, total=70, growth=13, stage=3;
- configured Verify, belief-map rebuild и `git diff --check`.

## Out of scope
- альтернативный баланс или прямой visual layer → SQLite;
- гарантированное повторное проигрывание каждого декоративного эффекта;
- изменение command contracts без отдельного решения.

## Итог 2026-09-26

Функциональная реализация и Verify завершены; статус `done`. Receipts для ключевых команд передаются в bounded presentation controller только после commit и загрузки persisted snapshot. Точные суммы, idempotent replay, приоритеты, отмена и контекст профиля/режима/эпохи покрыты тестами. Native API 26 проверил schema 2→6 install-over, покупку, двойное нажатие и отсутствие replay после restart. Точный APK, screenshots и логи: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`; completion report: `done/S9-002_done.md`. Физическое устройство и независимая приёмка остаются S10-001/002 и не входят в функциональное закрытие S9-002.
