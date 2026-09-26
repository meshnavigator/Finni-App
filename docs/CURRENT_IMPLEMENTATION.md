# ЛЦТ 2026 — карта текущей реализации

Этот файл описывает фактическое состояние, но не отменяет исходные требования
без Accepted-записи в `IMPLEMENTATION_DECISIONS.md`.

## Snapshot

- Дата: 2026-09-23
- Версия/commit: governance-корень вне Git; Finni App — ветка
  `dev` и `origin/dev`, HEAD `b49a52c`; рабочая ветка Sprint 8 (`c66d743`) запушена и слита merge-коммитом 2026-09-23.
- Активный этап: Sprint 3; S3-001–S3-007 DONE. B01/B02/P01/P02 пройдены на
  Android API 26 AVD успешным и допустимым неуспешным путём 2026-09-23.
  Physical-device gate Sprint 2 остаётся перенесён в Sprint 10
- Текущий visual sprint: Sprint 8; целевой medium — layered 2D cutout/2.5D по
  DEC-2026-09-19-006
- Основное ТЗ: `ТЗ_Департамент финансов города Москвы.pdf`, 17 страниц
- Образовательная основа: `Единая-рамка-ФГ(приложение)-2026.pdf`, 33 страницы
- Спецификация реализации: `Finni_SRS_v1.3_2026-09-16.md`, версия 1.3 от 2026-09-16
- Визуальные источники: историческое `Finni_3D_Addendum_v1.0`, обязательный
  `REF-001`, historical `Finni_S7-002_2D_POC` и accepted
  `FINNI-2D-MASTER-V1`; первый production Home slice подключён

## Sprint 6–7: historical 3D evidence и accepted 2D rebaseline

Sprint 6 запущен как V0/decision-gate. S6-001 сверила ТЗ, SRS v1.3,
3D-дополнение и фактический код. Реализация подтверждает 3×3 внешность,
стадии 1–3, реакции `calm|happy|thoughtful|inspired` и period states, но на
момент Sprint 6 не содержала каталогов `IT-01..08`, `GL-01..03` и `LS-*`.
Это историческое ограничение снято для учебного контента в Sprint 3: активный
bundle 1.2.0 содержит восемь `LS-*`; товарные `IT-*` и production asset catalog
этим изменением не объявлены готовыми.

DEC-2026-09-19-006 заменяет обязательную realtime-3D технологию из
DEC-2026-09-18-002, сохраняя `REF-001`, V4.2, HUD, economy-v2, стадии,
внешности, catalog IDs, доступность и release lineage. S6-002 и S7-001
остаются historical partial evidence: UI/diagnostic contracts и clean debug
native build подтверждены, production renderer не принимался.

S7-002 закрыта partial/superseded. R1–R4 и reviews сохранены; ни одна 3D-модель
не получила art/identity PASS. `Finni_S7-002_2D_POC` содержит 1212×1298 RGBA
open/blink states, 12-frame idle sheet, local previews, provenance и hashes и
визуально лучше сохраняет образ, но остаётся historical comparative asset.
S7-004 приняла exact-hash `FINNI-2D-MASTER-V1`; S7-005 доказала core
`Image`/`Animated` runtime и signed boundary; DEC-2026-09-19-007 Accepted.
S7-006 подключила master к default Home и удалила runtime 3D/Worklets stack.
S7-003 теперь только historical blocker evidence.

Композиции S6-002 v1–v3 не приняты продуктовым review. V4.2
(`S6-002_HOME_SYSTEM_v4_2.html`, `S6-002_v4_2_COMPOSITION_SPEC.md`) использует
полноэкранную комнату и HUD по периметру утверждённого ориентира: сводка сверху,
подписанные действия справа и навигация снизу. Центр остаётся открытым для
крупного полнофигурного Финни. Из одного DOM/data source через точный CDP
mobile viewport экспортированы 390×844 и 360×640 при 100%/200%, а также actual
360×640/200% continuation. Владелец продукта принял `390×844/100%` и `360×640/100%` как композиционный
baseline, но не как runtime PASS. HTML теперь содержит постоянную fixture
metadata, 412×915, 150% и READY/DRAFT/ACTIVE/CLOSED/WAITING плюс
onboarding/loading/error. `360×640/150%` остаётся open из-за недостаточного
projected safe-frustum, а 200% — `REVIEW CONFLICT — §2.5.3 NOT MET`.
QA-005/QA-006 и перенос в приложение открыты.

## Архитектура

### Sprint 2: финансовый цикл и production control

- Доменный каталог содержит 8 товаров и 3 цели; покупка, накопление, получение
  награды и закрытие периода возвращают persisted result и защищены от replay.
- Schema v4 хранит покупки, снимки товара, выбор цели и claims; schema v5 —
  immutable `period_summary` и `pet_stage`.
- Все repositories одного runtime используют один `RepositoryExecutor`; атомарные
  команды журнала и проекций проходят через общую очередь.
- `ProductionAppController` и `LifecycleCoordinator` управляют mode/profile/
  `sessionEpoch`; отдельная `finni-control.db` хранит CAS admin intent.
- Добавлены Shop, Savings, Ledger, PeriodResult, History, Help и Adult screens.
- Adult unlock живёт только в памяти и снимается при background/exit/mode/idle;
  reset/delete затрагивают только известные файлы normal/demo mode.

### Sprint 3: движок занятий и награда

- Чистый lesson-domain задаёт пять mechanic IDs, состояния draft → evaluated →
  explanation_seen → completed, исходы, L1/L2 hints и защиту stale evaluation.
- LearningService связывает evaluator registry с LessonRepository; renderer
  registry позволяет добавлять поддерживаемую механику без изменения
  LessonShell или основной навигации.
- Schema v6 хранит попытки, immutable evaluations и completions. Attempt
  закрепляет lesson/content/variant/mechanic, исходные parameters и hints,
  поэтому restart или смена активного пакета не переоценивают старый черновик.
- CompleteLesson одной BEGIN IMMEDIATE транзакцией сохраняет completion,
  receipt и audit, а при первой допустимой попытке ACTIVE-периода также
  единственную LESSON_REWARD=20, ledger, wallet и revision.
- DRAFT/WAITING/CLOSED являются training при старте; начатая в ACTIVE попытка,
  завершённая после закрытия периода, сохраняет результат без награды.
- Generic LessonShell показывает действие, последствие, обязательное
  объяснение и следующий шаг; invalid_input не завершается, needs_review
  допускает завершение с разбором.
- Активный schema-v3 bundle 1.2.0 содержит восемь lessons, manifest с SHA-256 и
  dependency graph, четыре catalogs и три family activities. Строгий validator
  проверяет structure, IDs, суммы, placeholders, modes/renderers, fixtures,
  hashes, битые и циклические ссылки до сборки.
- B01/B02/B03, P01/P02/P03 и S01/S02 загружаются из bundle через immutable
  `lessonDefinitionSnapshot`, доступны из demo-каталога и проходят canonical
  fixtures через реальные allocation/basket/savings/receipt/resource evaluators. Evidence board
  хранит просмотр как presentation state; учебные суммы не вызывают commerce,
  ledger или wallet writes. P03 сравнивает независимую корзину с чеком и считает 60/40; B03 сравнивает изготовление и покупку с учётом уже имеющихся материалов и общего бюджета. Новые renderer подключены к тому же LessonShell.
- S3-006: каталог сохраняет восемь тем, но даёт кнопки для всех валидированных
  вариантов (включая P02, P03 и B03). Повтор из карточки открывает следующий
  вариант той же темы как новую попытку с закрытыми L1/L2. LessonShell
  показывает L0, открываемые по запросу L1/L2, короткий словарь, объяснение
  после оценки и контекстный возврат в план/факт, покупки, историю, копилку
  либо домик по состоянию периода. Открытие в «Прогрессе» читает завершённую
  попытку и исходную evaluation из SQLite: выбор, расчёт, исход и факт
  открытых подсказок не пересчитываются по новому контенту. Чтение и возврат
  не вызывают повторного CompleteLesson и не начисляют награду.
- S3-007 (merge `8624968` в `dev`, затем push в `origin/dev`): в ветке
  `S3-007/editorial-methodical-review` commit `1451673` B02 открывает
  редактируемый старый план 40/40/20; P02 объясняет цену двух отдельных
  карандашей и набора из трёх; P03 после верного расчёта ошибочного чека
  предлагает выбрать нейтральный вопрос продавцу, затем повторно проверить;
  S02 требует явного выбора и не рисует отрицательную копилку.
  Подписанный review APK зафиксирован commit `e77323b`, SHA-256
  `564C6E9DC94A1C43152C48D1928947E1C99D9B4F00AC9A14548FAD99751ED24F`.
  Clean API 26 release запуск и цикл исправления B02 прошли; методический
  re-review всех восьми на этой версии Ханиным В. И. 23.09.2026 на
  Samsung Galaxy A54 / Android 14 подтверждён владельцем без новых замечаний;
  точные variantId и журнал установки не переданы.

Кодовая база находится в `Finni App`. Создан Expo SDK 57 / React Native 0.86.3
/ TypeScript 6.0.3 bootstrap и сохранён native-каталог `android`.

В `src/domain` реализовано независимое от UI и SQLite финансовое ядро:
`numeric` владеет целочисленными типами и безопасной арифметикой, `errors` —
доменным каталогом, `economy` — формулами economy-v2, `contracts` — Clock,
command/meta/result/receipt и Repository transaction boundaries.

В `src/persistence` реализован SQLite-контур: разные файлы
`finni-main.db`/`finni-demo.db`, последовательные migrations v1→v6, единый
`RepositoryExecutor`, атомарная запись ledger/projection/audit/receipt и
проверка persisted idempotency по `commandId` и canonical business identity.
Schema v2 добавляет сохраняемый `GameClock`, eligibility, rule-bundle snapshot
и подтверждённый план периода. Schema v3 фиксирует баланс и ledger boundary в
момент подтверждения, а также immutable историю дополнений плана.
`LifecycleRepository` атомарно выполняет
Open/Confirm/Close/Advance/Correct вместе с revision, audit и receipt;
OpenPeriod включает единственный доход в ту же транзакцию.

В `src/application` реализован независимый от UI lifecycle-coordinator:
монотонный `sessionEpoch`, остановка очереди при смене режима, атомарный
`AppControl` и возобновляемый admin-intent протокол. Production adapter
использует `expo-sqlite`.

В `src/application/app-runtime` normal-mode shell связывает миграции,
`ProfileRepository`, `LifecycleRepository` и `BudgetPlanRepository`. В
`src/ui/AppRoot.tsx` реализованы loading/error, onboarding, pet editor, compact
home и экран budget plan/fact. Экранный shell ещё не
подключает mode/admin операции `LifecycleCoordinator`; это остаётся scope
взрослого раздела S2-004 и не подменяется UI-правилами.

## Belief map

После S1-001 выполнен full rebuild карты из фактического `Finni App`: 7
TypeScript source modules и 83 entities. `src/domain/economy` напрямую зависит
только от `src/domain/numeric` и `src/domain/errors`; `src/domain/contracts`
использует economy/numeric/errors. Внешних UI или SQLite dependents у domain
нет. Существующий entry point `index` импортирует `App`.

После структурных изменений S1-002 выполнен full rebuild: 14 TypeScript source
modules, 113 entities, 20 import edges и 52 reference edges. Анализ нового
`src/persistence/sqlite-repository` показывает прямые зависимости только от
domain contracts/errors/numeric и persistence database/migrations/executor;
dependents пока отсутствуют, что соответствует незавершённой Application
интеграции.

После S1-003 выполнен full rebuild: 20 TypeScript source modules, 164 entities
и 146 edges, включая 40 imports и 104 references. Новый
`src/persistence/lifecycle-repository` имеет восемь прямых зависимостей внутри
domain/persistence boundary и не имеет внешних dependents. Новый
`src/application/lifecycle-coordinator` зависит от AppControl и доменных
contracts/errors/numeric; его boundary ограничен пятью файлами.

`node_modules`, build/cache/generated, vendor и worktree-копии в карту не
входят. Локальные `.belief_map.sexp` и `.belief_map_cache.json` являются
generated artifacts и исключены из Git.

После S1-004 выполнен full rebuild: 25 TypeScript/TSX modules, 207 entities и
233 edges (81 imports, 145 refs, 6 data flows, 1 calls-api). `AppRuntime`
имеет 8 прямых imports, связывает profile/lifecycle repositories и имеет два
dependents: application barrel и `src/ui/AppRoot`.

После S1-005 выполнен full rebuild: 28 TypeScript/TSX modules, 238 entities и
272 edges (78 imports, 188 refs, 5 data flows, 1 calls-api).
`src/persistence/budget-plan-repository` зависит от domain contracts/economy/
errors/numeric и общих persistence database/executor; его прямые dependents —
`app-runtime` и `budget-plan-model`.

После S3-001 выполнен full rebuild: 53 source files, 53 nodes, 389 entities и
498 edges. LearningService имеет четыре boundary files: собственный модуль,
domain contracts/lesson и LessonRepository; прямой validated data flow ведёт
только в LessonRepository.

## Текущий workflow

Sprint 1 находится в работе с 2026-09-17. Канонический порядок выполнения,
зависимости и evidence-gates зафиксированы в
`tasks/sprint-1/SPRINT1_EXECUTION_ORDER.md`.

По решению владельца Git остаётся только внутри `Finni App`; `.git` не
переносится в governance-корень. Bootstrap зафиксирован локально на созданной `dev` коммитом `e5c7158`; S1-001
реализована коммитом `baa3374`. S1-002 зафиксирована task-коммитом `042a77d` и
локально объединена в `dev` merge-коммитом `3da4683`. Push, PR и
GitHub-сущности не создавались, поскольку `repository` в конфигурации пуст.

S1-003 зафиксирована task-коммитом `47f8e89` и локально объединена в `dev`
merge-коммитом `e102dec`. Код, file-backed SQLite evidence, fixture и
governance-обновления завершены; push и внешние GitHub-действия не выполнялись.

S1-004 завершена коммитами `58464ba` и `e5437da`, локально объединена в `dev`
merge-коммитом `37c954e`; signing-note follow-up объединён как `07f3ff1`.
S1-006 прошла на сохранённом AVD Android API 36 с
viewport 360×640 dp; TC-183/185, offline restart и fontScale 1/2 подтверждены.
Внешние GitHub-действия не выполнялись.

S1-005 завершена task-коммитом `c6edb25` и локально объединена в `dev`
merge-коммитом `6742c92`. Реализованы immutable initial plan, отдельная история
дополнительного дохода и plan/fact; debug runtime пройден на AVD 360×640 dp.
Волна E закрыта. Sprint 1 нельзя объявить полностью пройденным, пока открыт
отдельный carry-over gate S0-006 на физическом Android API 26.

S0-005 закрыта 2026-09-17 как `partial`: исходный код, manifest, lockfile,
release toolchain и подписанный APK созданы и проверены, но физическое
устройство не было подключено. Недостающая установка и запуск на Android API 26
без Metro вынесены в S0-006 и не объявляются пройденными.

## Release baseline

- Команда: Better Together; teamSlug: `better-together`.
- Android applicationId: `com.meshnavigator.finni`.
- Владелец release-ключа: владелец проекта; ключи и пароли хранятся вне Git.
- Release-key RSA-4096 и DPAPI credentials фактически созданы вне репозитория.
- Android version `0.1.0` / `versionCode=1`; min/target SDK: 26/36;
  orientation: portrait.
- Clean release APK:
  `Finni App/artifacts/sprint-0/finni-0.1.0-release.apk`,
  SHA-256
  `062590A99C4541BB860F1F95DADA904D9F6D232ABBF4C63FE2BE3CC19273257F`.
- Подпись v2, manifest и ABI статически проверены; runtime API 26 не проверен.
- Целевой объём промежуточной сдачи: M1-T. M1-B — только явный аварийный
  fallback и не равнозначная замена обязательному объёму.
- Физическое Android-устройство и методический проверяющий доступны. Их
  идентифицирующие и технические сведения фиксируются при фактической проверке,
  а не предполагаются заранее.
- Интерактивный прототип допустим как fallback формата сдачи, но не доказывает
  установку и автономный запуск APK.
- Исходный S1-004 APK
  `Finni App/artifacts/sprint-1/finni-0.1.0-s1-004-release.apk`, SHA-256
  `066830FD54824AE9C6DC0D73167E6D4819B91FFEA8FBA165DE3E59798ABD9930`,
  получил runtime FAIL из-за перекрытия Android status bar.
- Финальный S1-004 r4 APK
  `Finni App/artifacts/sprint-1/finni-0.1.0-s1-004-r4-release.apk`, SHA-256
  `3486DA3B6F0BFC46FC03D52CE2E2C825DF818CEE62A222D24732BF0EDD6B2804`,
  прошёл 360×640 dp, offline restart и fontScale 1/2 на AVD API 36. Он подписан
  отдельным runtime-test key; production/M1 требует штатный ключ владельца.

## Публичные контракты

Публичных сетевых контрактов нет. Bootstrap-контракт Android фиксирует package,
version, min/target SDK, portrait и внешнюю release-подпись.

Внутренний TypeScript domain contract экспортирует `Amount`, `MoneyDelta`,
`Counter`, `NetFlow`, полный каталог ошибок §16.4, Clock, command/meta/result/
receipt и Repository transaction boundary. Domain не импортирует React, Expo
или SQLite. Persistence использует эти типы и canonical business identity, но
не переопределяет доменные числовые инварианты.

`NormalClock` фиксирует IANA-пояс профиля и вычисляет календарную дату через
`Intl`; `VirtualClock` хранит и сдвигает ISO-даты календарно. State projection
выводит READY/WAITING из сохранённых DRAFT/ACTIVE/CLOSED, `maxOpenedDate` и
`nextEligibleDate`. Application boundary содержит `RuntimeSession` с
mode/profile/sessionEpoch и запрещает исполнение устаревшей заявки.

Pet profile contract нормализует имя через NFC/trim/collapse spaces, проверяет
2–16 Unicode code points и допустимые кириллические/латинские буквы, цифры,
пробел/дефис. Каталог фиксирует ровно 3 формы × 3 узора.

## Persistence

Schema v1 содержит Profile, WalletProjection, ProfileState, Period,
LedgerEntry, AuditEvent и CommandReceipt. Денежные поля защищены проверками
целого типа, диапазона и знака; Counter-backed поля отдельно ограничены
диапазоном безопасного целого JavaScript. FK включаются на каждом соединении,
а UNIQUE и
partial UNIQUE защищают identity операции, единственный открытый период,
единственный доход и единственную награду периода. Индексы истории используют
монотонный `seq`.

После открытия соединения включаются `foreign_keys`, WAL и busy timeout.
Миграции применяются строго последовательно внутри `BEGIN IMMEDIATE` и не
понижают более новую неизвестную схему. Все публичные чтения и команды проходят
через сериализованный `RepositoryExecutor`. Денежная команда выполняет
`BEGIN IMMEDIATE` → receipt/precondition checks → ledger → wallet/revision →
audit → receipt → `COMMIT`; ошибка приводит к `ROLLBACK`.

Повтор committed-команды с теми же canonical business parameters возвращает
исходный persisted receipt до проверки устаревшей revision. Тот же `commandId`
с другим типом, профилем, режимом или business identity возвращает
`IDEMPOTENCY_CONFLICT`. Проверка mode происходит до доступа к соединению.
Normal и demo владеют разными файлами; произвольное имя БД через публичный
контракт не принимается.

Интеграционные тесты используют реальные временные файловые SQLite-БД через
Node SQLite, закрывают и повторно открывают файл; in-memory подмена не
используется. Они проверяют COMMIT, trigger-induced ROLLBACK, receipt replay и
conflict, schema constraints, конкурентные вызовы очереди, restart consistency
и изоляцию режимов.

Migration v2 без удаления данных добавляет `game_clock`, rule-bundle snapshot и
поля подтверждения плана. Для normal дата берётся только из `NormalClock`, для
demo — из сохранённой virtual date. `(profileId, clockGeneration,
calendarDate)`, partial UNIQUE income и транзакционный receipt не позволяют
повторить доход. Коррекция часов увеличивает generation, очищает max текущего
поколения, ставит `nextEligibleDate` на следующий календарный день и не создаёт
ledger entry.

Migration v3 без удаления данных добавляет в period баланс и ledger sequence на
момент подтверждения, а также таблицу `period_plan_addition`. Первоначальный
план не обновляется: каждое распределение нового дохода записывается отдельной
immutable строкой, audit event и receipt в одной транзакции. Подтверждение
плана сохраняет snapshot, но не создаёт ledger entry и не меняет wallet.
Plan/fact строится из исходного плана, суммы дополнений и ledger-факта после
зафиксированной границы; новый доход не переписывает ретроспективный план.

Lifecycle coordinator до доступа к данным сверяет epoch/mode/profile. Смена
режима инвалидирует ещё не начатые заявки, дожидается уже начатой операции,
закрывает соединение и только затем меняет selectedMode. Reset/Delete проходит
фазы PREPARED → QUEUE_STOPPED → CONNECTION_CLOSED → DATA_REMOVED → UI_CLEARED
→ VERIFIED; bootstrap продолжает сохранённую фазу до открытия игровой БД.

`ProfileRepository` атомарно создаёт единственный `local-profile` вместе с
нулевыми wallet/state и game_clock; повторное подтверждение возвращает
существующий профиль. UpdatePet сохраняет ID, wallet и историю, сверяет revision
и меняет только имя/shape/pattern с повышением revision. File-backed test
закрывает и повторно открывает SQLite для второй комбинации питомца.

## Frontend

Реализованы статичное loading-состояние, retryable storage error, знакомство с
тремя направлениями, конструктор 3×3 с preview и edit-mode, normal-mode app
shell и компактный home. Home одновременно показывает имя/день, баланс,
копилку, пустую цель, питомца, еду/уход/эмоцию, активное занятие, основное
действие и четыре пункта навигации. Финансовые разделы доступны по состоянию
периода: план с DRAFT, покупки/копилка с ACTIVE. ScrollView сохраняет полный
текст при увеличении шрифта; интерактивные элементы имеют минимум 48 dp.

Экран плана позволяет распределить целые неотрицательные суммы по направлениям
«Нужно», «Хочется» и «На мечту», показывает распределённую сумму и остаток,
блокирует превышение бюджета и требует явного подтверждения предупреждения при
доле необходимого ниже ориентира. После подтверждения экран показывает
первоначальный план, дополнения, текущий ориентир и факт отдельно. Доступный
новый доход можно распределить частично либо оставить на потом; история
дополнений сохраняется после restart.

Production Home по умолчанию использует `FinniHomeScene` с accepted local
`FINNI-2D-MASTER-V1` room/neutral/blink layers. Компонент реализует
native-driver idle transform, blink swap, AppState/modal/reduced-motion pause,
cleanup и labelled decode fallback, но не импортирует application/domain/
persistence. Старые Filament/Worklets/GLB diagnostic routes и assets удалены
из current app; их code/art evidence сохранены в commit `19c8777` и governance
packages. С 2026-09-23 в рабочей ветке Sprint 8 Home читает `lifecycle.petStage` и
масштабирует принятый растр около фиксированного якоря лап. Это техническое
отображение трёх стадий, но не три самостоятельных принятых character masters.
`RoomObjectsLayer` предоставляет четыре подписанные зоны навигации 72×72 dp;
их доступность следует состоянию периода. Выбранная цель и фактические покупки
формируют подписи Home. Каталог и цели получили одиннадцать локальных
`IT-*/GL-*` изображений, связанные с каноническими ID через пакет
`Finni App/assets/2d/room/S8-002/asset-manifest.json`. Пять OBJ PNG —
локальные тёплые 2.5D cutouts; их стиль и композиция Home приняты
пользователем 2026-09-23. Одиннадцать прежних кодовых миниатюр IT/GL
отклонены как примитивные и заменены на 192×192 RGBA экспорты из отдельных
imagegen-мастеров v3. Пользователь художественно принял новые IT/GL
2026-09-23; владелец подтвердил права на использование этих рисунков
по аналогии с принятым S7-004. Физическое устройство отложено до Sprint 10
и не блокирует S8-002.

Контракт слоёв S8-001 зафиксировал canvas, порядок, якоря, стадии и мимику.
S8-003 добавил инженерный реестр AN-001–014, правила AN-015 и независимое
хранение motion/sound AN-016 в `finni-control.db`; взрослый раздел управляет
этими двумя настройками. Runtime Home пока проигрывает только принятые
neutral/blink и idle transform. Статическая матрица 27 сочетаний внешности и стадии и отдельные
expression exports проверены и художественно приняты; runtime-переходы,
клипы по реестру и device-приёмка остаются открыты. Home, пять OBJ и 11 новых
миниатюр каталога v3 художественно приняты. S7-004 exact-hash master сохранён
как исходный эталон; девять внешностей и три новых выражения каждого приняты
владельцем.

Промежуточный S8-001 neutral layer prototype отделяет видимые пиксели хвоста,
корпуса, ушей, лица и ошейника из принятого master; обратная сборка совпадает
по всем видимым пикселям. После отклонения грубых масок контуры видимых
частей уточнены и подготовлен contour-audit; пользователь принял
разделение слоёв 2026-09-23. Доступный S7-004 ORA содержит только плоские
neutral/blink и room, без скрытой анатомии. Это art-review artifact без
runtime-подключения и без остальных внешностей/выражений. Отдельно собран
первый pointy/spots ORA-кандидат с собственным слоем узора и текстурным
подслоем скрытой шерсти под ушами. Его 9 слоёв сохраняют холст 941×1672 и
origin (0,0); пиксели вне корпуса и исходной маски ушей не меняются.
После замечания владельца пятна, пересекавшие передние и задние лапы,
убраны. Редакция 2 ограничивает узор верхом корпуса и сохраняет светотеневую
фактуру исходной шерсти; проверка даёт 0 пикселей узора на защищённых лапах.
2026-09-25 владелец отклонил и редакцию 2; обе пробы pointy/spots
отклонены. Разбор `S8-001-pattern-rethink` предлагает отдельные анатомические
маски и отрисовку окраса в шерсти с запеканием в существующие слои.
На первом этапе нового рисунка не было: два вызова imagegen остановились
на ошибке чтения исходника Windows sandbox helper. Принятый neutral master
и его сборка сохранены точно; в runtime кандидат не включён. После передачи исходника пользовательским вложением созданы две пробы крапа в `S8-001-pattern-rethink/rear-thigh-trial-v1`: анатомические границы соблюдены визуально, но v1 перерисовывает защищённые области, а v2 также меняет лицо и масштаб. Обе непригодны как точная замена master; новый production asset не создан. В отдельном `S8-001-anatomy-spots-v1` корпус lossless-разделён на шесть частей; собран кандидат с Image Gen отметинами на обеих передних и задних лапках. Нейтральная сборка точная; вне областей окраса 0 изменений, восемь защищённых экспортов побайтово сохранены. Два вложенных ORA и девять PNG проверены; это статический neutral art-review без подключения к runtime. Скрытая анатомия для движения не создана. Владелец отклонил мелкие веснушки v1 как недостаточно отличающуюся внешность. Следующий `S8-001-anatomy-spots-v2` переносит выразительный Image Gen окрас только в четыре исходные части лап: плечи и лапки имеют крупные и меньшие каштановые пятна, центральная грудка сохранена. Alpha всего персонажа исходный; восемь защищённых экспортов побайтово сохранены; ORA/PNG-сборка проверена независимо. Это новый художественный кандидат, его принятие и полная матрица девяти внешностей остаются открытыми. Художественная
приёмка новых узоров и скрытой анатомии для сменных форм ушей открыта. S8-002 проверена на одном API 26
эмуляторе: Home, переходы к покупкам/накоплениям и изображения 8 товаров и
3 целей видны. Для нового каталога v3 повторная проверка на том же AVD
подтвердила 8 IT и 3 GL при прокрутке; снимки лежат в
`Finni App/artifacts/sprint-8/S8-002-catalog-v3`. Новые миниатюры художественно приняты; physical-device проверка
отложена до Sprint 10.

## Security и эксплуатация

Release-подпись использует внешний keystore и process-only переменные; debug
fallback запрещён. Секреты и release-key отсутствуют в Git. SQLite-запросы
параметризованы; имена файлов режимов закрыты фиксированным mapping. Остальные
механизмы безопасности и эксплуатации пока не реализованы.

## Verify baseline

### Sprint 2 — 2026-09-22

- `npm run test:core`: 52/52 PASS; полный `npm test`: 69/69 PASS;
  `typecheck`, `lint`, `content`, `fixtures` и `git diff --check`: PASS.
- File-backed tests покрывают crash до receipt, crash после receipt до COMMIT,
  потерянный ответ после COMMIT, replay, rollback при SQLITE_FULL-like ошибке,
  миграцию v4→v5, отказ от newer schema и ledger/projection reconciliation.
- Belief map перестроена: 47 nodes, 340 entities, 434 edges.
- Signed release APK на API 26 AVD установлен и запущен без Metro; Shop,
  Savings, Ledger, PeriodResult, History, Help, Adult и mode/reset/delete PASS.
- Controlled same-signing upgrade v4→v5 сохранил профиль и wallet, поднял
  `user_version` 4→5 и добавил `pet_stage=1`.
- Пять cold starts: 920/869/1108/872/1007 ms, среднее 955.2 ms; 360 dp и
  ключевые controls 48 dp подтверждены.
- Bounded 512 MiB storage pressure и cleanup PASS; настоящий full-disk и
  physical-device/OEM/performance остаются gate Sprint 10 по DEC-009.

В `.project-kit/config.json` зарегистрированы пять frontend-команд. После
S1-001 фактически выполнены с exit code 0: `npm run lint`,
`npm run typecheck`, `npm run test` (14/14), `npm run content` и
`npm run fixtures`. Fixture-проверка включает bootstrap и economy-v2.

После S1-002 и локального merge в `dev` фактически выполнен полный
`npm run verify`: lint, typecheck, tests 20/20, content и fixtures — PASS. Шесть
file-backed SQLite integration tests входят в общий suite. Перед task-коммитом
`git diff --cached --check` прошёл; после merge рабочее дерево чистое. Full
belief-map rebuild подтверждает 14 модулей, 113 сущностей, 20 imports и 52 refs.

После S1-003 фактически выполнены `npm run lint`, `npm run typecheck`,
`npm run test`, `npm run content`, `npm run fixtures` и `git diff --check`:
**PASS**, 34/34 tests. Suite включает migration v1→v2,
lifecycle ROLLBACK, receipt replay, restart, часы назад/далеко вперёд,
коррекцию generation, пять demo-периодов, сохранение VirtualClock, изоляцию БД,
normal→demo→normal epoch и bootstrap recovery после каждой из шести admin-фаз.
Полный belief-map rebuild — 20 modules, 164 entities, 146 edges.

Backend, integration, docs и whitespace arrays остаются пустыми: отдельных
повторяемых команд для них пока нет. Release-build и физический API 26 runtime
не входят в обычный verify-контур и отслеживаются собственными evidence-gates.

После S1-004/S1-006 фактически выполнен `npm run verify`: lint, typecheck,
40/40 tests, content и fixtures — PASS; `git diff --check` — PASS. Tests
покрывают 9 комбинаций, единые правила имени, loading/error/onboarding/home,
единственный профиль, UpdatePet без смены ID/денег и file-backed restart.
Финальный signed r4 APK собран PASS. На AVD API 36 пройдены 360×640 dp,
fontScale 1/2, две комбинации, cancel edit и force-stop/offline relaunch.
Full belief map: 25 modules, 207 entities, 233 edges; `src/ui/AppRoot` имеет
15 entities, 4 imports, 14 refs, 1 dependent и 6 boundary files.

После S1-005 фактически выполнен полный `npm run verify`: lint, typecheck,
43/43 tests, content и fixtures — **PASS**; `git diff --cached --check` — PASS.
Новые tests покрывают exact integer validation, бюджетные ограничения,
предупреждение low-need, отсутствие ledger entry при ConfirmPlan, stale state,
idempotent receipt replay, превышение квоты, запрет после ClosePeriod и
file-backed restart с immutable initial/effective plan и историей дополнений.
Debug runtime на AVD API 36 / 360×640 dp прошёл CTA → draft 40/20/40 → confirm
→ plan/fact → force-stop/cold launch; баланс остался 100, план восстановлен.
Полный belief-map rebuild: 28 modules, 238 entities, 272 edges.

После non-device S6-002/S7-001/S7-002 выполнен `npm.cmd run verify`: lint,
typecheck, 53/53 tests, content и fixtures — **PASS**; `git diff --check` —
PASS с информационными CRLF warnings. Full belief-map rebuild: 32 source files,
32 nodes, 317 edges. Fresh ASCII staging `npm ci` и clean debug native build — PASS
за 8m24s, 317 tasks. Temporary debug APK имел SHA-256
`A9F8AE8E402A822AA9303BCED7A5C8DFB672F7EF4654840299193225AC3A22E9`.
Signed release — BLOCKED в `:app:createBundleReleaseJsAndAssets`: после
закрепления shorthand plugin 7.29.7 Worklets Core 1.6.3 запросил следующий
незаявленный `@babel/plugin-transform-arrow-functions`; dependency ladder
остановлена, release APK не создан. Web runtime — NOT RUN из-за отсутствующих
`react-dom`/`react-native-web`.

### S3-001 — 2026-09-22

- lint, typecheck, content, fixtures и git diff --cached --check — PASS;
- полный test suite — 85/85 PASS;
- file-backed lesson tests покрывают 8 completions/1 reward, concurrency,
  restart/pinned snapshot, stale evaluation, closed/training, replay и
  injected rollback;
- full belief map — 53 nodes, 389 entities, 498 edges;
- LessonShell runtime/browser — NOT RUN до concrete content/renderers/routes
  S3-002–S3-004; source/component contract и typecheck PASS.

### S3-002–S3-004 integration — 2026-09-22

- integration branch HEAD — `8a48f45`; task commits S3-002 `11290ab`,
  S3-003 `5d3f0a9`, S3-004 `8f31eaa`;
- lint, typecheck, content, validate:content, fixtures и whitespace — PASS;
- полный suite — 101/101 PASS;
- actual LessonEvaluatorRegistry совпадает со всеми canonical fixtures шести
  runnable B/P/S lessons;
- content validator — 8 lessons, 3 family activities, 7 negative fixtures;
- full belief map — 62 nodes, 496 entities, 578 edges;
- Android runtime B01/B02/P01/P02 — NOT RUN: `adb` отсутствует в PATH и
  проверенных на эту дату SDK-путях; gate оставался открытым на 2026-09-22.

### S3-002 Android runtime — 2026-09-23

- SDK найден в `C:\tmp\finni-s2-006-android-sdk`; debug APK собран и запущен на
  API 26 AVD с Metro через localhost и `adb reverse`.
- B01/B02/P01/P02 прошли успешный и допустимый неуспешный сценарии с
  объяснением и завершением; P02 также принял более дорогую допустимую
  альтернативу. [Evidence](../Finni%20App/docs/S3-002_android-runtime-evidence.md).
- После тренировочных уроков Home показывает 0 монет в кошельке и копилке;
  реальная покупка не совершалась. S3-002 закрыта. Signed/offline release и
  физический device scope этим прогоном не заявлены.

### S3-005 — 2026-09-23

- Коммит задачи 0741df4, локальный merge в dev 095393f.
- Финальный npm.cmd run verify: lint, typecheck, 106/106 tests, content и
  fixtures — PASS; git diff --check HEAD^ HEAD — PASS.
- P03 принимает исправленный чек 60/40 и корректный чек; B03 проверяет оба
  способа с учётом материалов и общего бюджета; SQLite test подтверждает
  отсутствие учебной денежной проводки.
- Android API 26 AVD открыл каталог восьми занятий и оба новых экрана;
  B03 preview 40/10/50 показал самодельный результат. Полное завершение P03/B03
  через Android UI, signed/offline release и physical device здесь не проверены.
  [Evidence](../Finni%20App/docs/S3-005_android-runtime-evidence.md).
### S3-006 — 2026-09-23

- npm.cmd run verify: lint, typecheck, 112/112 tests, content и fixtures —
  PASS; git diff --check — PASS.
- File-backed restart test подтвердил pinned outcome/solution/L2/reward reason
  в карточке без новой проводки. Два варианта одной темы дают два результата
  и одну дневную награду; следующий вариант начинает с закрытыми hints.
- Android API 26 AVD с Metro: B03 «Ситуация 2» показал отсутствие материалов
  и стоимость 45 против готового 35; словарь и L1 открылись до ответа без
  выбора. Полное завершение, возврат и просмотр карточки на AVD в этом
  прогоне не проверены.
- Full belief map после новых модулей/imports: 66 nodes, 532 entities,
  610 edges. Schema/SQL migrations и Accepted decisions не менялись.

### S3-007 — 2026-09-23

- Код `1451673`, review APK `e77323b`, merge `8624968`; `origin/dev` = `8624968`.
- npm.cmd run verify на итоговом `dev`: lint, typecheck, 117/117 tests,
  content/8 lessons и fixtures — PASS; merge diff whitespace — PASS.
- Signed review APK SHA-256
  `564C6E9DC94A1C43152C48D1928947E1C99D9B4F00AC9A14548FAD99751ED24F`:
  clean release, v2 signature, minSdk 26/targetSdk 36, 4 ABI — PASS.
- Чистый API 26 AVD без Metro: установка, запуск, Home, каталог, B02 старый
  план → разбор → исправление 60/20/20 → успех — PASS. P02/P03/S02 на этом
  AVD не пройдены; owner-reported внешний просмотр восьми на физическом
  Samsung Galaxy A54 / Android 14 без новых замечаний записан отдельно.
- Первый подробный отзыв относится к демо неизвестной версии. Повторный
  просмотр конкретного APK подтверждён владельцем, но вариантные ID и
  журнал установки не получены. Визуальная полировка категорий и числовой
  нагрузки передана в S4-002 без заявления об её выполнении.

## Активные ограничения

- Belief map требуется перестраивать full-mode после структурных изменений,
  imports, routes, SQL или migrations.
- Lifecycle S1-003 реализует календарные переходы, clocks и recovery. S1-004
  подключила repositories к profile onboarding и UI; экраны не создают
  собственные clock/revision/mode правила.
- `AppControlStorage`, `RuntimeFactory` и `AdminDataDriver` подключены к Expo
  shell через `ProductionAppController`; pending admin intent восстанавливается
  до открытия game DB, а смена mode/session не дублирует clock/revision правил.
  S2 emulator acceptance PASS; physical-device/OEM gate остаётся в Sprint 10.
- S1-005 и Волна E закрыты; пользовательский план и plan/fact работают и
  восстанавливаются. Общий lesson completion/reward и восемь concrete B/P/S
  lessons подключены к AppRoot через валидированный demo-каталог. Android
  runtime gate четырёх B/P lessons S3-002 и code/component/fixture gates
  пройдены.
- Carry-over gate Sprint 0 — установка и запуск release APK на физическом
  Android API 26 без Metro. Он не пройден и отслеживается в S0-006, но по
  DEC-2026-09-18-005 не блокирует текущую non-device работу.
- DEC-2026-09-19-006/007 принимают layered 2D cutout/2.5D и RN core
  `Image`/`Animated`. `FINNI-2D-MASTER-V1` art/provenance принят; default Home
  использует его room/neutral/blink hashes. Physical-device frame/decode/memory
  budgets остаются open только в S0-006/S10.
- Подтверждены Node 22.18.0, npm 10.9.3, Microsoft JDK 17.0.18, Android SDK 36,
  Build Tools 36.0.0, NDK 27.1.12297006 и CMake 3.22.1. Для S2-006 SDK
  восстановлен из official archives, а release собран из ASCII temp-copy.

## Как обновлять

После значимого изменения обновите snapshot и только затронутые разделы.




### Evidence limits S6-002 / S7-001 (2026-09-18)

- double-PNG в V4.2 — только review fixture; настоящая 3D-сцена отсутствует;
- `DESIGN FIXTURE FROM SRS — NOT RUNTIME EVIDENCE` записано в HTML metadata;
- protected rectangles — projected safe-zone, а не animation/model bounds;
- CDP `48 CSS px` не подтверждает Android `48 dp` или реальные system bars;
- физический API 26 и runtime/performance перенесены в S0-006/S10 и не
  объявляются пройденными;
- на дату этого historical evidence signed release блокировал S7-003;
  operational blocker позднее устранён удалением Worklets в S7-006;
- S6-002/S7-001 закрыты `partial`, а не `done`/PASS.

### Evidence limits S7-002 R2 (2026-09-19)

- R1 отклонена: объект `Chest` перезаписывал rig joint и становился target
  `idle`; R2 разделяет immutable joint/object maps, namespace `Joint.*` и
  проверяет, что prop `Chest` не является animation target;
- R2 GLB (`1024896` bytes) имеет SHA-256
  `d5e4ed776b32c04a06eed27eeffaf53746ab06cff19fa76cf00da69d6e20ca83`;
  reproducibility check и glTF Validator прошли, но это structural evidence;
- historical commit `19c8777` сохраняет opt-in Metro diagnostic и его
  non-device contract coverage; в current runtime routes/assets удалены;
- R3 AI-generated visual references имеют hashes/generation IDs и назначенные
  art/3D-source roles, но не являются R2 GLB/runtime renders; audited
  visual-source package содержал отклонённый R1 binary;
- отдельный `Finni_R3.glb` имеет SHA-256
  `4d035682e96917d234f5088e5fff03d0daecbad274d1481203a41d5588245830`,
  899920 bytes, 1 skin/15 joints, 4 actions, 0 validator errors/warnings и
  root delta zero. Это technical evidence, а не art/identity/runtime PASS;
  R3 PNG остаются mood/pose references, а `REF-001` — обязательным эталоном;
- отсутствуют side-by-side с исходным `REF-001`, product/legal acceptance
  provenance, device/runtime/performance, release evidence и independent art
  acceptance; S7-002 не `done`/PASS.

### Accepted 2D runtime and clean release (2026-09-21)

- DEC-2026-09-19-006 принят владельцем; DEC-2026-09-18-002 сохранён как
  superseded historical decision в visual-medium/renderer scope;
- current production shell остаётся `src/ui/AppRoot.tsx`; presentation-only
  `FinniHomeScene` использует local RN core images/animation и не импортирует
  application/domain/persistence;
- Filament, Worklets, GLB diagnostics и temporary S7-005 entry удалены из app;
- clean signed APK `finni-0.1.0-s7-006-release.apk`: SHA-256
  `8EB37A8DE5ADF9FF9FC38BD62282D31D8C2F26AC6F1D032F3A4F14CD82F8B32E`,
  v2 signature, 4 ABI, fresh API 26 install/run без Metro — PASS;
- API 26 Home/reduced-motion/modal и HOME/resume ×10 — PASS;
- Sprint 8–10 rebaseline заменяет model/rig/GLB requirements на layered masters,
  deterministic transforms/image swap/sprites и decode/cache/memory evidence;
- physical-device performance остаётся S10 gate: software AVD frame numbers не
  являются production performance PASS.





### S8-001: принятый spotted v2 подключён в код (2026-09-25)

Home теперь выбирает local neutral/blink по сохранённым shapeId/patternId: `pointy/plain` использует исходный S7 master; `pointy/spots` — принятый expressive spotted v2 из FINNI-POINTY-SPOTS-V1. Конструктор/PetAvatar показывает соответствующие растровые previews. Семь остальных комбинаций сохраняют прежние прототипы в конструкторе и master fallback в Home; полная матрица девяти не реализована.

Canvas/anchor/stage scales/idle/reduced-motion и persistence contract сохранены. Девять исходных экспортных слоёв и ORA упакованы вместе с двумя flattened runtime кадрами. Configured Verify PASS: 131 тест, lint/typecheck/content/fixtures. Device visual check пока BLOCKED: установленный старый debug APK API26 после Metro reload показывает пустой экран, cold launch — Unable to load script. Release/physical-device acceptance этим изменением не заявляется. Детали: `Finni App/artifacts/sprint-8/S8-001-spots-runtime/QA.md`; решение DEC-2026-09-25-011.


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


### 2026-09-25 — отдельные выражения лица, expressions-v1

Созданы `happy`, `thoughtful`, `inspired` для каждой из девяти принятых внешностей: 27 прозрачных кадров 941×1672, 243 экспортных слоя и девять редактируемых ORA в `Finni App/assets/2d/variants/FINNI-EXPRESSIONS-V1`. Новые лицевые детали перенесены из трёх Image Gen исходников в отдельный `pet-expression` поверх принятых neutral-слоёв. Хеши подтвердили, что neutral/blink/source.ora принятой матрицы не менялись; остальные восемь слоёв каждого нового состояния пиксельно совпадают с neutral.

Независимый Verify: точное восстановление 27 кадров из экспортов и ORA, 27 сочетаний внешности и стадии, 81 статическая проверка рендера, сохранение feet anchor `(470,1272)` и границ силуэта. Визуально осмотрены матрица выражений и крайние стадии. `npm run verify` прошёл 133 теста, content и fixtures; отдельный тест production-пакета также прошёл. Источники и превью: `Finni App/artifacts/sprint-8/S8-001-expressions-v1/README.md`.

Новые изображения зарегистрированы в `finni-expression-assets.ts`, но Home пока использует только neutral/blink. Художественный статус выражений — pending-owner-review. Переходы S8-003, Android runtime для новых состояний, release/offline и физическое устройство этим пакетом не проверялись. S8-001 остаётся in progress. Архитектурное решение и диаграммы не менялись.


### 2026-09-25 — мимика inspired уточнена по замечанию владельца

На обзорном листе пользователь указал, что первый и третий ряды не различаются. Заменён только донор лица inspired: взгляд явно направлен вверх, рот раскрыт шире. Пересобраны девять inspired кадров, их экспортные слои и ORA; neutral/blink и другие выражения не менялись. Независимый Verify повторно прошёл 27 кадров, 243 слоя, девять ORA и 81 рендер на стадиях. Дополнительно установлен порог различимости happy/inspired для всех девяти внешностей; наблюдаемая средняя RGB-разница лиц — 30.51–30.81. Configured Verify: 133/133 теста, lint/typecheck/content/fixtures PASS. Обновлённое сравнение: `Finni App/artifacts/sprint-8/S8-001-expressions-v1/review/expressions-27.jpg`. Художественная приёмка нового inspired остаётся открытой; решения и диаграммы не менялись.


### 2026-09-25 — художественная приёмка мимики 3×3

Владелец ответил: «Принимаю все вариации, что делаем дальше?». Приняты happy, thoughtful и исправленный inspired для всех девяти внешностей. Точные хеши 27 кадров, девяти ORA и обзорного листа закреплены в `Finni App/artifacts/sprint-8/S8-001-expressions-v1/acceptance.json`; production manifest `FINNI-EXPRESSIONS-V1` помечает 9/9 owner-accepted только при совпадении хешей. Пиксели и статические экспорты этим действием не менялись. Художественный gate мимики закрыт. Home пока показывает neutral/blink; следующий gate — runtime-смена выражений, transition/static equivalents S8-003, проверка сцены в базовых позах и Android/device evidence. S8-001 остаётся in progress; release/performance не объявлены готовыми. Нового архитектурного решения и изменения диаграмм нет.

### 2026-09-25 — мимика подключена к событиям Home

После успешных команд Home показывает принятые `happy`, `thoughtful`, `inspired`: покупка/награда за урок — happy; выбор цели — thoughtful; пополнение копилки, получение цели и смена стадии — inspired. Маппинг deposit → inspired выбран владельцем по SRS §8.1 и исправлен также в receipt; withdrawal остаётся calm. Сцена загружает кадр перед переходом, через 2,5 с возвращается calm, поддерживает reduced motion, пропуск goal/stage и отмену на навигации, модальной паузе или background. Результат команды уже сохранён и от презентации не зависит.

Android API 26 debug+Metro: событийные thoughtful/inspired/happy, skip/cancel и Home 9 внешностей × 3 стадии PASS. Сводное видео и 27 снимков: `Finni App/artifacts/sprint-8/S8-001-expression-runtime/QA.md`. Это дополняет прежнюю проверку 81 статического рендера выражений, но не заменяет signed/offline и физический S10 gate. `IMPLEMENTATION_DECISIONS.md` не менялся: новых архитектурных решений нет, маппинг следует SRS и выбору владельца. Диаграмма presentation flow обновлена до фактических AppRoot/FinniHomeScene.


### 2026-09-25 — S9-001: Home V4.2 и крупный текст

Home выделен в `src/ui/HomeScreen.tsx`: фон/питомец, HUD и навигация имеют отдельные слои. Обычный режим использует предметы-переходы и четыре нижние вкладки; крупный текст — одновременную полную сводку, меньшего питомца, CTA и modal-меню «Разделы» (DEC-2026-09-25-012). SafeAreaProvider учитывает системные Android insets. Modal/back закрывает верхний слой; возврат на Home обновляет snapshot. Покупки/накопления сохраняют прежние confirmation flows.

Цель отображает фактические savings/cost/remaining; пустая и завершённая коллекция имеют явные подписи. Занятие выбирается из доступного локального каталога: последняя незавершённая попытка, затем первое непройденное, затем следующее после последнего завершённого. Home history — read-only query, миграции и финансовые правила не менялись.

Все девять текущих внешностей используют общий anchor и три масштаба; выражения, pause/reduced-motion и явный skip сохраняются. Fallback расположен в области питомца. Проверки/ограничения фиксируются в `Finni App/artifacts/sprint-9/S9-001-layout/README.md`; физический Android/performance и полноценное озвучивание TalkBack не следует выводить из geometry XML.

Дополнительный S9 native presentation Verify: три выражения, app/system reduced motion, skip и background/modal cancellation подтверждены QA логами. Missing/corrupt Image source вызывают статичный fallback и сохраняют HUD/маршрут; после восстановления ресурса и возврата Home сцена возвращается. Object error сохраняет подписанные маршруты. QA инъекции отсутствуют в production TSX; исходные AVD данные/настройки восстановлены с проверкой хешей. Evidence: `Finni App/artifacts/sprint-9/S9-001-layout/fault-qa/` и `android/restore-final.json`. Это не проверка повреждения APK, TalkBack или физического устройства.

### 2026-09-25 — визуальная коррекция Home после замечания владельца

Предыдущий S9-001 UI отклонён владельцем по внешнему виду и читаемости, несмотря на технические geometry PASS. Home переработан после визуального сравнения с сохранённым reference/finni-home-approved.png: единая финансовая панель, тёплая контрастная палитра, раздельная типографическая иерархия, цельные подписанные боковые кнопки с локальными иконками, более крупный питомец на высоком экране, предметы у краёв комнаты, иллюстрированная нижняя навигация и терракотовый CTA. Положение питомца теперь учитывает измеренную высоту блока состояния/занятия.

В 150–200% фон комнаты приглушён отдельно от Финни; суммы, цель, остаток, состояние и занятие остаются видимыми одновременно. Исправлен тёмный текст large CTA. FontScale не ограничен. При пустой цели единица «Монеты» видима. Родительский barrier, финансовые подтверждения, существующие modal/back и мимика сохранены.

Configured Verify и native evidence находятся в Finni App/artifacts/sprint-9/S9-001-redesign/README.md. Усиленная native-матрица проверяет реальные пересечения targets и выявила два исправленных дефекта 360×640/100%, которые старая проверка размеров не обнаруживала. Новый визуальный результат implemented-for-owner-review, художественная приёмка не присвоена автоматически. Physical/performance и настоящий TalkBack остаются NOT RUN. Решение DEC-2026-09-25-012 о строгой сводке сохраняется; финансовая архитектура и topology диаграммы не меняются.


### 2026-09-25 — облегчённый Home и полноценный короткий профиль

По уточнению владельца верхняя сводка, состояние/занятие, боковые кнопки и навигация используют общий тёплый материал rgba(255,248,235,.78). Прозрачность применяется к поверхности; текст и иллюстрации остаются непрозрачными. Вторичный текст затемнён до #514537; консервативный расчёт на чёрном подложенном фоне даёт 5,22:1. Иллюстрации заботы, планера и копилки объединены с подписями в цельные панели 78×72 dp.

Финансовый HUD на базовых Android профилях стал ниже: 133→119 dp. Короткий 360×640 использует отдельные отступы, заботу/планер слева, копилку справа и увеличенный центральный резерв Финни. Для стадии 2 расчётная высота объединённого силуэта выросла 125,8→155,4 dp. В промежуточном fontScale 105–120% короткий режим отдаёт ширину цифрам за счёт декоративных денежных изображений, расширяет боковые кнопки и использует предметные панели высотой 64 dp. Это устраняет обнаруженные в Android 119% перенос чисел/слова и пересечения; текст не уменьшается и не обрезается.

При 150–200% сохраняется строгая одновременная сводка DEC-2026-09-25-012, общий материал и приглушённая комната (opacity .18). Evidence и фактические Verify: Finni App/artifacts/sprint-9/S9-001-polish/README.md; финальные изображения — review/, исходные screencap/XML — android/. Финансы, renderer, выражения, modal/back и topology диаграммы сохраняют прежние контракты. Художественная приёмка владельца не присваивается автоматически; физический Android/performance и настоящее озвучивание TalkBack остаются NOT RUN.


### 2026-09-25 — структурный Home по DEC-2026-09-25-013

По явному согласию владельца Home существенно пересобран: единый финансовый блок с предметом мечты, крупный Финни в спокойной native-сцене, состояние рядом, одно занятие, контекстный следующий маршрут и одна модель Домик/План/Покупки/Копилка. Боковые дублирующие предметы/маршруты удалены из Home; прогресс, полный каталог занятий, справка, сведения о питомце и защищённый взрослый раздел доступны через подписанное меню.

Короткий 360×640 имеет собственную компоновку. При fontScale >1.2 используется портрет из неизменённых принятых PNG; все обязательные данные и полное название занятия видны одновременно, без text clipping или fontScale clamp. Полнофигурные стадии сохраняют общий якорь лап. Из native rect расчётная высота силуэта стадии 2: 157,05 dp short / 241,22 dp ordinary. Портрет кадрирует нижнюю часть тела, сохраняя уши/лицо/выражение.

Новый чистый home-next-step выбирает существующий маршрут: еда/уход, выбор мечты, накопления либо предварительный итог. CTA не покупает, не переводит и не завершает день; native подтверждения сохранены. Название занятия открывает именно рекомендованный урок через прежний openLesson; каталог остаётся в меню. Финансовая архитектура не менялась.

Evidence: Finni App/artifacts/sprint-9/S9-001-structure/README.md. Configured Verify 138/138 PASS; 74 native профиля; 11 fault/animation checks; exact delivery 21 checks + 3 contextual checks; offline API26 APK без Metro; исходные данные/settings AVD восстановлены с совпадением восьми hashes. Визуальный результат implemented-for-owner-review; geometry не означает художественное принятие. Physical/performance и настоящее TalkBack остаются NOT RUN. DEC-013 и S9_001_HOME_LAYERS описывают новую композицию/навигацию.

### 2026-09-25 — постоянные пять разделов и завершающие исправления Home

Согласованное уточнение DEC-2026-09-25-013 реализовано: AppRoot владеет общей навигацией Домик/План/Покупки/Копилка/Ещё, selected соответствует root. Ещё содержит каталог, прогресс, Имя и внешность, справку и прежний взрослый barrier. >120% — тот же набор списком через Меню. Android float32 120% нормализуется только для выбора layout; текст не ограничивается.

Пропуск отделён от навигации; крупные цель/занятие сохраняют chevrons; достигнутая цель сообщает возможность получения, действие видно в начале копилки. Состояния Home13sp, занятие16sp;119% эмоция и панели перепроверены визуально. Три финансовых roots получили тёплую общую оболочку. Details не содержат bar и возвращаются к источнику; direct Home lesson сбрасывает прежний origin. Native финансовые подтверждения/команды сохранены.

Configured Verify142tests/lint/typecheck/content/fixtures PASS. Полная native матрица76cases выявила2float32-boundary дефекта; после исправления оба повторены PASS вместе с3ключевыми профилями точного deliveryAPK. Остальные74cases прошли исходно. Routes27checks, financial7checks, exactdelivery10checks, QA12behavior+4refined checks, offlineAPK, fullmap и whitespace PASS; исходные данные/настройки AVD восстановлены по8SHA256. Разные APK hashes и отрицательные промежуточные результаты сохранены честно.

Evidence: Finni App/artifacts/sprint-9/S9-001-navigation/README.md, review/, matrix-resolution.json. Новых доменных/SQLite/art/renderer изменений нет. Реальное TalkBack, дети/родители, physical/performance NOT RUN; S9-001 не объявляется безусловно закрытой. Диаграмма S9_001_HOME_LAYERS и task обновлены, принятие новых screenshots владельцу не приписано.


## 2026-09-25 — единый стиль вложенных экранов S9-003/004

После приёмки пяти roots выполнено прямое поручение владельца распространить их стиль на остальные реально существующие экраны. Добавлены небольшие presentation-модули `screen-theme` и `DetailBack`: единая тёплая палитра, текст 16sp для основных объяснений, карточки/поля/кнопки, доступные targets и возврат. AppRoot теперь учитывает системные insets у деталей и onboarding, Help modal — отдельно. Крупный текст прокручивается без cap/ellipsis.

Обновлены intro/create/edit pet, каталог всех восьми тем/вариантов, LessonShell с draft/evaluation/explanation/completion и пять renderers, History с раскрываемыми сохранёнными разборами, Help, Adult gate/controls и PeriodResult. В редакторе при увеличении шрифта выбор становится вертикальным; checkbox/radio/selected/disabled имеют видимое и семантическое представление. Каталог показывает ошибку открытия занятия, блокирует повторный выбор при busy. Взрослая сводка больше не сообщает об отсутствии уже реализованного учебного модуля.

Application/domain/persistence, схема БД, signed content, экономические команды и исходные изображения не изменены. Пять принятых roots сохраняют свой стиль; дочерние финансовые формы проверены повторно. Отдельных Settings/Family/товарных detail routes нет; ledger находится в History, preferences — у взрослого. SectionScreen остаётся недостижимым fallback для неизвестного названия. После закрытия периода AppRoot возвращает Home; сохранённый итог доступен в History, поэтому closed-ветвь PeriodResult не выдаётся за отдельный пройденный пользовательский экран.

Итоговый configured Verify:142 tests/lint/typecheck/content/fixtures PASS; offline APK, whitespace и full belief-map PASS. Native evidence:8 завершённых уроков и17 проверок сохранения,53 matrix checkpoints,7 финансовых e2e; после исправления error-focus на предпоследнем delivery APK (перед локальной правкой StatusBar) — 6 states, 6 дочерних финансовых, 9 adult/night PASS; на точном финальном APK — 19 delivery checks и 3 boot-error/retry checks PASS. Ошибка открытия последнего урока при200% теперь полностью видна сразу под Back; каталог возвращается к ней без анимации. Superseded UIA assertion и промежуточные negative logs сохранены.

Missing/corrupt image fallback и loading100/200%: 4 PASS на отдельной QA сборке. Product source побайтно восстановлен, установленный delivery SHA256 проверен; source/APK lineage не смешивается. Delivery SHA256: `42d1a247ef6f7a8220d993f89b84a89a0f87dc3ab20d1a7e0f2b8da551e4d0d9`. Восемь исходных AVD файлов и настройки восстановлены по SHA256. Реальный TalkBack, физический perf/устройство и внешнее детское/методическое ревью NOT RUN. На момент этого UI-пакета native old-schema migration отдельно не повторялась; schema6 install-over сохранял все8 файлов. Поздний прогон schema 2→6 описан ниже.

Полный инвентарь, точные журналы/версии, screenshots и ограничения: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`. S9-003/004 фиксируют внедрение; 2026-09-26 владелец явно принял художественный результат новых вложенных экранов («принимаю»). Визуальный gate закрыт; перечисленные NOT RUN проверки сохраняются. S9-002 не реализован этим пакетом.

## 2026-09-26 — S9-002 persisted-result presentation и native schema 2→6

`AppRuntime` теперь предоставляет receipts для покупки, перевода в/из копилки, выбора/получения цели и закрытия периода; существующие snapshot-методы сохранены как обёртки. Завершение занятия уже возвращало receipt. `AppRoot` защищает отправку от синхронного двойного нажатия, ждёт успешного commit и нового persisted snapshot, после чего передаёт receipt в `ReceiptPresentationController`. Тот проверяет `commandId`, профиль, режим, `sessionEpoch`, revision; повторный или устаревший результат не ставит эффект в очередь. Событие сохраняет точные `before/after`, очередь ограничена, milestone имеет приоритет. Отмена, смена маршрута/профиля/режима, reset и boot очищают временные эффекты. Вход в Home показывает допустимую ожидающую реакцию; награда занятия показывается в LessonShell из подтверждённого события и не теряется при возвращении к плану, покупкам, копилке или истории. Завершение клипа и уход с урока меняют только presentation state. История receipts при старте не проигрывается.

Интеграционные тесты покрывают реальную SQLite идемпотентность, storage rollback, crash-after-commit до доставки, stale context, cancel и приоритеты. Configured Verify, offline x86_64 QA APK и native API 26 smoke прошли. На отдельном AVD старый APK создал schema 2, профиль, wallet 100/0 и `OpenPeriod`; сохранённая копия schema 2 повторно восстановлена в старом приложении для проверки точного финального APK hash `4e1d7b5f2ac2bf54349758ecda2d2d83b9dca2b333903f0e59bb7134a4e40651`. Install-over мигрировал базу до schema 6. Profile, wallet, period и исходный receipt совпали до/после; SQLite integrity `ok`. На финальном APK покупка IT-01 дала 70/0 и реакцию после commit; после restart сохранились один `ConfirmPurchase` и спокойное состояние без replay. Завершение LS-B01 показало награду 20 из receipt перед возвратом к плану; после restart wallet 90/0, один `CompleteLesson` receipt, одна `LESSON_REWARD` ledger entry и без повтора реакции. Evidence: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`. Этим закрыт ранее отмеченный пробел native old-schema install-over S9-003/004; historical пометка об отсутствии повторения в предыдущем пакете остаётся верной для того момента.

По DEC-2026-09-26-014 реализация Sprint 9 готова к S10-001. S9-001/003/004 остаются `partial` по внешним device/TalkBack/performance/независимым проверкам, S9-002 — `done`. Итоговый PASS Sprint 9 будет определён после S10-001/002; эти проверки больше не требуют собственного предварительного PASS. SQL schema, экономика и публичные command contracts не изменились. Физическое устройство, spoken TalkBack, 15-minute stress, независимые art/product и детское/методическое ревью не объявляются пройденными.
