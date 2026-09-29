# S9-002 — persisted results и native old-schema upgrade

## Поставка

- `finni-s9-002-api26-qa.apk`: offline x86_64 QA release для API 26, подписан публичным локальным debug keystore. SHA256 `4e1d7b5f2ac2bf54349758ecda2d2d83b9dca2b333903f0e59bb7134a4e40651`; установленный `base.apk` имеет тот же hash.
- `schema2-to-6-home.png`: первый Home после установки поверх старой базы.
- `purchase-committed-reaction.png`: одна подтверждённая покупка, 100→70, состояние «Радостно».
- `restart-no-replay.png`: после force-stop/restart доступны 70, состояние «Спокойно»; праздник не повторяется.
- `lesson-reward-committed.png`, `lesson-reward-restart.png`: на экране завершённого LS-B01 видна награда из receipt 20 монет; после возврата к плану и restart доступны 90, реакция не воспроизводится повторно.
- `verify.log`, `build.log`, `belief-map.log`: точный вывод проверок и сборки.
- `native-sqlite-audit.json`: проверенная сводка четырёх native SQLite snapshots (schema 2, после миграции, после покупки, после урока).
- `source-hashes.json`: SHA256 ключевых исходников/тестов dirty worktree и exact QA APK.

## Поведение S9-002

`AppRuntime` отдаёт persisted `CommandReceipt` для purchase, savings transfer, select/claim goal и close period. `CompleteLesson` уже возвращал receipt. `AppRoot` разрешает только одну незавершённую отправку команды, сначала ждёт receipt и обновлённый snapshot, затем передаёт событие в `ReceiptPresentationController`. Контроллер проверяет commandId/profile/mode/sessionEpoch/revision, отбрасывает повтор и устаревшую доставку, сохраняет точные `before/after`, ограничивает очередь четырьмя эффектами и очищает её при смене контекста, маршрута, reset, boot или отмене. Завершение/пропуск эффекта не вызывает доменную команду. После успешного commit и сбоя последующей загрузки экран сообщает, что действие сохранено, и не показывает недостоверную реакцию.

Эффекты покупки, переводов, выбора/получения цели, начисленной награды и роста стадии выбираются из receipt. Эффекты финансовых деталей видны при ближайшем возврате в Home; переход на другой маршрут отменяет ожидающий показ. Начисленная награда занятия показывается в `LessonShell` сразу после persisted receipt и обновления snapshot: её сумма берётся из точного `before/after` события, а переход к плану, покупкам, копилке или истории отменяет активную презентацию. Старт приложения загружает только snapshot и не восстанавливает декоративную очередь.

## Native migration — финальный APK

Отдельный AVD `finni_s9_migration_api26` создан в `C:\tmp\finni-s9-migration-avd`; исходные пользовательские AVD не изменялись. Android API 26, x86_64, viewport 320×640. Исторический `artifacts/sprint-1/finni-0.1.0-s1-004-r4-release.apk` (оригинальный SHA256 `3486da3b6f0bfc46fc03d52ce2e2c825df818cee62a222d24732bf0edd6b2804`) переподписан тем же публичным debug ключом исключительно для install-over; SHA256 временной QA копии `d0a880f75f528d5fb83f1143d94369de3d387bfe97950ae0d665a9c003536025`. Оригинал сохранён без изменений.

На старой версии через native UI создан профиль с `shape=round`, `pattern=stripes`, открыт день 1; SQLite schema 2 сохранена как отдельная копия. Для повторной проверки точного финального APK историческое приложение установлено заново только на изолированном AVD, schema 2 восстановлена из этой копии и подтверждена старым Home (`schema2-restored-home.png`). До обновления SQLite `user_version=2`, wallet `(100,0)`, period `(1,DRAFT)`, один `OpenPeriod` receipt. `adb install -r` финального APK вернул `Success`. Приложение запустилось с прежним профилем и 100 монетами. Копии SQLite+WAL до/после сверены: profile id/name/shape/pattern, wallet, period index/state и полный исходный receipt совпали; после обновления `user_version=6`, `PRAGMA integrity_check=ok`.

На финальном APK создан план 40/30/30, затем через native Alert подтверждена покупка IT-01 за 30 с дополнительным быстрым нажатием. Home показал 70 и реакцию после сохранения. После force-stop/restart: один `ConfirmPlan`, один `ConfirmPurchase`, один `OpenPeriod` receipt; одна purchase row IT-01/30; wallet `(70,0)`, `user_version=6`, `integrity_check=ok`; реакция не повторилась. Затем LS-B01 пройден с учебным планом 40/30/30 и обязательным объяснением. Сохранённое завершение показало в LessonShell «Финни радуется! Получено 20 монет» перед штатным возвратом к плану. После restart wallet `(90,0)`, ровно один `CompleteLesson` receipt и одна `LESSON_REWARD` ledger entry на 20; повторной реакции нет. До этого на предварительной сборке отдельно проверен cancel покупки; окончательные migration/purchase/lesson проверки относятся к точному APK hash `4e1d…`.

## Verify

- `npm run verify` — PASS: lint, typecheck, 147/147 tests, content, fixtures (включая economy-v2 B=40/S=30/total=70/growth=13/stage=3).
- `node --test tests/receipt-presentation.test.mjs` — PASS: persisted replay, stale context, cancellation, storage rollback, crash-after-commit, priority/completion.
- `python -B C:\tmp\codespaces-go\scripts\build_belief_map.py --full .` — PASS после новых imports, 246 nodes/758 edges.
- Gradle offline `:app:assembleRelease -PreactNativeArchitectures=x86_64 --offline` — PASS; финальный APK выше.
- Native API 26 schema 2→6, install-over, restart, single purchase — PASS.
- `git diff --check` — результат фиксируется в задаче после финального редактирования.

Физическое устройство, TalkBack speech, performance, независимое детское/методическое ревью относятся к S10-001/002. QA APK не является production ARM/signing acceptance.
