# S9-001 — Home V4.2: реализация и Verify, 2026-09-25

## Результат

Home использует полноэкранную комнату, реальный HUD, защищённый силуэт Финни, предметы-переходы, основной CTA и навигацию. По явному решению владельца при крупном тексте питомец меньше, вторичные маршруты доступны через «Разделы», обязательная сводка остаётся одновременно видимой. Исключение из ТЗ §2.5.3 не применяется. Источники: V4.2 composition spec, S9-001, SRS и DEC-2026-09-25-012.

Первоначальные три кандидата не прошли 360×640/200%. Их design blocker устранён новой композицией. HTML является дизайн-проверкой, не пиксельной копией RN или доказательством Android dp. Native проверка отдельно выявила edge-to-edge inset: встроенный RN SafeAreaView не защищал нижнюю панель. Подключён Expo-совместимый react-native-safe-area-context с реальными insets.

## Изменения

- `HomeScreen.tsx`: scene/HUD/nav, ordinary предметы и короткие маршруты, large-text modal-меню, Back/notice, реальные суммы/цель/состояние/занятие. Нет numberOfLines, fontScale cap или скролла обязательной сводки.
- `home-scene-layout.ts`: общий alpha-bounds всех принятых кадров, feet anchor, масштабы стадий 0.86/1/1.12, запас для дыхания. Планер стоит на небольшом native столике; цель на стене, сундук у ковра, забота рядом с питомцем.
- `FinniHomeScene.tsx`: fullscreen, заданная область питомца, общий anchor, сохранены выражения/reduced motion/pause; skip управляется доступной кнопкой HUD. Fallback ограничен областью питомца.
- `home-lesson.ts`, runtime/repository/catalog: read-only история попыток и выбор реального доступного названия. Миграции и финансовые правила не менялись.
- `AppRoot.tsx`: refresh при возврате Home, Android Back и прежние маршруты подтверждений.

## Выполненные проверки

| Проверка | Результат |
| --- | --- |
| `node artifacts/sprint-9/S9-001-layout/check-layout.cjs` | PASS: 81 HTML профиль, без overflow/скрытой сводки/targets меньше48 CSS px |
| `python -X utf8 artifacts/sprint-9/S9-001-layout/android-matrix.py` | PASS: 66 native профилей, включая36 state/size/font,3 пустой цели,27 appearance/stage; targets не меньше48dp |
| Финальная Android матрица | `android/final-matrix.json`,9 профилей после уточнения подписи/столика |
| Native tap smoke | Планер→план, забота→покупки, копилка, прогресс, взрослый barrier, help; Back возвращает Home |
| Modal isolation | Меню скрывает Home targets от accessibility tree; Back закрывает меню |
| Навигация без финансовых действий | SQLite после smoke: available100/savings0, как до переходов |
| `npm run verify` | PASS: lint, typecheck,136 tests, content, fixtures |
| Full belief-map rebuild | PASS, `belief-map.log` |
| `git diff --check` | PASS; исходные Sprint8 изменения сохранены |
| `:app:assembleRelease -PreactNativeArchitectures=x86_64` | PASS, offline запуск без Metro на API26 AVD |

Native размеры:360×640,390×844,412×915 при fontScale1/1.5/2; density160. Физический screencap1080×1920 масштабируется Android; XML содержит логические dp. На360×640/200% с максимальными суммами и длинным занятием: цель доy265, состояние/питомец до388, занятие до496, footer538–586, системная навигация начинается592. CLOSED проверяется presentation-моделью/HTML: реальный loader проецирует закрытый период в READY/WAITING.

Fixtures явно отделены от финансового evidence: максимальные wallet значения и draft LS-S02 вводятся только в QA AVD для стресс-проверки отображения. Эти искусственные snapshots не используются как доказательство выполнения финансовой команды. Исходные данные AVD были сохранены до проверки и восстановлены после неё: хеши всех8 файлов совпадают, wm size/density возвращены к исходным значениям; исходно отсутствующая запись font_scale удалена, Android сообщает системное умолчание1.0 (`android/restore.json`).

## APK и ограничения

Финальный APK: `android/app/build/outputs/apk/release/app-release.apk`.
SHA256: `e3b03fd4d63be5ecb7f5c8cc05d2a4ed167f72c55dabf3abf150c32e45d22f36`.
Сборка release подписана общеизвестным локальным debug keystore только для QA. Это не production signing acceptance и не проверка arm64 устройства.

- NOT RUN: озвучивание и traversal настоящим TalkBack — пакет отсутствует в AVD. XML labels/focus/targets проверены, но не заменяют TalkBack.
- NOT RUN: физический Android/performance/cache/decode на устройстве — gate S10. Повреждение самого APK не моделировалось: native missing/corrupt проверены через тестовую подмену Image source локальным file URI, с настоящим Image.onError.
- Макеты/снимки — техническая проверка, не новая художественная приёмка сцены.
- npm install сообщил10 moderate findings в общем dependency tree; отдельный dependency audit не входил в задачу, автоматический audit fix не выполнялся.

Документы: обновлены IMPLEMENTATION_DECISIONS, CURRENT_IMPLEMENTATION и `docs/mermaid/S9_001_HOME_LAYERS.md`. Внешних GitHub действий/commit/push нет.

## Дополнительный native Verify — продолжение 2026-09-25

В отдельном QA APK проверены реальные переходы happy/thoughtful/inspired, возврат в calm, app/system reduced motion, skip, отмена в background и при modal pause. Тестовый trigger задавал реакцию через имя QA-профиля, не выполнял финансовые команды. Idle breathing отключён только в QA harness для свежего uiautomator XML; реальные transitions, callbacks и onError сохранены. Логи и проверки: `fault-qa/animation-results.json`. Это presentation-проверка; событийный маппинг подтверждён прежними S8 evidence и контрактами.

`fault-qa/resource-results.json`: missing-room, corrupt-room и object error PASS. На 360×640/200% отсутствующая и повреждённая комната вызывают настоящий onError и fallback «Финни рядом»; сводка и основной CTA остаются в XML, переход в копилку работает. После восстановления читаемого PNG и возврата Home fallback исчезает. Ошибка отдельного предмета сохраняет подписанные маршруты и сцену в обычном режиме. Снимки и XML находятся в `fault-qa/` и `android/`.

Первый recovery assert в `run.log` был FAIL из-за ошибки тестового setup: скопированный root PNG получил SELinux context без категорий приложения; logcat показал `avc: denied { open }`. В `fault-qa/resume.py` добавлены owner и restorecon, после чего все три case прошли. Изменение production-кода не потребовалось. Recovery объекта здесь не означает восстановление его картинки: тест подтверждает сохранение маршрутов/сцены при object error.

Финальный `npm run verify` — PASS, 136/136; `verify-resume.log`. `git diff --check` — PASS. Production TSX побайтно совпадают с сохранёнными версиями; QA инъекций в них нет. Исходный APK с указанным выше SHA256 переустановлен и запущен без Metro. После smoke приложение остановлено и восстановлены все восемь исходных файлов AVD с проверкой SHA256, исходные wm size/density, отсутствующая запись font_scale и transition_animation_scale=0: `android/restore-final.json`. Физическое устройство и TalkBack остаются NOT RUN. Новых архитектурных решений или workflow-изменений это продолжение не внесло; существующая диаграмма остаётся актуальной.
