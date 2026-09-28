# S4-003 — аудит безопасности, offline, backup и происхождения

Дата: 2026-09-28. Исходный commit: `f86dc29` (`S4-003/security-offline-backup-and-licenses`). Это аудит исходного дерева и ранее сохранённого QA evidence. Итоговый release gate **OPEN**.

## Критерий и границы

Сверены S4-003, SRS v1.3 §§17.2–17.4, 22.4, 22.8 и NFR-08/09/15/19, текущая реализация и решения. PASS возможен после проверки точного поставочного APK без сети, удаления и восстановления на Android, скана секрета по всей истории и подтверждения условий использования всех поставляемых материалов. Ни один из этих внешних/артефактных пунктов не выводится из исходного manifest или зелёного текстового поиска.

## Исходники и Android-конфигурация

| Область | Факт на commit `f86dc29` | Ограничение |
|---|---|---|
| Release permissions | `android/app/src/release/AndroidManifest.xml` удаляет `INTERNET`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`. Main manifest их не запрашивает. | Нужен `aapt dump permissions` точного поставочного APK после финальной сборки. |
| Backup | Main manifest задаёт `allowBackup=false`, `fullBackupContent` и `dataExtractionRules`. Оба XML исключают root/file/database/sharedpref/external и device-домены для cloud backup/device transfer. `app.json` и config plugin содержат ту же политику. | XML и флаг не доказывают поведение OEM/device transfer. Нужны backup/restore и uninstall/reinstall на Android 11 и 12+. |
| Сеть | Поиск `fetch`, `XMLHttpRequest`, `WebSocket`, `axios`, `expo-updates`, `firebase`, `sentry`, `analytics`, `advert`, `telemetry` в `src`, `plugins`, `content` не дал совпадений. URL в проверенных исходниках относятся к Gradle/Schema/комментариям. | Статический поиск не доказывает отсутствие сетевого кода внутри native SDK или фактического трафика. `maven { url 'https://www.jitpack.io' }` относится к build, а не runtime. |
| Удаление | `src/persistence/expo-admin-data.ts` вызывает `SQLite.deleteDatabaseAsync` для известной normal/demo БД; координатор восстанавливает незавершённую административную операцию. | `verifyModeDataAbsent()` подтверждает разрешение delete API и возвращает `true`, не проверяя файловую систему. Не проверены WAL/SHM/локальные копии и восстановление после delete на устройстве. |

Ранее сохранённый [M1-security-api26-qa](../M1-security-api26-qa/README.md) фиксирует `aapt` для тестово подписанного release-варианта SHA-256 `143F6920C418F7811E1B2F2F0B5BAF4DE1E8AFD0277106C08E7705644648D444`: только служебное разрешение, `allowBackup=false`, оба XML в ресурсах. На API 26 после Airplane mode/отключения Wi-Fi прошёл force-stop/restart с сохранением demo B120/S40. Это **не** точный текущий поставочный APK и **не** TC-074 целиком: полный обязательный flow, первое offline открытие, uninstall/reinstall и backup/restore там не выполнялись. Исторические APK до manifest fix остаются в `artifacts/sprint-0`, `sprint-1` и `sprint-7`; их нельзя повторно поставлять как прошедшие S4-003.

## Secret scan

- `rg --files` по расширениям `*.jks`, `*.keystore`, `*.p12`, `*.pem`, `.env*`, `local.properties` — 0 файлов в текущем видимом дереве.
- `git log --all --pretty=format: --name-only | rg` по именам ключей, env и `local.properties` — 0 исторических путей.
- `git log --all --format=%H -G <PEM/AWS/GitHub/OpenAI signatures> -- src android plugins scripts content app.json` — 0 commits с такими добавлениями/удалениями; команда выводила только commit IDs, не значения.
- `rg -l` по PEM header и распространённым AWS/GitHub/OpenAI token signatures в текстовых файлах дерева — 0 совпадений. Поиск присваиваний password/secret/token в `src`, `android`, `plugins`, `scripts`, `content`, `app.json` указал только `android/app/build.gradle`, где signing passwords считываются из переменных окружения; значений в файле нет.
- Полный content scan всех Git blobs/revisions специализированным scanner и скан расшифрованного поставочного APK **NOT RUN**. Поэтому утверждение «секретов нет в истории/артефакте» пока не доказано. Никакие найденные значения не выводились.

## Зависимости и лицензии

[`npm-cyclonedx-1.5.json`](npm-cyclonedx-1.5.json) — CycloneDX 1.5 инвентарь из `package-lock.json` на указанном commit: 744 package instances, из них 481 без `dev: true`, 263 с `dev: true`. У всех 744 в lockfile есть version, `registry.npmjs.org` resolved URL, SHA-512 integrity и license expression. Это полный lockfile-срез, включая optional пакеты чужих платформ; фактический состав APK меньше и требует отдельного сопоставления.

| License expression в lockfile | Instances |
|---|---:|
| MIT | 632 |
| ISC | 40 |
| Apache-2.0 | 27 |
| MPL-2.0 | 12 |
| BSD-2-Clause / BSD-3-Clause | 9 / 8 |
| BlueOak-1.0.0 | 6 |
| Unlicense / 0BSD | 2 / 2 |
| (MIT OR CC0-1.0) / (MIT OR Apache-2.0) | 2 / 1 |
| Python-2.0 / CC-BY-4.0 / (BSD-3-Clause OR GPL-2.0) | 1 / 1 / 1 |

Особо проверить notice/attribution для `caniuse-lite` (CC-BY-4.0), выбранную лицензию для `node-forge` (BSD-3-Clause OR GPL-2.0), применимые notice/MPL source obligations для `lightningcss` и его platform packages. `package-lock.json` не содержит транзитивный Gradle dependency graph или лицензионные тексты бинарников APK. `android/build.gradle` допускает JitPack; фактических resolved артефактов оттуда этот npm inventory не проверяет. Корневой `LICENSE` называет Expo/650 Industries, а не владельца проекта; не следует трактовать его как подтверждённое лицензирование собственного кода проекта.

## Материалы и AI provenance

| Семейство | Зафиксированный источник | Незакрытые поля / scope |
|---|---|---|
| App/adaptive icons, favicon, splash | Файлы есть в `assets/`, используются из `app.json`. | Отдельный source/rights manifest для этих шести исходных файлов не найден. |
| Home UI icons | `assets/ui/home-v2/asset-manifest.json`: оригинальные repo-native рисунки и hash каждого PNG. | Не найден отдельный rights/условия публикации; для собственных рисунков требуется подтверждение владельца. Старые `assets/ui/home` SVG/PNG также требуют разграничения shipped/unshipped. |
| Finni master/matrix/expressions/puppet/gesture | Семейные `asset-manifest.json`, исходные ORA, hashes, generation/evidence и owner acceptance связывают варианты и производные exports. | Материалы ImageGen не имеют единого полного реестра `service`, точной `model`, ссылки и даты условий использования по NFR-19. Нельзя заменять эти поля общим `rights` или acceptance. |
| Room objects/catalog | `assets/2d/room/S8-002/IMAGEGEN_PROVENANCE.md`, exact prompts/master hashes, build lineage; owner подтвердил visual-use authority для contest/public APK. | Документ прямо говорит, что backend model ID и seed инструмент не предоставил. Ссылка и дата применимых условий не указаны; подтверждение владельца не является независимым юридическим заключением. |
| Fonts/audio | Поиск `*.ttf`, `*.otf`, `*.mp3`, `*.wav`, `*.ogg` в `assets/` дал 0 файлов. | Проверить фактическое содержимое точного APK, включая native bundled ресурсы. |

**NFR-19 / TC-148: OPEN.** Для каждого shipped AI material нужны точные доступные сведения о сервисе/модели или явная запись, что backend ID не раскрыт, дата и URL условий использования, исходные референсы/их права и ручная доработка. Данные не следует выдумывать. Нужен release asset set, чтобы отличить source-only masters от упакованных ресурсов.

## Следующие обязательные gates

1. Собрать окончательный release APK с внешним release key, зафиксировать source commit и SHA-256, проверить `aapt` permissions/manifest/resources и содержимое APK. Нынешний QA APK подписан Android Debug сертификатом.
2. На чистом Android API 26 впервые открыть этот APK в Airplane mode, выполнить обязательный цикл с восемью уроками/локальными ассетами без Metro; повторить на Android 12+ для backup/data extraction поведения.
3. Создать normal и demo профили, проверить reset/delete каждого режима, отсутствие старых данных после force-stop/relaunch, uninstall/reinstall и доступного cloud/device restore; сохранить отдельность режимов. Ограничения OEM и физического стирания указать отдельно.
4. Запустить full-history secret scanner без вывода значений и проверить exact APK на ключи, credentials, нежелательные runtime SDK/permissions и release contents.
5. Разрешить отсутствующие rights/terms/model поля для shipped графики, проверить Gradle dependency graph и notices; только затем выставить TC-148/NFR-19 PASS.

## Фактический Verify этого пакета

- Source manifest, backup XML, app config, delete adapter и network keyword scan — PASS как статический аудит указанного commit.
- Текущий файловый/ограниченный Git-path secret scan — PASS по указанным шаблонам; full-history content/APK scan — NOT RUN.
- Парсинг lockfile в CycloneDX: 744/744 entries имеют version/license/resolved/integrity, non-registry npm resolved = 0 — PASS для npm inventory.
- `npm ci --offline` — PASS: 707 installed, npm audit при установке сообщил 0 известных vulnerabilities. Это не заменяет Gradle/dependency license review.
- `npm run verify` — PASS после временной CRLF→LF нормализации 12 signed content JSON в checkout: lint, typecheck, 155/155 tests, content (8 lessons) и fixtures (demo A.1–A.12). Первый запуск: lint/typecheck/155 tests PASS, content FAIL на raw-byte SHA-256 `catalogs/assets.json`. Причина — `core.autocrlf=true` в Windows checkout, меняющий байты подписанного bundle; нормализация не дала содержательного Git diff. После проверки временные изменения 12 файлов возвращены через `git restore`, исходники в diff отсутствуют. Системная настройка line endings требует отдельного исправления (S4-001).
- Belief map: full build PASS (268 modules/812 edges); `search`→`analyze`, `deps`/`rdeps`/`boundary` для `src/persistence/expo-admin-data` PASS. Прямые границы: `app-control`, `lifecycle-coordinator`, `contracts`, `database`; прямой потребитель — `production-app-controller`. Изменений source imports/routes/SQL не было.
- `android/gradlew.bat :app:dependencies --configuration releaseRuntimeClasspath --offline --console plain` — FAIL при конфигурации на `Missing required release signing variable: FINNI_RELEASE_STORE_FILE`, до вывода dependency graph. Временный ключ/пароль для обхода signing gate не вводились; Gradle native license inventory остаётся OPEN.
- Android Gradle release, exact APK scan и device checks — NOT RUN: общий AVD используется другим пакетом; текущий поставочный release APK в этом worktree не собран. Доступное историческое API26 evidence перечислено выше.
- `node` JSON parse/count CycloneDX — PASS, 744 components; `git diff --cached --check` — PASS.
- Изменение ограничено audit artifact; `IMPLEMENTATION_DECISIONS.md`, `CURRENT_IMPLEMENTATION.md` и workflow diagrams не менялись. Нового принятого архитектурного решения или runtime поведения нет.
