# S8-001: Изготовить Финни — layered 2D master, стадии, варианты и мимика

## Цель
Создать производственный layered 2D master-пакет Финни для трёх стадий и
девяти внешностей без изменения доменных идентификаторов и логики роста.

## Контекст
Требуется один узнаваемый персонаж с совместимым layer/anchor contract.
Комбинации 3 стадии × 3 формы × 3 узора работают без 27 несвязанных рисунков.

## Состав работ
- изготовить editable layered master, neutral/blink/expression states и exports;
- подготовить стадии 1/2/3, `round|pointy|floppy` и `plain|spots|stripes`;
- сохранить стабильные canvas, layer names, pivots, scale и attachment anchors;
- обновить live preview с save/cancel без пересоздания профиля;
- сформировать character sheets и визуальную матрицу 27 сочетаний;
- зарегистрировать версии, hashes, rights и export instructions.

## Источники
- DEC-2026-09-19-006/007, `Finni_S7-002_2D_POC`, `REF-001`;
- историческое 3D-дополнение §4; PET-001–007, TECH-005–007, QA-007;
- VR-005; `asset-manifest.json`;
- SRS v1.3 §8 и профильные контракты.

## Критерии приёмки
- все 27 сочетаний различимы, не дают halo/seams и не ломают layer alignment;
- стадии сохраняют узнаваемость, layer contract и attachment anchors;
- domain IDs и формула роста не изменены;
- save/cancel/restart сохраняют ожидаемый профиль;
- editable layered source и deterministic export входят в поставку.

## Зависимости
- S7-004 PASS, S7-005 PASS, Accepted DEC-2026-09-19-007 и S7-006.

## Verify
- automated image/layer/import validation;
- visual matrix 27 сочетаний во всех базовых позах;
- profile preview/save/cancel/restart tests;
- manifest/hash/license review.

## Out of scope
- новая формула роста и четвёртая стадия;
- новые domain IDs или случайная внешность;
- отдельная несовместимая layer topology для каждого узора.


## Прогресс 2026-09-23

Задача начата в ветке `S8-001/finny-variants-stages-rig`. Зафиксирован
`FINNI-S8-001 layer contract v1` (941×1672, порядок слоёв, якоря,
стадии и expression IDs). Home читает сохранённую стадию и масштабирует
принятый S7-004 master вокруг якоря лап. Существующий редактор профиля
сохраняет и отменяет `shapeId/patternId` без пересоздания профиля.

Полный набор новых девяти внешностей × трёх стадий и отдельных слоёв мимики
ещё не изготовлен. Accepted master по-прежнему покрывает одну внешность;
контракт и scaling не считаются художественной приёмкой 27 сочетаний.
После получения исходного PNG выполнены четыре variant-generation пробы.
`Finni App/artifacts/sprint-8/S8-001-candidates/QA.md` фиксирует,
почему их нельзя включить в production: identity drift, неверный canvas,
нарушенное выравнивание и alpha noise. Принятый master не заменён.

Промежуточный результат запушен и включён в `dev` merge-коммитом `b49a52c`;
задача остаётся открытой до полной приёмки.

## Пробный слойный исходник 2026-09-23

В Finni App/artifacts/sprint-8/S8-001-layer-prototype/ подготовлен отдельный
OpenRaster-образец нейтрального Финни из exact-hash S7-004 PNG. Хвост, корпус,
уши, лицо и ошейник разделены; пустые слои узора и мимики сохраняют topology
контракта. Сборка даёт 0 отличающихся видимых пикселей от принятого neutral,
показывает масштабы трёх стадий и не меняет runtime assets.

Образец не является готовым rig: под вырезанными деталями отсутствуют закрытые
пиксели шерсти. Художественная дорисовка форм, узоров и выражений, проверка
матрицы 27 сочетаний и art verdict остаются открытыми.
2026-09-23: первый вариант вырезов отклонён пользователем как
неаккуратный. Контуры всех видимых частей переразмечены по исходному PNG;
создан `review/contour-audit.png` для художественной проверки. Точное
совпадение нейтральной сборки сохраняется, но послойный исходник S7-004
содержит лишь плоские neutral/blink и room. Скрытые поверхности, варианты
внешности и сменную мимику из него получить автоматически нельзя. Новая
разделение видимых слоёв принято пользователем 2026-09-23; художественная
приёмка новых внешностей и мимики остаётся открытой. Runtime не изменён.

## Первый вариант внешности — 2026-09-23

Из принятого послойного neutral изготовлен редактируемый кандидат
pointy/spots: отдельный слой узора, локальная скрытая шерсть под основанием
ушей, ORA, PNG для сравнения и просмотр трёх масштабов вокруг якоря лап.
Исходный accepted master и runtime не заменены. Скрипт и точные SHA-256
находятся в Finni App/artifacts/sprint-8/S8-001-first-variant.
Проверено: холст 941×1672 и origin (0,0) у всех 9 слоёв; отличающихся
пикселей вне корпуса и скрытого стыка ушей — 0. Пробная форма round с
жёстким срезом уха была отклонена до передачи на приёмку. Художественная
приёмка pointy/spots и скрытой анатомии для будущих форм ушей открыта.

Замечание владельца к pointy/spots: первая проба выглядела как пятно,
наложенное одновременно на заднюю и переднюю лапы. Редакция 2 переносит
пятна на верхнюю часть корпуса, берёт цвет из исходной шерсти и вводит
машинную проверку нуля пикселей узора на защищённых лапах. Исправленный
вариант передан на повторный художественный просмотр; приёмки пока нет.


## Пересмотр подхода к узору — 2026-09-25

Владелец отклонил и редакцию 2: перенос пятен на плечи ухудшил впечатление.
Обе пробы pointy/spots считаются отклонёнными, а не ожидающими приёмки.
Анализ и наглядное переключение принятого рисунка/слоя корпуса находятся в
`Finni App/artifacts/sprint-8/S8-001-pattern-rethink/review.html`.

Причина: pet-body объединяет передние и задние лапы; alpha слоя не кодирует
их взаимное перекрытие. Следующая предлагаемая проба — крап, отрисованный
в шерсти каждого заднего бедра, с отдельными анатомическими масками в
editable source и запеканием в существующие экспортные слои. Альтернатива —
более крупные естественные участки окраса. Общая смена цвета не покрывает
требование SRS о трёх рисунках. Эти варианты ещё не приняты.

Две попытки встроенного imagegen остановились до генерации из-за сбоя
Windows sandbox helper при чтении исходника. Новая raster/ORA-проба не
создана; полный prompt и ограничения записаны в пакете разбора. Повторная
сборка принятого neutral дала 0 отличающихся видимых пикселей; SHA-256
S7-004 master неизменен. Runtime, публичные ID и S8-002 не изменялись.
Новые варианты, 27 exports, скрытая анатомия и мимика остаются открытыми.

### 2026-09-25 — успешные пробы через вложение

После прикрепления принятого PNG пользователем Image Gen создал две пробы
крапа на задних бёдрах. Они находятся в
`Finni App/artifacts/sprint-8/S8-001-pattern-rethink/rear-thigh-trial-v1/`.
Передние лапы корректно перекрывают крап; v1 имеет эффект грязных завитков,
v2 рисует более раздельные пятна, но заметно меняет лицо и масштаб персонажа.
Обе пробы не подходят как точная замена master. Layered production asset не
создан; точный перенос окраса требует локальных областей тела и сборки с
принятыми защищёнными слоями. QA и измерения alpha/canvas сохранены рядом.
Runtime, master и статус незавершённой S8-001 сохранены.

### 2026-09-25 — анатомические части и управляемый кандидат на четырёх лапках

По запросу владельца корпус lossless-разделён на две задние лапки, две передние,
грудь и остаток корпуса. В новом ORA каждая часть содержит base/pattern.
Image Gen создал отдельные отметины; после технической регистрации получен
кандидат с тремя небольшими пятнами на каждой лапке. Грудь оставлена светлой.
Пакет: `Finni App/artifacts/sprint-8/S8-001-anatomy-spots-v1/`.

Verify: neutral-сборка 0 pixel diff; вне четырёх разрешённых областей 0 изменений;
восемь защищённых PNG побайтово сохранены. Оба ORA и 9 экспортов прошли независимую
проверку структуры, размеров и обратной сборки. Художественный кандидат показан
крупно и в статическом Home. Приёмка, скрытая анатомия и остальные состояния
остаются открытыми; master/runtime не изменены.

### 2026-09-25 — выразительный spotted-кандидат v2

Владелец отклонил мелкие веснушки v1 как недостаточно самостоятельную внешность.
Проверены нормативное ТЗ §§2.5.2, 2.6, 8.1, 8.3 и SRS §8.1/FR-03/TC-003:
минимум 9 визуально различимых комбинаций, проектная матрица 3 формы × 3 рисунка.
Оценка одного кандидата не подтверждает конкурсное соответствие всей матрицы.

`S8-001-anatomy-spots-v2` содержит новый Image Gen окрас с крупными и меньшими
каштановыми пятнами на плечах и четырёх лапках. Художественная шерсть перенесена
через исходные матты; лицо, уши, хвост, грудка и альфа-силуэт сохранены точно.
ORA и девять экспортов проверены независимо; 0 изменений за разрешёнными
маттами, 0 alpha-разницы, восемь защищённых PNG совпадают побайтово.
Plain/Home/три стадии визуально осмотрены. V2 — новый art-review кандидат,
не production; приёмка, другие внешности и скрытая анатомия остаются открыты.

### 2026-09-25 — интеграция принятого expressive spotted v2

Владелец принял v2 и разрешил включение. Подключена пара pointy/spots: production neutral/blink, constructor preview, девять исходных слоёв и ORA. Исходный master сохранён. Configured Verify PASS (131 tests), pixel/hash/export проверки PASS. Runtime visual gate BLOCKED на старом debug APK API26; подробности и сценарии повторения в `Finni App/artifacts/sprint-8/S8-001-spots-runtime/QA.md`.

S8-001 остаётся in progress: лишь pointy/plain и pointy/spots имеют принятые production изображения; семь комбинаций, полный runtime/device gate и остальные критерии задачи не закрыты. DEC-2026-09-25-011 фиксирует ограниченный scope приёмки.


### 2026-09-25 — runtime-блокер снят после clean debug install

Предыдущий BLOCKED выше является историческим результатом. Текущий native debug assemble (JDK17, x86_64) и clean install на API26 прошли. Persisted localhost Metro preference исправила cold launch. Constructor/Home plain и spots, сохранение pointy/spots после force-stop/start — PASS. Найден и исправлен первый пустой blink-кадр: два заранее смонтированных изображения, onLoad gate и opacity переключение. Real cold-start recording подтверждает непрерывность. Configured Verify PASS: 132 tests, lint/typecheck/content/fixtures; diff check PASS. QA и изображения: `Finni App/artifacts/sprint-8/S8-001-spots-runtime/QA.md`. Release/offline/physical-device/performance не проверялись; S8-001 остаётся in progress из-за остальных семи внешностей и прочих открытых критериев.

### 2026-09-25 — все девять внешностей подключены

По прямому запросу владельца завершена матрица `pointy|round|floppy × plain|spots|stripes`. Новый `FINNI-MATRIX-V1` содержит 18 neutral/blink, 9 editable ORA и 162 full-canvas export PNG. Семь новых вариантов созданы из трёх Image Gen компонентов (round ears, floppy ears, stripes), механически собранных с принятым исходником. Идентификаторы/SQLite/формула роста сохранены; прежние pointy/plain и pointy/spots пиксельно совпадают. Production renderer и конструктор теперь разрешают все9, без master fallback для валидных комбинаций. Декодирование neutral/blink по прежнему preload+opacity контракту.

Configured Verify PASS: lint/typecheck, 132 tests, content/fixtures, diff check. Independent image/ORA Verify PASS: exact reconstruction18frames, 9 уникальныхneutral, глаза/мордочка/стопы/хвост исходные. Визуально осмотрены matrix9, matrix27, blink9 и все9 реальных Home. API26 debug+Metro UI sweep9/9, save/cancel/cold persistence и recorded floppy/stripes blink PASS. Источники, prompts, hashes, отчёты: `Finni App/artifacts/sprint-8/S8-001-matrix-v1/README.md`; основные previews `review/matrix-nine.jpg`, `review/matrix-27.jpg`, `runtime/nine-home-review.jpg`.

Семь новых художественных вариантов имеют статус implemented-for-owner-review; автоматический Verify не является художественной приёмкой. Фраза «семь отсутствуют» в предыдущих записях теперь историческая. S8-001 остаётся in progress: отдельные happy/thoughtful/inspired states и оставшиеся критерии полной задачи не закрыты этим запросом. На устройстве проверена стадия1; стадии2/3 — image/transform validation. Release/offline, physical-device и memory/performance gate остаются открытыми.

### 2026-09-25 — посадка round/floppy исправлена, ear-fit-v2

Владелец принял весь pointy-ряд и окрасы тела всех рядов; замечания касались посадки round/floppy. Исправлены независимые root translations, маски ушных складок без донорской брови, исходная шерсть под корнями и alpha occlusion. Runtime mapping/canvas/anchors не менялись. Все66 файлов pointy×3, включая ORA, byte-identical предыдущей версии; принятые body patterns сохранены. Укреплённый independent Verify подтверждает0diff глаз/мордочки/чёлки/брови, exact ORA/export reconstruction. Configured Verify132tests PASS; focused8/8 PASS; API26 UI sweep6/6, cancel/cold persistence и recorded round/floppy blink PASS.

Production package FINNI-MATRIX-V1 revision=ear-fit-v2. Итог: `Finni App/artifacts/sprint-8/S8-001-matrix-v2/QA.md`; визуальное сравнение `review/ear-fit-before-after.jpg`, `review/ear-fit-blink-before-after.jpg`; реальные Home `runtime/six-home-review.jpg`. Исправленные уши остаются pending-owner-review: художественная приёмка не присвоена автоматически. S8-001 в целом остаётся in progress, release/physical/performance scope не расширен.


### 2026-09-25 — локальная коррекция швов ушей, ear-seams-v3

После аннотации пользователя v2 доработан: сглажены искусственные matte-срезы, заменён обрубленный старый корень готовой донорской шерстью, сохранены исходные глаза/ресница/бровь/центр чёлки. Production FINNI-MATRIX-V1 revision=ear-seams-v3; pointy66файлов byte-identical, body coats0diff. Independent image/ORA Verify PASS; configured132tests PASS; final appearance3tests PASS; API26 Home6/6, Cancel/cold persistence и round/floppy blink PASS. QA и v2→v3 сравнение: `Finni App/artifacts/sprint-8/S8-001-matrix-v3/QA.md`, `review/ear-fit-before-after.jpg`, `review/four-seams-200pct.jpg`. Исправленные уши pending-owner-review; S8-001 остаётся in progress. Архитектура и topology диаграммы прежние.


### 2026-09-25 — художественная матрица 3×3 принята

Владелец явно подтвердил: «Принимаю, всё устраивает. что дальше?». Все девять внешностей, включая round/floppy ear-seams-v3, художественно приняты. Gate внешностей закрыт; accepted frame/ORA hashes и scope закреплены в `Finni App/artifacts/sprint-8/S8-001-matrix-v3/acceptance.json`, production manifest помечает 9/9 owner-accepted. Пиксели/экспорты/runtime code не менялись.

Фактический остаток S8-001: изготовить и принять отдельные happy/thoughtful/inspired состояния (neutral и blink уже есть); проверить совместимость лиц со всеми9внешностями и3стадиями, якоря/силуэт и сцену во всех базовых позах. Сейчас стадии2/3 имеют статическую image/transform-проверку; устройство в последнем пакете проверено на стадии1. После готовых expressions — совместная интеграционная проверка переходов/static equivalents с S8-003; отдельная актуальная сборка без Metro и финальная проверка на устройстве по принятому gate S10. Физическое performance подтверждение не требуется выдумывать как завершённое сейчас. S8-001 остаётся in progress; новый большой этап этим ответом не начат.

Источники: нормативное ТЗ §2.6 (9 комбинаций, 3 стадии), SRS §8.1 (calm/happy/thoughtful/inspired), S8-001 layer contract и S8-003. Следующий приоритет — три выражения лица с сохранением принятой матрицы; renderer/economy/IDs не меняются без отдельной необходимости.


### Progress 2026-09-25 — expressions-v1

По запросу владельца созданы happy/thoughtful/inspired для всех девяти принятых внешностей. Отдельный production-пакет `FINNI-EXPRESSIONS-V1` содержит 27 full-canvas кадров, 243 экспортных слоя и 9 ORA. Исходные neutral/blink и принятые хеши `FINNI-MATRIX-V1` сохранены. Три Image Gen исходника и воспроизводимая сборка сохранены в `Finni App/artifacts/sprint-8/S8-001-expressions-v1`.

Independent Verify PASS: 27 точных реконструкций из слоёв, ORA, 27 сочетаний внешности и стадии, 81 статический рендер, feet anchor `(470,1272)`, границы силуэта и локальность изменений лица. Визуально осмотрены 27 выражений и крайние стадии. Configured Verify PASS: lint/typecheck, 133 tests, content/fixtures; focused production-package test PASS. Новая мимика зарегистрирована для последующей интеграции, но Home продолжает neutral/blink. Художественный статус новых состояний — pending-owner-review. S8-001 остаётся in progress: интеграция переходов/static equivalents с S8-003, runtime/device и release/performance gates не закрыты.


### Progress 2026-09-25 — inspired различим на обзорном листе

По замечанию владельца заменён слишком похожий на happy вариант inspired. У нового состояния взгляд заметно поднят и рот раскрыт шире во всех девяти внешностях. Предыдущий донор сохранён в `rejected/` для аудита. Повторный independent Verify PASS: 27 кадров, 243 слоя, 9 ORA, 27 сочетаний внешности и стадии, 81 рендер и порог различимости happy/inspired для 9/9. Configured Verify PASS: 133/133 теста, lint/typecheck/content/fixtures; художественная приёмка выражений и runtime-интеграция всё ещё открыты.


### Progress 2026-09-25 — художественная мимика принята

Владелец явно принял все вариации после коррекции inspired. `Finni App/artifacts/sprint-8/S8-001-expressions-v1/acceptance.json` закрепляет точные хеши 27 happy/thoughtful/inspired кадров, 9 ORA и обзорного листа. Production manifest выставляет owner-accepted для 9/9 при совпадении с записью; исходные neutral/blink и принятие девяти внешностей сохранены. Художественный gate новых выражений закрыт, но S8-001 остаётся in progress: Home ещё не проигрывает новые состояния, переходы/static equivalents S8-003, визуальная матрица базовых поз, Android/device, release/offline и performance gates остаются открытыми.

### 2026-09-25 — runtime мимика и Android-матрица

Принятые happy/thoughtful/inspired подключены к событиям Home; deposit использует inspired по SRS и явному выбору владельца. Переход после загрузки изображения, возврат calm, reduced motion, skip и cancel пройдены на API 26 debug+Metro. Home 9×3 подтверждён 27 повторными cold-start снимками с проверкой отрисовки; видео и протокол: `Finni App/artifacts/sprint-8/S8-001-expression-runtime/QA.md`. Физический Android пока недоступен и по сообщению владельца сейчас не блокирует работу. Signed/offline и S10 performance/visual acceptance остаются открытыми; задачу целиком не закрываем.
