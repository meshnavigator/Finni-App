# S8-003 — full-body runtime, art accepted

Дата: 2026-09-28. Исполнитель: DIRECT Astra Medium, подтверждён владельцем.

Актуальное продолжение: [финальная инженерная регрессия](regression/README.md).
Callback defect исправлен; финальный Verify 155/155 и clean native repeat
зафиксированы там. Старые открытые пункты ниже сохранены как история этапа.

## Результат

В production FinniHomeScene подключён FinniPuppet: AN-001/002 — дыхание и
нерегулярное моргание, AN-003 — интерес, AN-004 — приветствие, AN-005 —
касание, AN-006–008 — эмоциональные движения, AN-009 — миска, AN-010 —
щётка, AN-011 — планер, AN-012 — направленные монеты, AN-013 — цель,
AN-014 — рост вокруг опоры лап. Клип ожидает декодирования графики.
Принятые головы/уши/мимика сохранены. Владелец явно принял новые позы
и анимации 2026-09-28; owner-acceptance.json фиксирует точные source/export
hashes трёх lower-body жестов. Large-text portrait использует
статичную мимику. Экономика и persisted receipts не менялись.

Источники: AN-000–016 исходного дополнения, DEC-006/007/011, контракт
assets/2d/FINNI-S8-003-ANIMATION-CONTRACT.md v2. Нового архитектурного
решения нет. CURRENT_IMPLEMENTATION, task S8-003 и диаграмма
S8_003_BODY_ANIMATION обновлены в governance root.

## Verify

- `npm run verify` — PASS: lint, typecheck, 154 tests, content, fixtures.
  Полный вывод: verify.txt. Node сообщает существующее предупреждение
  MODULE_TYPELESS_PACKAGE_JSON; команды завершаются успешно.
- `git diff --check` — PASS (whitespace.txt).
- Полная belief map пересобрана: 266 nodes, 811 edges (belief-map.txt).
- Тесты проверяют ограниченные траектории/нейтральные endpoints, порядок
  приоритетов, направление суммы, нерегулярные интервалы, source hashes,
  lineage 54 групп. После явной owner acceptance тест дополнительно связывает
  её с точными hashes принятого пакета.

## Native QA и воспроизведение

Android emulator API26, 1080×1920, установленный debug APK + Metro.
Временный entry AnimationReview.tsx использует настоящий FinniHomeScene и
только presentation props, без записи SQLite. Production App.tsx восстановлен.
Для повторения QA можно временно экспортировать AnimationReview из App.tsx;
после проверки обязательно восстановить production entry. capture_native.py
содержит сценарий screenshot sweep. captures.json хранит 39 checkpoints.

- clip-AN-003.png … clip-AN-014.png: 12 клипов, pointy/plain/stage2.
- clips-api26.mp4: 54.9 секунды, весь sweep AN-003–014; последний checkpoint
  записан примерно через 43 секунды после первого. Дыхание видно между клипами.
- matrix-*.png: 27 wave checkpoints (9 внешностей × 3 стадии).
- review-9-appearances.jpg: просмотрены все девять внешностей на stage2.
- final-care.png, final-thoughtful.png: повторная проверка после финального
  скрытого перекрытия шеи. Видео и sweep предшествуют только этой локальной
  коррекции; не выдаются за полный повторный sweep финального изменения.
- motion-off-a.png/b.png: область питомца (150,220,820,1030) pixel-identical
  через 0.7 секунды, PASS; motion-off-result.png показывает статичную реакцию.
- skip-goal.png: после skip состояние idle, эффект снят, PASS.
- modal-cancel.png: paused=true, движущийся эффект снят. Снимок сделан до
  подтверждения callback idle; завершение callback этим снимком не доказано.
  Машинный итог: lifecycle-checks.json.

В процессе исправлены декодирование первого жеста, двойные overlays,
неправильное позиционирование props и видимые разрывы экспортированных слоёв.
Отбракованный ImageGen вариант с лишней лапой не включён в assets.
Снимки и видео сняты на эмуляторе, а не браузерной имитации.

## Ограничения и оставшиеся gates

Это визуальная проверка 12 клипов на одной внешности плюс жеста во всех 27
комбинациях; каждый клип × все внешности/стадии не проверялся. Owner art review
новых поз и анимаций принят 2026-09-28. Физический Android, performance/FPS,
signed/offline release, spoken TalkBack и Sprint10 acceptance не проводились.
Задача S8-003 остаётся открытой по инженерным QA и внешним gates.
Художественное принятие не означает полного runtime/device PASS.
Коммит, push и PR не выполнялись.

## Завершение среды

Временный transition_animation_scale восстановлен в исходный 0, добавленные
adb reverse 8081/8083 сняты, Metro и запущенный для QA AVD остановлены.
`git diff --exit-code -- App.tsx` — PASS, production entry без изменений.
Накопленный вывод Metro при остановке содержит TypeError: undefined is not
 a function из сессии итераций без привязки к финальному checkpoint. Поэтому
clean-console gate не заявляется; финальные PNG/видео подтверждают отображение
проверенных сценариев, но не отсутствие всех runtime ошибок за всю сессию.


## Приоритеты после owner acceptance

### Обязательно до инженерного закрытия S8-003

1. Чистый native запуск финальной версии с сохранением Metro/logcat stack,
   сценария и build ID. Атрибутировать `TypeError: undefined is not a function`:
   исправить, если воспроизводится; иначе документировать точный повтор без
   ошибки. Сейчас причина неизвестна; по одному сообщению безопасного исправления
   нет. Старые накопленные строки не доказывают дефект именно финальной версии.
2. На финальной версии записать loop, rapid taps/ограниченную очередь,
   прерывание декорации результатом, modal cancel с завершением callback,
   background/return, skip goal И stage, motion off/system reduced motion.
   Проверить неизменность сохранённого результата и отсутствие replay. Нынешний
   modal screenshot не доказывает callback idle, skip проверен только для goal.
3. Закрыть риск head/neck/prop на трёх формах и stage1/stage3: прежде всего
   AN-006/009/010 и рост AN-014. Обновить таблицу clip × appearance × stage
   с PASS/NOT RUN; повторить полный clip sweep после финального neck overlap.
   Существующие 27 gesture checkpoints остаются валидным evidence жеста.
   Полный Cartesian sweep каждого клипа во всех 27 комбинациях не требуется
   автоматически: расширять только при выявленном различии или дефекте.

### Обязательные внешние gates перед полным PASS / выпуском

- Physical API26 Android от 3 ГБ и видео на целевом устройстве; cold start,
  decode/cache, dropped frames, память/нагрев, stress15min, navigation×20,
  background×10 по S10-001. DEC-005 позволяет закончить engineering/art этап
  раньше, но не позволяет выдать emulator за physical PASS.
- Настоящий TalkBack: фокус/озвучивание, кнопки касания и skip, отсутствие
  декоративного шума; 360dp и font100/150/200%, reduced motion на устройстве.
- Signed/offline release, lifecycle/process-kill/asset-error recovery,
  затем S10-002 внешняя приёмка. Эти пункты не закрыты данным art acceptance.

### Опционально

Дополнительный polish easing/таймингов, новые декоративные варианты, звуки
с provenance и playback QA, расширенная матрица всех clip×27 сочетаний.
Для принятого визуального результата новый пакет рисунков не требуется.

### Изменения этого продолжения

Owner art status синхронизирован в manifest, README, контракте, CURRENT_IMPLEMENTATION,
TASKS/S8-003 и диаграмме. Экспорт сверяет принятие с точными source/export hashes:
изменённые байты снова получают pending status. Pixels и runtime UI не менялись;
новый UI/device прогон не проводился. IMPLEMENTATION_DECISIONS не меняется:
это приёмка evidence в существующем scope, не новое архитектурное решение.

Verify продолжения после приёмки:

- `python scripts/export-puppet-groups.py` — PASS, 54 группы, исходные RGBA
  сохранены; hash tests подтверждают совпадение жестов с принятой записью.
- `node --test tests/finni-puppet-assets.test.mjs tests/finni-body-motion.test.mjs tests/finni-animation-set.test.mjs` — PASS, 11/11 (acceptance-verify.txt).
- `git diff --check` — PASS.
- Полный npm run verify (154 tests) — PASS в предыдущем этапе; в этом
  документационном продолжении повторно не запускался. Native QA не повторялся.
