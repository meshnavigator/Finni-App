# S9-003/004 — единый стиль остальных экранов

## Результат

Изменения внедрены в React Native. Это продолжение принятых пяти корневых экранов. Добавлены общая палитра/контролы и возврат, оформлены реальные вложенные маршруты, учебные состояния, onboarding, recovery и ошибки. Финансовые команды, SQLite schema, контент и правила наград не менялись.

- [APK для Android AVD x86_64](finni-details-review.apk) — offline release, публичная локальная debug-подпись для QA; не production-подпись и не универсальный ARM APK.
- SHA256: `42d1a247ef6f7a8220d993f89b84a89a0f87dc3ab20d1a7e0f2b8da551e4d0d9`.
- [Основные экраны](review/remaining-screens.jpg), [восемь уроков](review/lesson-mechanics.jpg), [200%](review/accessibility-200.jpg), [пять roots](review/root-regression.jpg), [fallback/loading QA](review/fallback-and-loading.jpg).
- [Полный инвентарь достижимых экранов](INVENTORY.md), [diff только текущего пакета](package-only.diff), [точные source hashes](source-files.json).

## Художественная приёмка — 2026-09-26

Художественная приёмка новых вложенных экранов закрыта. 2026-09-26 владелец ответил «принимаю» на фразу «Художественную приёмку новых экранов оставляю вам.» Принят визуальный результат пакета S9-003/004 и его обзорные снимки; это не подтверждение TalkBack, физического performance, тестов с детьми/родителями или внешнего методического/редакторского ревью.

## Основание и границы

Прямое поручение владельца после приёмки Home/Plan/Shop/Savings/More; Accepted DEC-2026-09-25-013; ТЗ §§2.5, 3.6; SRS §§9–13; задачи S9-003/004. Применены project-map, make-interfaces-feel-better и verify-task. Полная карта после новых imports перестроена; точные counts и перечень связей — в `belief-map.log`.

Изменены 9 существующих UI файлов и добавлены `screen-theme.ts`, `DetailBack.tsx`. Пять тестов переходят от поиска буквального `minHeight:48` к проверке фактических shared styles через `tests/ui-control-contract.mjs`. Пакетный diff построен относительно dirty baseline начала работы; предыдущие Sprint8/9 изменения сохранены. `BudgetPlanScreen`, `ShopScreen`, `SavingsScreen` побайтно совпадают с этим baseline. Commit/push не выполнялись.

## До / после

| Область | До | После |
| --- | --- | --- |
| Общий UI | Разные насыщенные палитры, радиусы и текстовые уровни | Тёплые поверхности, body16sp, единые поля/кнопки от52dp и карточки |
| Insets / возврат | Details не имели общего владения Android insets | AppRoot safe area для деталей; отдельная safe area Help Modal; DetailBack от48dp |
| Знакомство / редактор | Старое оформление формы и вариантов | Preview на мягкой подложке, заметный выбор; вертикальные варианты при крупном тексте |
| Каталог | Плотные карточки; ошибка открытия не отображалась | Вложенные карточки с отступами и chevron, busy/disabled; видимая error-секция сразу под Back и возврат к ней |
| Уроки | Разрозненные поля, рамки и состояния выбора | Общая оболочка и пять типов форм, checkmark/checkbox/radio, ясные disabled states |
| Прогресс | Старые карточки истории и сводок | Общие поверхности, сохранённые раскрываемые разборы и ledger |
| Справка | Старый словарь | Читаемые карточки, собственные insets, закрытие сверху и снизу |
| Взрослый раздел | Старый barrier/controls; текст о якобы отсутствующем учебном модуле | Общие controls, доступный вариант, сохранённый hold/session; исправленный текст |
| Итог / loading / error | Старые поверхности и отступы | Общая типографика, прокрутка крупного текста, safe area; прежние подтверждения |

## Фактический Verify

| Проверка | Результат / evidence |
| --- | --- |
| Configured Verify | PASS: lint, typecheck, **142 tests**, content 1.2.0, fixtures; `verify.log` |
| Offline release build | PASS; `build.log`, NODE_ENV=production; встроенный JS bundle, Metro8081 отсутствует |
| Все 8 уроков через UI | 17 PASS: завершение, перезапуск, открытие сохранённого разбора; кошелёк100→120, одна награда; `lessons.json` |
| Native matrix | 53 PASS; `matrix.json`: 360×640,390×844,412×915;100/119/150/200%; репрезентативные сочетания, не полный декартов продукт |
| Финансовый e2e | 7 PASS: purchase/care/deposit/close и cancel; итог40/20; `financial.json` |
| Ошибки / onboarding / формы до последней правки StatusBar | 6 PASS: последний урок+SQLite trigger, неизменность денег, реальная повреждённая SQLite, создание профиля200%, DRAFT acknowledgement, недостаток денег; `states.json` |
| Дочерние финансовые формы до последней правки StatusBar | 6 PASS: дополнительный доход через настоящее завершение B01, cancel/confirm формы, сохранение кошелька, снятие и claim/cancel достигнутой цели; `children.json` |
| Adult / night до последней правки StatusBar | 9 PASS: настоящий hold, switches, отмена удаления, background lock, арифметика и controls200%, системный night/native Alert; `extras.json` |
| Финальная установленная сборка | 19 PASS: SHA256 установленного APK, install-over восьми файлов, пять roots/деталей, все типы форм, встроенный bundle без QA markers; `final-smoke.json` |
| Реальный boot-error / retry на финальном APK | 3 PASS; `transient-final.json`; крупный текст200%, recovery и тёмные значки StatusBar |
| Resource / loading QA | 4 PASS на отдельной QA сборке: реальный Image.onError для missing/corrupt файла; удержанное loading presentation100/200%; `resource-qa.json`, `qa-lineage.json` |
| Accessibility geometry | 164 native кадров PASS; полностью видимые targets≥48dp, без пересечений. Частично обрезанные viewport элементы явно исключены; `accessibility-audit.json` |
| Контраст | 8 пар PASS: текст≥4.5:1, граница input≥3:1; точные ratios в `accessibility-audit.json` |
| Whitespace / map | `git diff --check` PASS; `whitespace.log`; full rebuild `belief-map.log` |
| AVD restore | 8/8 исходных SHA256 совпали; size/density/font/transition восстановлены, night=no, приложение остановлено; `restore.json` |

### Lineage сборок и обнаруженные ошибки

Полные 8 lessons /53 matrix /7 financial прошли на `9aa0c24ee61a72ac9fe3075ef8baa19757eda64c61f653f38eb41979aa910187`. Затем fault последнего урока обнаружил, что сообщение остаётся выше viewport. Первый scrollTo(0) сохранил проблему при200%: большая шапка выталкивала текст вниз. UIA при этом возвращал offscreen Text; визуальный просмотр выявил ложноположительный assertion. Финальное исправление перемещает сообщение сразу под Back и прокручивает к нему. Final fault требует положительные **полностью видимые** bounds; screenshot проверен глазами. Нормальные layouts, content и domain handlers этим исправлением не изменялись; все типы форм повторно открыты на финальном APK.

`states-intermediate.json` не является итоговым PASS; причина записана в `intermediate-resolution.json`. Отрицательные screenshot/log сохранены в `before-native/`, `*-before-error-focus.log`. Native harness отдельно исправлялся для exact EditText selector, проверки IME перед Back, перекрывающейся прокрутки, реальных границ ScrollView и крупного Menu после onboarding. Это отделено от продуктового дефекта. Первоначальные source-regex tests заменены проверкой shared-style контракта. Первый вызов Windows PowerShell остановился на Expo stderr о NODE_ENV; wrapper исправлен, повторный build PASS.

После предыдущего delivery `a2341a9a00b75b99c7150c6d6cf9d1149c807a8382d29346d0df908e542deee0` добавлен только StatusBar dark в LoadingScreen и ErrorScreen; обычные routes/layouts не изменялись (`system-bars-change.json`). Configured Verify142 и offline build повторены. Финальный `42d1a247ef6f7a8220d993f89b84a89a0f87dc3ab20d1a7e0f2b8da551e4d0d9` прошёл полный smoke19, boot-error/retry и повторную QA-проверку loading/fallback. Прерванный ход после14 PASS сохранён в `final-smoke-turn-interrupted.json`; повторный полный прогон завершён.

QA resource APK имеет отдельный hash `686ffe78899798917d6081b3ac14e39d8b2b63385bad0e7b1366ab098c1577d5` и не выдаётся за delivery. В нём временно заменён только URI preview и удерживается реальный LoadingScreen по синтетическому имени. Это доказательство fallback/presentation, не измерение времени реальной загрузки. Product source восстановлен побайтно, delivery APK переустановлен и проверен по hash; bundled QA markers отсутствуют. Скриншоты — реальные AVD кадры, лишь crop/resize до логического viewport.

## Ограничения

- Spoken TalkBack **NOT RUN**: пакет не установлен. Проверены native accessibility tree, labels/roles/states и геометрия; озвучивание ими не подменяется.
- Физическое Android-устройство, performance/battery, дети/родители и новое внешнее методическое/редакторское ревью **NOT RUN**.
- Install-over проверен на существующих данных schema6; отдельная native миграция с предыдущей schema в этом presentation-пакете не повторялась. Доменные/migration тесты configured Verify прошли; schema не менялась.
- Приложение сохраняет тёплую фиксированную палитру при системном night; отдельная тёмная тема не заявляется. Проверен native Alert на затемнённой подложке.
- Отдельных Settings/Family/item-detail routes нет. SectionScreen и standalone closed-result branch не объявлены пройденными маршрутами; сохранённый итог находится в History.
- S9-002 event presentation controller и последующие art/performance задачи не закрываются этим пакетом. Реестр S9-003/004 фиксирует внедрение и художественную приёмку владельцем; прочие перечисленные проверки остаются открытыми.

## Документация

Обновлены Accepted DEC-013, CURRENT_IMPLEMENTATION, диаграмма S9_001_HOME_LAYERS, обе задачи и TASKS. Изменилось владение presentation/insets, а не финансовый workflow. Дополнительные подтверждения пользователя для обратимых UI правок не требовались; прежнее DIRECT согласие сохранено.

```text
EXECUTION_MODE: DIRECT
MODEL: gpt-6-astra
REASONING: xhigh
OTHER_MODELS_USED_FOR_CONTENT: NO
```
