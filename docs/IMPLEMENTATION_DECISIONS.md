# ЛЦТ 2026 — реестр решений реализации

Accepted-решение имеет приоритет над исходной документацией только в явно
указанном scope. Решение без статуса `Accepted` не является source of truth.

## Статусы

- `Proposed` — обсуждается;
- `Accepted` — принято;
- `Superseded` — заменено более новым решением;
- `Rejected` — отклонено.

## Процесс

Добавляйте запись, когда docs неоднозначны, реализация требует осознанного
отклонения либо меняется публичный контракт, данные, workflow или архитектура.

## Шаблон

```md
## DEC-YYYY-MM-DD-NNN — Название

- Status: Proposed | Accepted | Superseded | Rejected
- Scope: подсистема или контракт
- Original docs: файл и раздел
- Related tasks: ID

### Контекст

### Решение

### Последствия

### Verify
```

## DEC-2026-09-16-001 — Идентичность Android-релиза и границы M1

- Status: Accepted
- Scope: Android package, release ownership, M1 scope и внешние проверки
- Original docs: `ТЗ_Департамент финансов города Москвы.pdf`, §§7.1–7.2,
  8.1–8.4; `Finni_SRS_v1.3_2026-09-16.md`, §§20.1, 20.7, 21.1–21.4,
  22.4, 22.9, 23–24
- Related tasks: S0-004, S0-005, S4-004, S4-006

### Контекст

Команда выступает под названием Better Together, а исходный Git-репозиторий
принадлежит аккаунту `meshnavigator` и находится только в каталоге `Finni App`.
Для Android требуется один неизменяемый package identifier и назначенный
владелец ключа подписи. Пользователь подтвердил доступность физического
Android-устройства и методического проверяющего.

### Решение

- display name команды: `Better Together`;
- teamSlug: `better-together`;
- applicationId: `com.meshnavigator.finni`;
- владелец release-ключа и его резервной копии: владелец проекта;
- ключ, пароли и иные секреты хранятся вне Git;
- Git остаётся только внутри `Finni App`; корень governance не превращается в
  Git-репозиторий и `.git` не переносится;
- целевой объём M1 — M1-T; M1-B допускается только как явно утверждённое
  аварийное сокращение и не считается равнозначным выполнением обязательного
  объёма;
- интерактивный прототип с видео является допустимым форматом fallback по
  §7.1, но не заменяет evidence установки и запуска APK;
- физическое устройство и методический проверяющий доступны. Модель/версия
  Android/ОЗУ устройства, личность и компетенции проверяющего, версия сборки,
  наблюдения и повторная проверка фиксируются только при фактическом прогоне.

### Последствия

S0-005 использует `com.meshnavigator.finni` и не генерирует новый package ID.
Release-ключ не создаётся и не коммитится без отдельного безопасного процесса.
Governance-документы и код приложения не образуют единый Git change set:
коммиты и `git diff --check` для приложения выполняются из `Finni App`, а
изменения governance проверяются отдельно. Артефакты M1 после фиксации не
перезаписываются; внешний manifest связывает их с source commit и хешами.

### Verify

- решения applicationId, teamSlug, владельца ключа и доступности ресурсов
  подтверждены владельцем проекта 2026-09-16;
- scope сверен с SRS §24 и официальным ТЗ §§7.1–8.4;
- внешние GitHub-действия не выполнялись.

## DEC-2026-09-18-002 — Целевое 3D-направление Финни

- Status: Superseded in visual-medium, renderer and graphics-production scope
  by DEC-2026-09-19-006; retained for historical evidence and unaffected
  domain/catalog/accessibility constraints
- Scope: визуальный образ Финни, домашняя сцена, камера и этапность проверки
  3D-представления; rebaseline M1 без изменения экономики и идентификаторов
  каталога
- Original docs: `Finni_3D_Addendum_v1.0/Finni_3D_Visual_Animation_Addendum_v1.0.md`,
  §§1–15; `Finni_SRS_v1.3_2026-09-16.md`, §§2.2, 3.3, 11–12, 14.1
- Related tasks: S6-001–S6-002, S7-001–S7-002, S8-001–S8-003,
  S9-001–S9-004, S10-001–S10-002

### Контекст

SRS v1.3 проектировала постоянную двухмерную сцену и лёгкий набор 2D-ассетов.
Позднее пользователь передал дополнение с утверждённым художественным эталоном,
крупным полнофигурным Финни и настоящей 3D-комнатой. Само дополнение отделяет
утверждённое художественное направление от предлагаемых renderer, бюджетов,
компоновки и производственных деталей. В текущем workspace есть SRS v1.3,
которой не было в исходном архиве при подготовке дополнения.

### Решение

- включить в M1 настоящую 3D-сцену Home с одной комнатой, фиксированной камерой
  и полнофигурным Финни; это целевой visual scope, явно заменяющий только
  2D/2.5D-ограничение SRS;
- не менять экономику, локальное хранение, `shapeId`, `patternId`, стадии,
  каталог покупок/целей, доступность и обязательные функции;
- не считать суммы, велосипед, процент, подписи и схему кнопок эталона данными;
- выбрать renderer, native-версии, GLB pipeline, способ пушистости и числовые
  бюджеты только после S7-001/S7-002 и аппаратных измерений;
- перепланировать Sprint 6–10 под M1, сохраняя прежние M1-артефакты неизменными:
  новые APK, manifests, evidence и иные поставки получают отдельные версии и не
  перезаписывают уже зафиксированные файлы.

### Последствия

Это явный schedule/high-risk rebaseline владельца проекта: M1 считается целевым
release target для 3D, хотя renderer, производительность и стоимость
производства ещё не подтверждены. S6-002 разрешена к выполнению. Последовательный gate `S6-002 → Sprint 7` заменён DEC-2026-09-18-004:
S7-001 разрешено начать параллельно на принятом ordinary-layout. Физический
Android API 26 остаётся обязательным gate итогового PASS S7-001; renderer и
числовые бюджеты принимаются только по результатам S7 spikes. Существующие Sprint 0–5, экономика и catalog IDs не переписываются.
`asset-manifest.json` остаётся реестром будущих поставок, а отсутствующие
реализованные каталоги продолжают блокировать их индивидуальные assets.

### Verify

- владелец проекта 2026-09-18 выбрал M1 как release target для 3D;
- конфликт 2D/3D разрешён в visual scope без изменения экономики и catalog IDs;
- S6-001 сохраняет gates реализованных каталогов и владельцев поставок;
- production assets, renderer и измеренные бюджеты не объявлены готовыми;
- внешние GitHub-действия не выполнялись: `repository` пуст.

### S6-001 decision package (2026-09-18)

Владелец проекта выбрал M1 и принял связанный риск сроков. Решение снимает gate
с S6-002, но не доказывает готовность renderer, asset pipeline или каталогов.
S7-001/S7-002 должны подтвердить renderer, бюджеты и художественное качество до
массового производства. Art, engineering и QA/device owners ещё не назначены;
это явный риск поставки. Подробности и каталог блокеров:
`Finni_3D_Addendum_v1.0/S6-001_TRACEABILITY.md`.

## DEC-2026-09-18-003 — Проектные SRS-данные в дизайн-макетах

- Status: Superseded by DEC-2026-09-18-004
- Scope: дизайн-макеты Home/HUD до появления реализованных каталогов
- Original docs: `Finni_SRS_v1.3_2026-09-16.md`, §§7.5, 11 и TC-132;
  `ТЗ_Департамент финансов города Москвы.pdf`, §2.5.3
- Related tasks: S6-002

### Контекст

Текущий READY runtime доказывает только пустой Home с временными строками. Для
проверки заполненной композиции нужны уже утверждённые продуктовые названия и
суммы, хотя каталоги `GL-*` и `LS-*` ещё не реализованы. Выдумывать fixture или
выдавать SRS за runtime запрещено.

### Предлагаемое решение

Разрешить в дизайн-макетах подтверждённый контент SRS при одновременном
выполнении трёх условий: каждый такой макет постоянно помечен `DESIGN DATA —
NOT IMPLEMENTED`; рядом указаны точные SRS ID/сценарий; данные не используются
как evidence реализации, QA PASS или основание для производства catalog assets.

### Последствия

V3 S6-002 может проверять ACTIVE на GL-01 «Воздушный змей»/150, LS-P02
«Покупки / детектив предложений» и TC-132 (стартовый B=100), не меняя runtime.
До перевода решения в Accepted эта policy не является source of truth и требует
отдельного подтверждения владельца.

### Verify

- строки и числа сверены с SRS §§7.5, 11 и TC-132;
- polished SVG и матрица имеют постоянную маркировку design-only;
- `QA-005`/`QA-006` остаются NOT RUN;
- исключение из одновременной видимости ТЗ §2.5.3 не принято.

## DEC-2026-09-18-004 — Композиционный baseline Home и параллельный старт 3D spike

- Status: Accepted
- Scope: Home composition baseline, design-fixture evidence, projected
  safe-frustum и зависимость S6-002/S7-001
- Original docs: `ТЗ_Департамент финансов города Москвы.pdf`, §2.5.3 и §3.6;
  `Finni_SRS_v1.3_2026-09-16.md`, §§6.2, 9, 11–12;
  `Finni_3D_Addendum_v1.0/Finni_3D_Visual_Animation_Addendum_v1.0.md`, §§2–6,
  10–12
- Related tasks: S6-002, S7-001, S7-002

### Контекст

V4.2 впервые подтверждает устойчивую ordinary-композицию: комната занимает
экран, Финни остаётся центральным объектом, HUD расположен сверху, справа и
снизу. Полное закрытие S6-002 требует ещё responsive, lifecycle, accessibility
и Android evidence. Ожидание полного закрытия откладывало наиболее рискованный
renderer/native spike для M1.

### Решение

- принять V4.2 как композиционный baseline только для `390×844/100%` и
  `360×640/100%`; общую геометрию не перерабатывать без нового блокера;
- оставить S6-002 в работе и продолжать проверку 412×915, 150%/200%,
  READY/DRAFT/ACTIVE/CLOSED/WAITING и onboarding/loading/error;
- считать двойной PNG cover+contain временной review-only техникой, а не
  дизайном сцены, clean plate, asset, renderer или runtime evidence;
- маркировать SRS fixtures как
  `DESIGN FIXTURE FROM SRS — NOT RUNTIME EVIDENCE`;
- считать `.scene-space` projected safe-zone, а не доказанными bounds модели:
  для `390×844/100%` — `234×476 CSS px`, для `360×640/100%` —
  `210×308 CSS px`; camera и крайние animation bounds проверяются в S7;
- не считать CDP `48 CSS px` доказательством Android `48 dp`;
- сохранить 200% как документированный конфликт §2.5.3, без QA PASS;
- разрешить старт S7-001 параллельно с открытой S6-002;
- оставить физический API 26 обязательным gate итогового PASS S7-001, но не
  gate начала renderer/native работы; S7-002 по-прежнему ждёт S7-001 PASS.

### Последствия

S7-001 может проверять renderer, local GLB, overlay и native build boundary на
отдельной task-ветке. S6-002 не закрывается и не становится runtime evidence.
S7-002 и массовое производство Sprint 8 не разблокируются. 150%/200% и
projected safe-zone могут породить точечные responsive или camera blockers,
но не возвращают ordinary-layout к полной переработке без нового доказанного
дефекта.

### Verify

- пользователь 2026-09-18 принял V4.2 ordinary Home как baseline и явно
  распорядился начать 3D engineering параллельно;
- точные CDP captures существуют для 360×640, 390×844 и 412×915 при
  100%/150%/200%, а также lifecycle/shell fixtures;
- `360×640/150%` не объявлен PASS: projected safe-zone недостаточен;
- `QA-005`/`QA-006`, Android `48 dp`, TalkBack, system safe areas и API 26
  остаются NOT RUN;
- ветка S7-001 создаётся от актуального `dev`; внешние issue/PR не изменяются.

## DEC-2026-09-18-005 — Отложить аппаратный gate без подмены evidence

- Status: Accepted
- Scope: порядок закрытия S6-002/S7-001, старт S7-002 и device/runtime evidence
- Original docs: `ТЗ_Департамент финансов города Москвы.pdf`, §§2.5.3, 3.6;
  `Finni_SRS_v1.3_2026-09-16.md`, §§14, 17–18;
  `Finni_3D_Addendum_v1.0/Finni_3D_Visual_Animation_Addendum_v1.0.md`,
  §§10–14
- Related tasks: S0-006, S6-002, S7-001, S7-002, S7-003, S10-001, S10-002

### Контекст

Пользователь явно решил пропустить физическое устройство на текущем этапе и
считать его неблокирующим. При этом source/build evidence нельзя выдавать за
device evidence, а обязательные аппаратные проверки релиза должны сохраниться
до финальной приёмки.

Non-device работа выявила две независимые границы: S6-002 реализована, но
`360×640/200%` остаётся review conflict; S7-001 проходит source Verify и clean
debug build, но signed release блокирует незаявленная Babel-зависимость
Worklets Core. S7-002 не имеет production art slice и назначенных владельцев.

### Решение

- не требовать физический API 26 для завершения текущего engineering/art
  этапа; сохранить его в S0-006, S10-001 и S10-002;
- закрыть S6-002 и S7-001 как `partial`, сохранив непройденные критерии и
  явные follow-up tasks;
- не считать device/runtime, performance, TalkBack или system safe areas
  пройденными без фактического запуска;
- разрешить non-device подготовку S7-002 без S7-001 device PASS;
- считать S7-002 заблокированной отсутствующим production art slice,
  provenance и art/technical owners, а не устройством;
- вынести signed-release dependency blocker в S7-003;
- не присваивать Filament production/Accepted status до signed release и
  позднего аппаратного gate.

### Последствия

DEC-2026-09-18-005 заменяет только порядок device-gate из DEC-2026-09-18-004;
обычные требования качества и финальная аппаратная приёмка не отменяются.
Sprint 8 остаётся заблокирован до art PASS S7-002, устранения S7-003 и оценки
производства. Partial completion reports находятся в `tasks/sprint-6/done` и
`tasks/sprint-7/done`.

### Verify

- пользователь 2026-09-18 прямо указал, что устройство пока пропускается и
  не является блокирующим элементом;
- configured source Verify — PASS, 51 tests;
- clean debug native build — PASS;
- signed release — BLOCKED точной незаявленной Worklets Babel-зависимостью;
- device/runtime/performance — DEFERRED, не PASS;
- S7-002 inventory подтверждает отсутствие production art slice.

## DEC-2026-09-19-006 — Целевое layered 2D cutout / 2.5D-направление Финни

- Status: Accepted
- Scope: visual medium, renderer boundary, character/room production pipeline,
  Sprint 7–10 dependency graph
- Supersedes: DEC-2026-09-18-002 only in the scope above; DEC-2026-09-18-004
  remains the composition/HUD baseline where renderer-neutral, and
  DEC-2026-09-18-005 remains the evidence/device policy
- Detailed record: `DEC-2026-09-19-006_2d-cutout-target.md`
- Related tasks: S7-002–S7-006, S8-001–S8-003, S9-001–S9-004,
  S10-001–S10-002

### Контекст

R1–R4 подтвердили отдельные export/rig/GLB contracts, но не сохранили
узнаваемый образ `REF-001`. Layered 2D cutout POC сохраняет лицо, глаза,
шерсть, пропорции и характер существенно лучше и допускает deterministic
transforms, image swap, sprite animation и reduced-motion static states.

Пользователь 2026-09-19 явно принял: «принимаю 2D cutout/2.5D как целевой
подход». POC остаётся generated derivative и не получает production,
art/legal или runtime PASS автоматически.

### Решение

- целевое представление Финни — layered 2D cutout; 2.5D означает слои,
  параллакс и ограниченные transform/image-swap/sprite эффекты, а не
  обязательную native 3D-сцену;
- `REF-001` остаётся обязательным identity/art reference;
- economy-v2, persistence, `shapeId`, `patternId`, стадии, catalog IDs,
  presentation-after-commit, HUD, доступность и release lineage сохраняются;
- V4.2 остаётся renderer-neutral composition baseline;
- GLB, skeleton, root sliding, Filament и Worklets перестают быть production
  требованиями после принятия и проверки 2D runtime technology;
- `Finni_S7-002_2D_POC` используется только как comparative/diagnostic
  evidence до отдельных art/provenance и runtime/release gates;
- R1–R4, 3D addendum, reviews и partial reports сохраняются историей;
- конкретную runtime technology выбирает будущая DEC-2026-09-19-007 по
  результатам S7-005; до этого она Proposed/open;
- Sprint 6 и S7-001 не переписываются задним числом. S7-002 закрывается
  partial/superseded; S7-003 сохраняет blocker evidence; новый путь задают
  S7-004–S7-006 и переработанные Sprint 8–10.

### Последствия

S7-004 принимает art/provenance; S7-005 проверяет 2D runtime, lifecycle,
reduced motion и signed release. Только после S7-005 PASS и Accepted DEC-007
S7-006 удаляет Filament/Worklets/GLB diagnostic boundary. Sprint 8 ждёт art и
runtime gates; Sprint 9 сохраняет domain/application boundary; Sprint 10
измеряет decode/cache/memory/lifecycle и проводит независимые визуальную и
функциональную приёмки.

### Verify

- владелец явно принял направление 2026-09-19;
- POC содержит RGBA open/blink states, 12-frame idle sheet, previews,
  provenance и hashes, но не интеграцию;
- belief map отделяет production `AppRoot` от opt-in `HomeSceneSpike`;
- signed release, API 26, 27 сочетаний, стадии, полный animation set,
  art/legal acceptance и performance не объявлены PASS;
- внешние GitHub-действия не выполнялись: `repository` пуст.

## DEC-2026-09-19-007 — Технология layered 2D runtime

- Status: Accepted, 2026-09-21
- Scope: concrete React Native asset/render/animation implementation
- Detailed record: `DEC-2026-09-19-007_2d-runtime-technology.md`
- Related tasks: S7-005, S7-006, S9-001, S10-001

По evidence S7-005 принят dependency-free путь React Native 0.86.3 core
`Image`/`Animated`: локальные PNG-слои, deterministic transforms,
open/blink swap и sprite playback. Lifecycle/remount/modal/reduced-motion и
fallback gates, clean signed release и API 26 install/run без Metro прошли.
Production Home использует exact `FINNI-2D-MASTER-V1` hashes, принятые S7-004;
diagnostic S7-002 assets не получают production status.

Software-rendered API 26 AVD показал 409/409 janky frames, поэтому решение
принимает функциональную/release technology, но не объявляет physical-device
performance PASS. Финальные frame/memory/decode budgets остаются gate S10.
S7-006 удалила Filament/Worklets/GLB boundary и подтвердила новый clean signed
release; historical evidence осталось вне current app runtime.

## DEC-2026-09-21-008 — Sprint 2 persistence, runtime control и recovery

- Status: Accepted, 2026-09-21
- Scope: покупки, накопления, закрытие периода, единая очередь repositories,
  production mode/admin control и crash-safe recovery.
- Решение: финансовые команды фиксируют receipt и проекции атомарно; все
  repositories одного runtime разделяют `RepositoryExecutor`; control-plane
  хранится отдельно в `finni-control.db` и восстанавливает pending intent до
  открытия game DB.
- Adult-доступ является memory-only capability с обязательным relock; reset и
  delete работают только с фиксированным набором normal/demo database files.
- Automated verification принята как PASS, а обязательные Android/device gates
  вынесены в S2-006 и не считаются пройденными.
- Detailed record:
  `DEC-2026-09-21-008_sprint2-runtime-control.md`.

## DEC-2026-09-22-009 — Emulator acceptance Sprint 2 и physical-device gate

- Status: Accepted, 2026-09-22
- Scope: S2-006 и разделение emulator/device evidence.
- Решение: signed API 26 AVD acceptance закрывает Sprint 2; физическое
  устройство, OEM behavior и performance остаются обязательным gate Sprint 10.
- Emulator evidence не объявляется physical-device PASS.
- Detailed record:
  `DEC-2026-09-22-009_s2-emulator-acceptance.md`.

## DEC-2026-09-22-010 — Состояния занятия и атомарная дневная награда

- Status: Accepted, 2026-09-22
- Scope: S3 lesson engine, attempt/evaluation/completion persistence и
  LESSON_REWARD
- Original docs: Finni_SRS_v1.3_2026-09-16.md, §§4.4, 4.6, 5.3, 7.6–7.7,
  13.1, 13.11–13.12; TC-108–115
- Related tasks: S3-001–S3-004

### Контекст

Учебные суммы должны быть изолированы от игрового кошелька, а допустимый
неудачный исход должен завершаться только после разбора. Одновременно несколько
уроков и replay команды не должны выдавать более одной награды 20 за период.
Старый evaluation нельзя завершить после изменения ответа, а обновление
контент-пакета не должно менять параметры уже начатой попытки.

### Решение

- attempt проходит draft → evaluated → explanation_seen → completed; invalid
  input не завершается, needs_review сохраняется как reviewed;
- attempt закрепляет contentVersion, variantId, mechanic, parameters и hints;
- evaluator и renderer выбираются registry по mechanic, без исполняемого кода
  в контенте и без изменения основной навигации;
- eligibility награды фиксируется при Start, но ACTIVE состояния периода
  повторно проверяется внутри Complete;
- completion, receipt, audit и допустимая LESSON_REWARD с ledger/wallet/revision
  записываются одной BEGIN IMMEDIATE транзакцией;
- DRAFT/WAITING/CLOSED и завершение после закрытия периода сохраняют учебный
  результат без финансового эффекта.

### Последствия

Schema v6 добавляет lesson_attempt, lesson_evaluation и lesson_completion.
Единственная денежная квота по-прежнему защищена partial UNIQUE индексом
ledger_entry. Конкретные шесть основных занятий, schemaVersion 3 content bundle,
manifest и validator остаются отдельными S3-002–S3-004.

### Verify

- unit/domain tests проверяют state machine, hints, reviewed и invalid outcomes;
- file-backed SQLite tests проверяют 8 completions/1 reward, concurrency,
  restart, pinned snapshot, stale evaluation, closed/training, replay и
  injected rollback;
- LessonShell contract проверяет action → consequence → explanation → next
  step, training copy, 48 dp и запрет повторного Complete.

## DEC-2026-09-25-011 — Принятый expressive spotted v2 в runtime

- Статус: Accepted владельцем 2026-09-25; художественная приёмка v2 и ответ «Подходит» разрешили интеграцию.
- Scope: только shapeId=pointy / patternId=spots. Пакет `assets/2d/variants/FINNI-POINTY-SPOTS-V1` сохраняет canvas 941×1672, anchor 470/1272, девять нейтральных экспортных слоёв и редактируемый ORA. Home использует flattened neutral/blink в существующем RN renderer DEC-007.
- Запрещено подменять этой геометрией round/floppy или объявлять все девять комбинаций готовыми. Прежний fallback остальных семи сохраняется до их отдельных пакетов. Исходный принятый S7 master не меняется.
- Источник: принятый `S8-001-anatomy-spots-v2`; Image Gen создаёт художественную информацию, механическая сборка переносит её только в разрешённые анатомические части. Neutral runtime идентичен принятому preview; blink сохраняет исходное лицо и alpha.
- Проверка: `tests/finni-appearance.test.mjs`, asset manifest и `artifacts/sprint-8/S8-001-spots-runtime/QA.md`. Configured Verify PASS; emulator visual gate заблокирован текущим старым debug APK, поэтому эта запись не означает runtime/release acceptance.
- Связанные документы: CURRENT_IMPLEMENTATION, S8-001, диаграмма S8_001_SPOTS_RUNTIME.md. Требование ТЗ §2.6/SRS FR-03 остаётся открытым для полной матрицы.


Уточнение проверки DEC-2026-09-25-011 (2026-09-25): предыдущий emulator blocker устранён clean debug install и persistent localhost Metro preference. API26 constructor/Home, cold persistence и blink smoke PASS; configured Verify 132 tests PASS. Для устранения фактического decode-gap neutral/blink заранее смонтированы и переключаются opacity после onLoad. Renderer остаётся RN core; memory/performance gate двух frame относится к S10. Release/physical-device acceptance не заявляется.

Дополнение scope DEC-2026-09-25-011 (2026-09-25): прямое поручение владельца «Давай доделаем все оставшиеся комбинации» разрешило реализацию всей существующей матрицы SRS§8.1. FINNI-MATRIX-V1 подключает все9 текущих IDs; это выполнение ранее принятого контракта, без новой формы/паттерна/модели роста. Preload neutral/blink и canvas/anchor/layer topology сохранены. Семь новых artStatus=implemented-for-owner-review; художественная приёмка исходных двух не распространяется автоматически на новые семь. Технический и API26 runtime Verify PASS зафиксирован в S8-001-matrix-v1/README.md.

Уточнение художественного scope DEC-2026-09-25-011: владелец принял pointy/plain, pointy/spots, pointy/stripes и окрасы тела остальных рядов. Посадка round/floppy была отклонена; revision ear-fit-v2 исправляет только уши/стыки и ожидает новой визуальной оценки. Новое архитектурное решение не требуется: IDs, canvas, layer order, anchors и renderer остаются прежними. QA: S8-001-matrix-v2/QA.md.


Дополнение к scope DEC-2026-09-25-011 (2026-09-25): аннотированные швы ear-fit-v2 исправлены локально в ear-seams-v3. Это реализационная matte/alpha-коррекция, нового архитектурного решения нет. Pointy×3 и body patterns сохраняют принятие; round/floppy v3 остаются pending-owner-review. Доказательства: `Finni App/artifacts/sprint-8/S8-001-matrix-v3/QA.md`.


### Accepted acceptance scope DEC-2026-09-25-011 — 2026-09-25

Основание: явный ответ владельца «Принимаю, всё устраивает. что дальше?». Приняты все9внешностей pointy/round/floppy × plain/spots/stripes в редакции ear-seams-v3, включая устранение отмеченных швов. Точные hashes: `Finni App/artifacts/sprint-8/S8-001-matrix-v3/acceptance.json`. Это заменяет pending-owner-review только для данных внешностей и существующих neutral/blink. Новые happy/thoughtful/inspired, полная S8-001, актуальный release/offline и physical performance не объявляются принятыми. Архитектурного изменения нет.


### Accepted acceptance scope DEC-2026-09-25-011 — expressions-v1

Основание: явный ответ владельца «Принимаю все вариации, что делаем дальше?» после показа исправленного обзорного листа. Художественно приняты happy, thoughtful и исправленный inspired для всех девяти ранее принятых внешностей. Scope и точные hashes: `Finni App/artifacts/sprint-8/S8-001-expressions-v1/acceptance.json`. Production `FINNI-EXPRESSIONS-V1` получает owner-accepted только при совпадении 27 PNG, девяти ORA и обзорного листа с этой записью. Принятие касается художественных вариантов и экспортов; runtime-переходы, AN-001–016, Android/device/release/performance и полное закрытие S8-001 остаются отдельными gates. Архитектура, IDs, canvas, anchors, renderer и диаграммы не изменены.


## DEC-2026-09-25-012 — Home V4.2 при крупном тексте

- Статус: Accepted владельцем в текущей задаче S9-001.
- Решение владельца: строго сохранить одновременную видимость по ТЗ §2.5.3 на 360×640 при 150–200%; разрешены меньший питомец и иная навигация. Исключение из нормативного требования не принимается.
- Обычный режим сохраняет композицию V4.2: полноэкранная комната, верхний HUD, защищённый центральный питомец, предметы и короткие маршруты по краям, основной CTA и четыре нижних маршрута.
- При fontScale >1.2 обязательная сводка остаётся без скролла: суммы строками, полная цель/прогресс/остаток, меньший питомец рядом с состоянием, полное название занятия. Вторичные маршруты, имя и день доступны через подписанные «Разделы»; основной CTA остаётся на экране. Размер текста не ограничивается и строки не обрезаются.
- Геометрия питомца вычисляется из общего alpha-bounds всех принятых кадров; рост 0.86/1/1.12 сохраняет общую опору лап. HUD не пересекает эту область.
- Android edge-to-edge учитывает реальные insets через Expo-совместимый react-native-safe-area-context; это UI utility, renderer остаётся RN core. Источник API: https://docs.expo.dev/versions/latest/sdk/safe-area-context/ . Фиксированная величина нижней системной панели не используется.
- Финансы остаются в application/domain; Home только открывает существующие маршруты подтверждения. Название занятия берётся из локального каталога и сохранённой истории попыток.
- Доказательства и ограничения: `Finni App/artifacts/sprint-9/S9-001-layout/README.md`. Physical/performance gate остаётся S10.

### Уточнение evidence DEC-2026-09-25-012 — визуальная коррекция 2026-09-25

Владелец отклонил внешний вид первой RN-реализации. Решение о строгой одновременной сводке остаётся Accepted; оно не означает художественную приёмку старых или новых снимков. Новый presentation-пакет и Android evidence: Finni App/artifacts/sprint-9/S9-001-redesign/README.md. В обычном режиме предмет цели объединён с финансовым HUD, остальные предметы размещены у краёв комнаты; при крупном тексте приглушается только комната. Доменные и финансовые контракты не меняются.


### Уточнение evidence DEC-2026-09-25-012 — полупрозрачный Home

Прямое уточнение владельца разрешило облегчить материал HUD и полноценно адаптировать короткий профиль. Финальный presentation-пакет использует тёплые поверхности с alpha .78, цельные панели предметов и увеличенный резерв питомца на 360×640. Дополнительный узкий режим 105–120% перераспределяет ширину между декоративными изображениями, цифрами и боковыми подписями; переход в крупную сводку при fontScale >1.2 сохраняется. Сам размер текста не ограничен.

Это уточнение реализации и evidence, нового архитектурного решения нет. Требование одновременной сводки, финансовые подтверждения, RN renderer и область художественной приёмки не меняются. Актуальный отчёт: Finni App/artifacts/sprint-9/S9-001-polish/README.md. Публикация снимков не означает принятие их владельцем.


## DEC-2026-09-25-013 — Структурная композиция Home

- Статус: Accepted по явному согласию владельца «Согласен, реализовывай» после независимого разбора Home; исполнитель подтверждён отдельно: DIRECT Astra Extra High.
- Scope: presentation главного экрана S9-001, контекстный следующий маршрут, прямое открытие рекомендованного занятия и организация вторичной навигации.
- Supersedes: требование прежней геометрии V4.2 из S6-002_v4_2_COMPOSITION_SPEC и обычную композицию DEC-2026-09-25-012. Строгая одновременная сводка DEC-012 по ТЗ §2.5.3, финансовые подтверждения, renderer DEC-007 и принятые art hashes DEC-011 сохраняются.

### Решение

Деньги и предмет мечты образуют один блок. Финни показан крупно в спокойной сцене из нативных слоёв; отдельные предметы комнаты не дублируют вкладки. Рядом с ним видны еда, уход и настроение. Ниже находятся одно рекомендованное занятие и один контекстный следующий шаг. Одна модель навигации содержит Домик / План / Покупки / Копилка с явным выбранным состоянием; в крупном тексте она находится внутри подписанного меню. Прогресс, все занятия, сведения о питомце, справка и защищённый взрослый раздел доступны через это меню.

Для 360×640 используется отдельная короткая композиция. При fontScale >1.2 сохраняется сводка без скролла, а питомец показывается портретом из тех же неизменённых принятых PNG. Портрет намеренно кадрирует нижнюю часть тела; уши, лицо и выражения сохраняются. Текст и суммы не обрезаются, fontScale не ограничивается. Полнофигурные стадии сохраняют якорь лап; портрет имеет отдельное оптическое кадрирование для читаемости лица.

Следующий шаг выбирает существующий маршрут: начать день, составить план, выбрать еду/уход, выбрать мечту, открыть накопления или предварительные итоги. Сам CTA не покупает, не переводит деньги и не завершает день. Формулировка «Продолжить день», ранее открывавшая предварительный итог, заменена соответствующим действию названием. Нажатие на название занятия открывает именно рекомендованное занятие через существующий openLesson; полный каталог сохранён в меню.

### Проверка и границы принятия

Основание — утверждённое направление владельца, ТЗ §2.5.3, S9-001 и фактические маршруты AppRoot. Измерения выполняются нативно на API26, начиная с 360×640/200% и stress data. Новый фон создаётся кодом, новые bitmap art masters не требуются. Проверка геометрии не является художественной приёмкой. Финальный evidence и ограничения: Finni App/artifacts/sprint-9/S9-001-structure/README.md. Physical/performance остаются gate S10; настоящее TalkBack-озвучивание не объявляется выполненным.


### Уточнение Accepted scope DEC-2026-09-25-013 — постоянная навигация, 2026-09-25

Основание: после независимого read-only обзора владелец ответил «Согласен с твоими предложениями, давай сделаем». Это расширяет presentation scope предыдущего решения до общей оболочки пяти детских корневых экранов; исполнитель сохраняет DIRECT Astra XHigh.

- AppRoot владеет peer roots «Домик / План / Покупки / Копилка / Ещё». При fontScale ≤1.2 одна постоянная панель видна на каждом из пяти экранов; selected-state отражает фактический экран. «Ещё» — отдельный корневой экран с каталогом, прогрессом, «Имя и внешность», справкой и прежним взрослым барьером.
- При fontScale >1.2 корневые маршруты показаны крупным вертикальным списком в modal «Разделы». Home сохраняет «Меню» рядом с контекстным действием; другие roots — доступную кнопку «Меню». Закрытие меню является dismiss action без стрелки перехода. Размер текста не ограничивается.
- Lesson/editor/history/adult/result остаются деталями без панели. Детали, открытые из «Ещё», возвращаются в «Ещё»; история операций — в копилку. Back с корневых разделов возвращает в Домик. Подтверждения покупки/перевода/получения цели/закрытия дня остаются native Alert с прежними командами и изоляцией ввода.
- «Пропуск» — отдельное временное действие около Финни. Назначение навигации не зависит от реакции. Крупные карточки цели/занятия сохраняют chevrons; достигнутая цель сообщает «Можно получить мечту», в копилке получение видно до списка остальных целей.
- У состояний обычного Home текст 13 sp вместо 11, у названия занятия 16 вместо15. Крупная сводка использует прежние исходные 12/14/16 sp с реальным системным scaling для соблюдения §2.5.3; это локально обоснованная плотность по §3.6, без fontScale cap или обрезки текста.
- План, Покупки и Копилка получают общую тёплую палитру, карточки/кнопки и safe-area оболочку. Перестройка учебных, итоговых и взрослого экранов остаётся в S9-002/004; финансовые контракты, SQLite, принятые assets и renderer не меняются.

Evidence: `Finni App/artifacts/sprint-9/S9-001-navigation/README.md`. Native emulator evidence не заменяет физический Android/performance, TalkBack-озвучивание, детский user test или художественную приёмку владельца. Подготовлены A/B материалы и сценарий будущего теста; runtime default — «Ещё».


### Уточнение Accepted scope DEC-2026-09-25-013 — остальные экраны, 2026-09-25

Основание: после приёмки пяти корневых экранов владелец поручил: «Если ещё есть какие-то экраны, то их тоже нужно доработать в таком стиле… менять файлы, внедрять это в приложение». Подтверждённый DIRECT Astra XHigh сохраняется для этого presentation-пакета.

Общий тёплый визуальный язык распространяется на знакомство, создание/редактирование питомца, каталог, LessonShell и пять учебных renderer, историю/сохранённые разборы, справку, взрослый барьер и controls, предварительные итоги, loading/error. AppRoot владеет реальными системными insets для всех экранов; native Help modal имеет собственную safe-area оболочку. Детали получают одинаковый видимый возврат, общий набор цветов/полей/кнопок и крупный текст без ограничения fontScale. Выбор передаётся цветом, отметкой и accessibility state.

Экономика, SQLite, lesson content/evaluators, подтверждения native Alert, режимы normal/demo и правила adult session не изменяются. Тексты образовательных объяснений сохранены. Уточнён только устаревший presentation-текст взрослой сводки о якобы неподключённом учебном модуле и показ ошибки открытия занятия в каталоге. Отдельный event controller S9-002 этим пакетом не считается реализованным.

Инвентарь и evidence: `Finni App/artifacts/sprint-9/S9-003-004-details/INVENTORY.md` и `README.md`. Согласие выше определяло scope. 2026-09-26 владелец ответил «принимаю» на явное предложение художественной приёмки новых экранов: визуальный результат пакета S9-003/004 принят. Это запись приёмки evidence в прежнем scope DEC-013, без нового архитектурного решения. Physical/performance, настоящее TalkBack-озвучивание, тесты с детьми/родителями и внешнее методическое/редакторское ревью остаются отдельными непроведёнными проверками.

## DEC-2026-09-26-014 — Разделить готовность реализации Sprint 9 и внешний gate Sprint 10

- Status: Accepted по прямому поручению владельца завершить S9-002, повторить native old-schema upgrade и устранить циклическую зависимость спринтов.
- Scope: статусы и входные зависимости S9-001–004, S10-001–002; не меняет economy-v2, release criteria или требования к физическому устройству.
- Original docs: `tasks/sprint-9/S9-001_home-scene-hud-integration.md`–`S9-004_lessons-history-adult-visual-language.md`, `tasks/sprint-10/S10-001_3d-accessibility-lifecycle-performance.md`, `tasks/sprint-10/S10-002_visual-functional-acceptance.md`, DEC-2026-09-18-005 и DEC-2026-09-22-009.
- Related tasks: S9-001–S9-004, S10-001–S10-002.

### Контекст

Реализация и доступные автоматизированные/native AVD проверки Sprint 9 завершены; художественный результат экранов принят владельцем. S9-001/003/004 при этом содержат физические, TalkBack, performance или независимые приёмочные критерии, назначенные Sprint 10. Формулировка «Sprint 10 заблокирован до PASS Sprint 9» требовала закончить эти проверки до начала их выполнения и создавала цикл. Для S9-003/004 также оставался отдельный native install-over со старой schema.

### Решение

- Различать **готовность реализации Sprint 9** и **итоговый внешний PASS**. Готовность реализации требует завершения S9-002, применимых source/native AVD Verify и доказанного install-over со старой schema. Она является входом в S10-001.
- S9-002 закрывать `done` по собственным функциональным критериям. S9-001/003/004 закрывать `partial`: реализованная часть завершена, а физические, TalkBack, performance и независимые проверки явно переданы S10-001/002. Прежнее evidence и непройденные критерии не переписывать как PASS.
- S10-001 можно начать после готовности реализации Sprint 9; его PASS не является предварительным условием самого себя. S10-002 по-прежнему ждёт PASS S10-001. Итоговая приёмка Sprint 9 определяется после внешнего gate, а не используется как вход в него.
- Открытые Sprint 8 art/device gates не маскируются формальным PASS. Принятые для текущего S9 scope assets и инженерный runtime позволяют его реализацию; оставшиеся визуальные/device проверки остаются в S8 и S10.

### Последствия и Verify

Native API 26 на отдельном AVD: исторический APK создал schema 2 и сохранённые профиль/кошелёк/receipt; финальный S9-002 APK установился поверх без удаления данных, мигрировал до schema 6 и сохранил их. Повторный запуск и подтверждённая покупка дали один receipt/списание без replay. Точная lineage и ограничения: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`. Физическое устройство, spoken TalkBack, performance и независимое детское/методическое ревью не выполнялись и остаются обязательным внешним gate. Диаграмма `docs/mermaid/SPRINT_7_10_2D_GATE.md` отражает новый порядок.

## DEC-2026-09-29-015 — Заморозка разработки версии для сдачи

- Status: Accepted по прямому решению владельца 2026-09-29.
- Scope: текущая реализация приложения, идентичность поставки и документация;
  не отменяет внешние критерии приёмки и не меняет денежные, учебные или
  persistence-контракты.
- Original docs: `ТЗ_Департамент финансов города Москвы.pdf`, разделы о
  поставке и приёмке; `Finni_SRS_v1.3_2026-09-16.md`, §§20–24;
  `docs/M1_TRACEABILITY.md`.
- Related tasks: S4-001–S4-006, S10-001–S10-002.

### Решение

Владелец принял последнюю реализацию ветки `ui/pet-reaction-name-demo`
(`1e2b287` до оформления версии) как окончательный объём разработки. Новые
функциональные и визуальные изменения не планируются. Номер поставки повышен
до `1.0.0`, Android `versionCode` — до `2`; Android package и требования к
подписи сохраняются. README и паспорт поставки описывают именно эту линию.

### Граница принятия

Принятие владельцем относится к реализации. Оно не присваивает PASS
открытым физическим, TalkBack, performance, независимым и полным demo-gate.
Статусы `partial` и `[ ]` в исторических задачах остаются до фактического
протокола. Если часть проверок не будет выполнена до сдачи, ограничение
указывается в комплекте, а не скрывается изменением статуса.

### Verify

Конкретный APK, SHA-256, версии, команда проверки и результаты сборки
записываются в `docs/RELEASE_HANDOFF_2026-09-29.md` после выполнения.
Workflow и архитектурные диаграммы этим решением не изменяются.
