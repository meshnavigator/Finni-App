# S8-003 — финальная инженерная регрессия, 2026-09-28

## Итог

Исправлен доказанный дефект: успешный finish/skip сопровождался cancel из
cleanup. До исправления воспроизведено 5/5: metro-before.txt. Теперь отдельный
completion latch для каждого presentation ID делает finish, skip, cancel и
cleanup взаимоисключающими. Устаревшее завершение не влияет на следующую
реакцию. Регрессия зафиксирована в tests/finni-animation-set.test.mjs.

Исторический TypeError не воспроизвёлся уже на чистом запуске ДО исправления.
Его прежний stack отсутствует; причинная связь с двойным callback не заявляется.
QA entry устанавливает ErrorUtils handler с выводом stack; в двух финальных
сессиях TypeError/QA_ERROR_STACK/Metro ERROR отсутствуют. Это clean-repeat
результат текущего кода, не выдуманная атрибуция старой ошибки. При повторении
нужен stack и сценарий. Build/APK identity: device-build.json; точные source
hashes: runtime-result.json. Логи: metro-before.txt, metro-final-session1.txt,
metro-final.txt, logcat-before.txt, logcat-final-all.txt.

## Native scenarios

API26 AVD, debug APK + Metro, production FinniHomeScene внутри QA entry.
Production App.tsx восстановлен. Базы и domain commands не вызывались.

| Сценарий | Evidence | Результат |
| --- | --- | --- |
| Обычный finish | ID1 | Один finish, cleanup cancel подавлен |
| Замена до завершения | ID2→3 | Один cancel старого, один finish нового |
| 8 быстрых касаний, затем результат и ещё касания | ID4, priority-result/rapid-settled | Результат не прерван; очередь успокоилась, reducer bounded tests PASS |
| Modal cancel и снятие паузы | ID5, modal-cancel | Один cancel, реакция cleared, replay отсутствует |
| Background/return | ID6, background-return | Один cancel, после возврата idle |
| Skip goal/stage | ID11/12, skip-confirmed-13/14 | Один finish каждого, снятый эффект, idle |
| App motion off | ID9, motion-off-* | Статичный результат, idle pixels одинаковы |
| System reduced motion | ID10, system-reduce-* | Статичный результат, idle pixels одинаковы |

ID7/8 — диагностическая первая попытка skip с кликом выше кнопки, не evidence
skip PASS. Правильная кнопка подтверждена снимком и повторена в ID11/12.
run_native.py исправлен для воспроизведения правильного клика. lifecycle-api26.mp4
содержит первый сценарий; успешный повтор skip подтверждён отдельными PNG и
callback log. Основная финальная сессия: 48 plays/48 unique terminals; дополнительная
сессия пересъёмки: 12/12. Машинный аудит: all-sessions-result.json.

Отсутствие повторных presentation callbacks подтверждено runtime. Отсутствие
повторных финансовых результатов подтверждают receipt/economy тесты полного
Verify; новый end-to-end финансовый прогон в этой QA fixture не выполнялся.

## Визуальное покрытие

- 12 финальных checkpoint AN003–014: pointy/plain/stage2, final-AN-*.png.
- 24 risk checkpoints: AN006/009/010/014 × pointy/round/floppy × stage1/stage3,
  plain coat. visual-captures.json и review-risk-*.jpg.
- 6 дополнительных recheck кадров round/floppy stage3 после warmup:
  review-recheck.jpg. Некоторые ранние короткие AN006 snapshots попали в decode
  wait/neutral; они не объявляются доказательством активной фазы наклона.
  Активный thoughtful виден для round stage1 и floppy stage1/3; нейтральные
  stage3 кадры остаются в evidence с этим ограничением. Рост к stage1 в QA —
  граничный no-op; реальный рост 1→2 и 2→3 покрыт stage2/3.
- Просмотрены contact sheets финальных и рискованных кадров: отрыва головы,
  шва/дырки шеи, подмены формы ушей/окраса не обнаружено. Финальный sweep
  записан на видео final-sweep-api26.mp4. Короткие AN011/012 могут отсутствовать
  в single checkpoint из-за задержки screencap; видео сохраняет переход.
- Ранее снятые 27 gesture checkpoints остаются evidence plain/spots/stripes ×
  три формы × три стадии. Их пиксели/renderer не менялись в callback fix.

Это пропорциональная проверка риска, не полный Cartesian клип×27 PASS.

## Verify

- npm run verify — PASS: lint, typecheck, 155 tests, content, fixtures (verify.txt).
- node --test tests/finni-animation-set.test.mjs — PASS 7/7 (callback-test.txt).
- Полная belief map пересобрана после imports (belief-map.txt).
- git diff --check — PASS.
- App.tsx совпадает с production original; временная настройка transition scale
  возвращается к исходному 0; reverse и Metro/AVD удаляются/останавливаются.

## Оставшиеся ограничения

Причина старого неповторившегося TypeError неизвестна. Новых runtime ошибок в
сохранённых финальных сессиях нет. Physical Android/performance, spoken TalkBack,
signed/offline release и S10 external acceptance вне этого прогона и остаются
открыты. S8-003 engineering regression выполнена в указанном scope; полный
целевой device PASS не присваивается. Owner art acceptance сохранена, рисунки
не изменялись. Коммит/push/PR не выполнялись.
