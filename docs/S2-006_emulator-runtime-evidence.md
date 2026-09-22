# S2-006 — проверка Android runtime на эмуляторе

Дата проверки: 2026-09-22
Ветка: `S2-006/verify-sprint2-android-runtime` (`498aef79f37356dfa0c52bd2dff5354a6c62005e`)

## Контур

| Параметр | Значение |
| --- | --- |
| AVD | `finni_s7_005_api26` (Pixel 2) |
| Android / ABI | Android 8.0, API 26, `x86_64` |
| Экран | 1080×1920 px, физическая плотность 420 dpi; отдельно проверен override 480 dpi = 360 dp ширины |
| RAM AVD | 2 GiB (`MemTotal: 2046760 kB`) |
| APK | signed release, без Metro; `com.meshnavigator.finni`, versionCode 1, versionName 0.1.0, minSdk 26 / targetSdk 36 |
| Размер / SHA-256 APK | 78 786 477 bytes / `BA29F9160D6CE6F14A384D97787FA1E4FDAA889CAEBD0C7E0BD487F4887369AD` |
| Подпись | APK Signature Scheme v2; SHA-256 сертификата `902d920bbc11ef0d704766edfe9e983d2cf96581417b30376ebe974e15495b7d` |

Сборка проходила в ASCII временной копии, поскольку нативная CMake-сборка из рабочего пути с кириллицей не воспроизводится. Это не меняет исходники или APK; актуальный release собран из текущего HEAD. Учётные данные подписи использованы локально и в отчёте не раскрываются.

Команды контура: `adb install -r <release.apk>`, `adb shell am force-stop com.meshnavigator.finni`, `adb shell am start -W -n com.meshnavigator.finni/.MainActivity`. Для стабильного `uiautomator dump` временно включался Android Reduce Motion через `transition_animation_scale=0`, затем настройка возвращена в default. Домашняя сцена намеренно анимируется, из-за чего без этого Android UIAutomator ждёт idle; это не FATAL приложения.

## Результаты runtime smoke

| Сценарий | Статус | Наблюдение |
| --- | --- | --- |
| Release install и первый cold start | PASS | Установка успешна; `am start -W`: 871 ms. |
| Shop: каталог | PASS | В UI доступны все 8 товаров. |
| Shop: preview, confirm, повторное нажатие | PASS | Preview праздничного меню: 40, остаток 60; два быстрых tap дали один расход, повторный выбор сообщил, что покупка уже выбрана. |
| Shop: недостаток средств | PASS | При 60 и товаре за 90: «Не хватает 30 монет». |
| Savings | PASS | Preview/confirm 50: кошелёк 60→10, копилка 0→50; снятие 70 сообщило «не хватает 20 монет»; цель выбрана. |
| Ledger / History | PASS | Одна покупка 40 и одно пополнение 50 показаны в журнале. |
| PeriodResult | PASS | Нужды/хочу/накопление отображены; подтверждение закрытия дня, итог дня и +1 рост успешно показаны. |
| Help / Adult gate | PASS | Справка открывается; gate 2+3=5 открывает взрослый раздел. |
| Demo isolation, reset, delete | PASS | Demo имеет чистый профиль; reset demo и delete normal выполнены только над тестовыми данными AVD; normal не смешивается с demo. |
| Process-kill / cold recovery | PASS | Force-stop сразу после создания профиля и после сохранённого состояния, затем запуск: профиль доступен, без FATAL. Детерминированные core-тесты дополнительно покрывают границы до/после receipt и COMMIT. |
| 360 dp / 48 dp | PASS | При 480 dpi ширина 360 dp; кнопки Home «О питомце», «Как играть», «Начать день» имеют 144 px = 48 dp. Плотность затем возвращена в 420 dpi. |
| Пять cold starts | PASS | 920, 869, 1108, 872, 1007 ms; среднее 955.2 ms. |
| Bounded storage pressure | PARTIAL PASS | На `/data` (10 GiB) создан ровно 512 MiB `/data/local/tmp/finni-s2-006-fill`, свободное место 9.4→8.9 GiB. App повторно запущен: UI с профилем/100 монет восстановлен, FATAL/`SQLiteFullException` не обнаружены. Filler удалён, `test ! -e` PASS, свободное место восстановлено до 9.4 GiB. Это не реальный `SQLITE_FULL`. |
| Реальный disk-full на AVD | NOT RUN | Не выполнялся: заполнение почти всего `/data` небезопасно для стабильности эмулятора. Логика atomic rollback при `SQLITE_FULL` покрыта детерминированным `core-regression.test.mjs`. |

## Контролируемое обновление v4 → v5

Исторический v4 APK имел другой signing lineage, поэтому Android не позволил бы использовать его для достоверного in-place update текущего signed APK. Для проверки создан **только во временной ASCII-копии** controlled v4 surrogate: текущие исходники с `SCHEMA_VERSION=4` и без v5 migration, но с тем же package/signing certificate. Active worktree не менялся.

| Шаг | Результат |
| --- | --- |
| Controlled v4 build | PASS: 78 783 477 bytes, SHA-256 `6EABEAC429FD146246503BBEF314EA8602382A3A3CBF44A2CDC57D1E736A584B`, v2 signature, тот же certificate `902d…5b7d`. |
| v4 clean install и данные через UI | PASS: создан `Финни`, открыт День 1, UI показывает кошелёк 100 / копилка 0. |
| Снимок v4 SQLite с WAL | PASS: `PRAGMA user_version=4`; профиль `Финни`; `wallet_projection`: 100 / 0. |
| `adb install -r` current v5 | PASS. |
| v5 UI и SQLite с WAL | PASS: UI сохраняет `Финни`, День 1, 100 / 0; `PRAGMA user_version=5`; `profile_state.pet_stage=1`. |

Это подтверждает реальную in-place миграцию schema 4→5 с тем же applicationId и signing lineage на API 26 emulator. Не является тестом старого исторического APK с его отдельным сертификатом.

## Артефакты и ограничения

XML-снимки UI и SQLite forensic-копии размещены в временном каталоге `C:\tmp\finni-s2-006-*` текущей среды: в частности `upgrade-v4-wallet.xml`, `upgrade-v5.xml`, `storage-pressure.xml`, `upgrade-v4-db/` и `upgrade-v5-db/`. Они не добавляются в Git, чтобы не включать пользовательские runtime data.

Проверка проведена только на Android emulator. Физическое устройство, OEM-specific storage/process behavior, реальная деградация при полном диске и production lineage исторической версии остаются рисками и переносятся в финальный Sprint 10 согласно решению по S2-006.
