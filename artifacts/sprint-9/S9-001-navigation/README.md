# S9-001 — постоянная навигация и завершающие исправления Home

2026-09-25. Согласованная реализация и доступный Verify завершены. Runtime default — **«Ещё»**. Новые screenshots представлены для оценки владельца; commercial release, физический Android, performance и TalkBack PASS не заявляются.

## Результат

- [Домик, 390×844](review/root-home.png)
- [Все пять корневых экранов](review/five-roots.jpg)
- [360×640 / 100%](review/delivery-small.png), [119% stress](review/delivery-119-stress.png), [120% stress](review/boundary-1.2-True.png), [200% stress](review/delivery-200-stress.png)
- [Крупное меню](review/large-menu.png), [Ещё при 200%](review/large-more.png)
- [Отдельный Пропуск при119%](review/skip-visible-1.19.png), [при200%](review/skip-visible-2.png) — QA-only animation capture, см. границы ниже
- [Сценарий и два варианта будущего user test](user-test.md)

Изображения получены из Android screencap. Review PNG удаляют только пустые поля framebuffer и приводят снимок к логическому размеру; интерфейс не дорисован. Все исходные PNG/XML сохранены в android/, routes/, delivery/, boundary-final/ и fault/.

## Источники и scope

Прочитаны AGENTS.md, .project-kit/config.json, S9-001, CURRENT_IMPLEMENTATION, IMPLEMENTATION_DECISIONS, SRS и исходный PDF ТЗ: §2.5.3 (стр.5 PDF) и §3.6 (стр.11 PDF). Основание расширения — ответ владельца «Согласен с твоими предложениями, давай сделаем» после read-only обзора; уточнение Accepted scope записано в DEC-2026-09-25-013.

Belief map: AppRoot владеет маршрутом и root shell; HomeScreen, BudgetPlanScreen, ShopScreen и SavingsScreen — presentation boundaries; RootNavigation/root-navigation добавляют общую модель пяти разделов. Прямой dependent контейнера — App. Финансовые application/domain/persistence, схемы, принятые art masters и renderer не менялись. FinniHomeScene временно инструментировался для QA и восстановлен по SHA256. Собственный diff от состояния начала пакета — package.diff; предыдущие Sprint8/9 правки сохранены.

## Изменения

| Before | After |
| --- | --- |
| Панель находилась только на Home, Домик всегда selected | AppRoot показывает одну постоянную панель на Домик/План/Покупки/Копилка/Ещё; selected соответствует экрану. Реальные safe-area insets принадлежат общей оболочке |
| Меню вторичных действий висело в сцене | Отдельный root «Ещё»: Все занятия, Прогресс, Имя и внешность, Как играть, Для взрослого. Ошибка открытия прогресса видна в этом разделе |
| Меню при реакции становилось Пропуском | Отдельное временное действие около Финни; меню и вкладки сохраняют своё назначение. Сохраняются existing finished/cancelled callbacks и pause при modal/background |
| Крупная навигация дублировала Home, close выглядел маршрутом | >120% использует общий вертикальный список пяти roots с selected; закрытие — отдельная кнопка без chevron. Home сохраняет Меню + контекстный шаг |
| Android 120% фактически приходил 1.2000000477 и включал large mode | Общая функция выбирает layout по округлённому проценту; 120% остаётся ordinary. Системный fontScale текста не ограничивается |
| У крупных карточек пропадал признак перехода | Цель и занятие сохраняют chevrons без уменьшения доступной ширины основного текста |
| Достигнутая short-цель показывала «ещё0», получение было ниже списка целей | «Можно получить мечту» и переход в копилку; получение доступно в верхней карточке выбранной цели с прежним подтверждением. Недостигнутая цель показывает читаемый остаток |
| Состояния11sp, занятие15sp; длинная эмоция переносилась последней буквой при119% | Состояния13sp, занятие16sp; short padding перераспределён, точная короткая форма «Вдохновлён». При крупном тексте прежние базовые12/14/16sp масштабируются системой полностью ради строгой сводки §2.5.3 |
| Три финансовых roots оставались голубыми и повторяли кнопку Домик | Тёплые фон/поверхности/типографика/кнопки, постоянная общая навигация. Shop использует полноценный Pressable с минимумом48dp |
| Back деталей вёл в Домик; старый origin мог пережить прямой Home lesson | Детали из Ещё возвращаются в Ещё; история операций — в копилку. Прямое занятие явно сбрасывает origin в Home; подпись каталога соответствует возврату; origin, влияющий на подпись, хранится в React state |
| Проверки не охватывали постоянные пять roots и float32 threshold | Реальный JSX проверяет selected, callbacks, More и независимый skip; regression test воспроизводит Math.fround(1.2). Обновлены pause/isolation guards, decision, current implementation, task и diagram |

Соседние экраны прокручиваются вертикально при крупном тексте; требование сводки без скролла относится к Home. Полная содержательная и визуальная переработка итогов/занятий/взрослого раздела остаётся S9-002/004. Финансовые контракты и подтверждения прежние.

## Фактический Verify

- npm run verify — **PASS**,142/142 tests, lint, typecheck, content, fixtures; verify-exact.log. Новых JSX/regression tests4; это выполнение JSX с host primitives, а не замена native layout проверке.
- Offline Gradle :app:assembleRelease -PreactNativeArchitectures=x86_64 --offline — **PASS**, build-delivery.log. APK содержит assets/index.android.bundle, QA marker отсутствует, Metro listener отсутствует; environment.json.
- Native matrix — **76 профилей разрешены PASS после исправления границы120%**: три размера ×100/150/200%, обычные/stress данные, DRAFT/READY/WAITING, пустая цель,119/120%, все9внешностей×3стадии,9портретов, короткие стадии1/3, три цели. Targets≥48dp, обязательные rect видны, пересечений нет. CLOSED — прежняя presentation-contract проверка; persisted закрытый день наблюдался как WAITING.
- Первоначальный полный проход:74/76 PASS; два120%case выявили отсутствие пяти вкладок из-за float32. Исходный отрицательный native-matrix.log/json сохранён. Точная delivery сборка повторно прошла **5/5**: оба120%case и Home100/119/200%. matrix-resolution.json связывает каждый профиль с исходным APK hash; разные сборки не выдаются за один запуск. Остальная геометрия/renderer/assets между ними не менялись.
- Основные routes, More details/Back на100/119%, крупное меню/selected на всех5roots, goal claim cancel — **27 записанных checks PASS**, routes.json. Затем финансовый harness отдельно — **7/7 PASS**: отмена и реальное подтверждение покупки, ухода, перевода, закрытия. Сценарий100/0 →70/0 →60/0 →40/20 →WAITING. Native Alert tree не содержит root-navigation. financial.json и routes/ XML.
- Точный delivery APK — **10/10 PASS**, delivery.json: screenshots всех5selected roots, editor save/cancel→More, регрессия direct Home lesson после прежнего каталога изMore, отмена перевода и крупный взрослый barrier/Back.
- QA animation/resource run —12behavior checks; после visual review адресный повтор4/4 PASS. Проверены независимый skip100/119/200%, одиночный finished callback, отмена реакции при меню/смене root/background, app/system reduced motion, thoughtful, missing pet/goal onError с сохранением навигации и remount recovery. fault/results-first.json и results-refined.json.
- Для UIAutomator QA-only renderer замораживал idle и удлинял hold с2500 до12000ms; переходы, callbacks и image.onError оставались нативными. Эти изменения отсутствуют в delivery. Первый119% screenshot отклонён визуально, несмотря на формальную геометрию: последний символ эмоции переносился и высокий panel заслонял лапы. После исправления проверяется также фактическая высота каждого status Text≤23dp. Rejected screenshot сохранён отдельно.
- Финансовый harness дважды уточнялся по фактическому поведению: операция сохраняет текущий финансовый экран до явного перехода Home; WAITING label — «Следующий день позже». Отрицательные логи сохранены; runtime defect этим предположениям не приписан.
- Full belief map — **PASS**; belief-map-exact.log. git diff --check — **PASS**; diff-check-exact.log.10изменённых/новых product/test файлов отдельно проверены на whitespace, untracked-whitespace.json.
- Physical Android, performance, реальное TalkBack озвучивание и тест с детьми/родителями — **NOT RUN**. TalkBack package отсутствует в AVD; XML selected/labels/disabled не подменяет озвучивание. План будущего user test подготовлен, результатов участников нет.

## Доставка и восстановление

APK: android/app/build/outputs/apk/release/app-release.apk (от code root), SHA256 `30127ed7cb5a891d92b1322e730c3d2b6954df95631dd35945e83db70fd15795`. Это x86_64 QA release для AVD, подписанный общедоступным debug keystore; не production signing и не универсальный физический Android release.

До тестов8 исходных файлов AVD сопоставлены с существующим backup по on-device SHA256. По завершении все8 файлов восстановлены и hashes совпали. Исходные1080×1920/density420/fontScale null/transitionScale0 возвращены; приложение оставлено остановленным. restore.json. Новая приватная БД из AVD не извлекалась.

Обновлены Accepted scope DEC-013, CURRENT_IMPLEMENTATION, S9-001 и S9_001_HOME_LAYERS. Полная S9-001 не помечена безусловно done; физические/performance gates остаются S10, художественная оценка новых screenshots владельцу не приписана. Commit/push не выполнялись.

EXECUTION_MODE: DIRECT
MODEL: gpt-6-astra
REASONING: xhigh
OTHER_MODELS_USED_FOR_CONTENT: NO
