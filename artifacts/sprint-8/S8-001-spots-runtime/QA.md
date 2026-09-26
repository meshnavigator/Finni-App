# S8-001 — интеграция принятого expressive spotted v2

2026-09-25. Код и ассеты интегрированы. Configured Verify PASS. Runtime smoke PASS на API26 debug + Metro; S8-001 остаётся in progress (неполная матрица).

## Основание и scope

Владелец художественно принял v2 и ответил «Подходит» на предложение включения в приложение. DEC-2026-09-25-011 фиксирует scope `pointy/spots`; нормативное ТЗ §2.6 и SRS FR-03/TC-003 всё ещё требуют девять комбинаций. Сейчас принятые production изображения есть для `pointy/plain` и `pointy/spots`; остальные семь не закрыты.

## Реализация

- Production пакет `assets/2d/variants/FINNI-POINTY-SPOTS-V1`: neutral, blink, две constructor preview, 9 исходных экспортных слоёв, ORA и SHA manifest.
- `finni-appearance-policy.ts` разрешает ровно две принятые пары. `finni-appearance-assets.ts` содержит static local require; остальные комбинации сохраняют прежний Home fallback.
- Home выбирает оба кадра по сохранённому профилю. PetAvatar показывает соответствующий принятый preview в конструкторе; при decode error остаётся прежний fallback. Домен, SQLite и financial state не менялись.
- Canvas, anchor, stage transform, idle, reduced-motion и lifecycle cleanup сохранены. Нейтральный master и исходный blink не изменены.

## Фактические проверки

- `npm run verify`: exit 0; ESLint, TypeScript, 131 тест (0 fail), content 1.2.0, fixtures PASS. Лог `configured-verify.log`.
- Упаковка `build_runtime_assets.py`: принятый neutral 0 различий; blink 0 различий вне принятого окраса и 0 alpha-различий. 31013 пикселей окраса. SHA проверяются тестом для 13 PNG и исходного ORA.
- Визуально осмотрен `neutral-blink-audit.png`: пятнистые лапы сохраняются при закрытых глазах, исходная белая грудка, мордочка и силуэт сохранены. Это статический аудит кадров, не device animation PASS.
- Independent v2 `verify_coat.py`: ORA/exports/composite совпадают; лицо/уши/хвост и восемь слоёв вне body сохранены. Исторический отчёт в исходном v2 package.
- Полная belief map обновлена после добавления UI imports/modules; `belief-build.log`.
- `git diff --check`: PASS после удаления двух завершающих пустых строк. Чужие S8-002 изменения сохранены.

## Историческая runtime попытка и блокер (устранён ниже)

AVD `finni_s7_005_api26`, emulator-5554, Android API 26, установленный debug APK com.meshnavigator.finni 0.1.0 от 2026-09-23. Emulator boot_completed=1.

Первый Metro localhost связался с IPv6; loopback-only запуск с `node --dns-result-order=ipv4first ... expo start --localhost --port 8082` и adb reverse tcp:8081 tcp:8082 сделал сервер доступным. Текущий index.ts успешно bundled: 832 модуля. После reload APK показывает пустой экран (`current.png`), холодный запуск повторяет `Unable to load script` / loadJSBundleFromAssets (`runtime-blocker.png`, `runtime-ui.xml`). ReactNativeJS/AndroidRuntime error scan не выявил JS exception; это не доказательство успешного UI.

Автоматическая approval review отвергла промежуточный `--lan` запуск из-за раскрытия dev-сервера локальной сети. LAN-сервер не запускался; использован разрешённый безопасный localhost-only вариант.

Не подтверждены на устройстве: выбор/сохранение spotted, отображение Home, смена neutral/blink, cold persistence, performance. Release APK не пересобирался; физическое устройство не проверялось. Следующий gate — запустить актуальный native debug/release build и повторить эти сценарии. Отдельная диагностика старого debug runtime не подменяет принятие внешности.

## Документация

Обновлены Accepted decision, CURRENT_IMPLEMENTATION, задача S8-001, диаграмма выбора runtime assets и статус v2. Полная матрица 9 и S8-001 не объявляются готовыми. Внешние GitHub-действия, commit/push не выполнялись.

## Повторная проверка: блокер устранён, runtime smoke PASS

2026-09-25. Текущий native проект проверен `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --console=plain`: PASS; затем с закреплённым JDK 17.0.18 — PASS (160 tasks, 35 executed, 125 up-to-date). Gradle переиспользовал совместимый native APK: SHA256 `5793F94C694A71C4384C5395630C28DEE5F97C7F65D79E585B0FD24ADF775ED2`. Debug JS не встроен: именно текущий index.ts загружен из Metro (832 modules). Это свежая проверка сборки и clean install, а не заявление о новом release APK.

Перед `adb uninstall` данные тестового AVD сохранены в `emulator-before-debug-install.tar`; clean install PASS. Причина cold-start установлена: RN 0.86 Change Bundle Location меняет кеш адреса, но не persistent preference. Тестовый `debug_http_host=localhost:8082` записан в default SharedPreferences; localhost-only Metro и adb reverse обеспечивают холодный запуск. Код приложения для этого не изменялся. Прежний AVD профиль не восстановлен, backup сохранён; AVD оставлен с новым тестовым spotted-профилем.

### Сценарии и доказательства

- Constructor pointy/plain и pointy/spots: PASS (`constructor-plain.png`, `constructor-spots.png`).
- Сохранение обеих внешностей и отображение Home: PASS (`home-plain.png`, `home-spots.png`, `home-final.png`). Осмотрен `runtime-appearance-comparison.jpg`.
- Force-stop / start: Home открывается, сохранён pointy/spots; `cold-home.xml`, `cold-profile.xml` содержит «Финни: Острые ушки, Пятнышки». Балансы остаются 0/0, день не начат. Первый слишком быстрый автоматический tap был повторён с проверкой UI transition; дефекта persistence не обнаружено.
- На AVD изначально transition_animation_scale=0: reduced-motion корректно оставлял neutral. Для проверки временно установлен 1, после проверки восстановлен 0.
- Первый реальный blink выявил исчезновение питомца при decode сменяемого source (`spots-blink-motion.mp4`, кадры 3.8–3.9с). Исправлен FinniHomeScene: neutral/blink смонтированы заранее, blink показывается только после onLoad нужной внешности, переключение opacity, fadeDuration=0. Источники не заменяются каждый цикл.
- Metro в CI не наблюдает правки: после исправления полностью перезапущен с --clear. Финальный cold-start `spots-first-blink-final.mp4` и `first-blink-final-contact.jpg`: после появления Home первый и последующие blink без пропадания питомца, пятна сохраняются. Startup splash/loading в начале записи не являются потерей blink кадра.
- `npm run verify` после финального исправления и regression test: PASS, 132 теста, 0 fail; lint/typecheck/content/fixtures PASS (`configured-verify-final.log`). `blink-regression.log`: 5/5 focused PASS. `git diff --check` PASS; belief map rebuilt.
- Финальный ReactNativeJS/AndroidRuntime error scan пуст, кроме заголовков; прежний SafeAreaView deprecation warning не является runtime exception.

Release, offline/no-Metro launch, физическое устройство и memory/performance budget здесь не проверялись. Два одновременно смонтированных frame требуют отдельного memory gate в S10; этот smoke не заменяет его. Матрица остальных семи вариантов остаётся открытой.
