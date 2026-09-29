from pathlib import Path
import json,hashlib
r=Path(__file__).resolve().parent
load=lambda f:json.loads((r/f).read_text(encoding='utf-8-sig'))
required=['lessons.json','matrix.json','financial.json','states.json','extras.json','resource-qa.json','final-smoke.json','restore.json','accessibility-audit.json','qa-lineage.json','children.json','transient-final.json']
for f in required:assert (r/f).exists(),f
reports={f:load(f) for f in required}
for f in required[:7]:assert all(x['pass'] for x in reports[f].get('checks',reports[f].get('results',[]))),f
assert all(x['pass'] for x in reports['children.json']['checks'])
assert all(reports['restore.json']['files'].values())
assert reports['qa-lineage.json']['sourceRestored']
count=lambda f:len(reports[f].get('checks',reports[f].get('results',[])))
apk=hashlib.sha256((r/'finni-details-review.apk').read_bytes()).hexdigest()
for f in ['final-smoke.json','transient-final.json']:assert reports[f]['apkSha256']==apk,(f,apk)
prior=load('system-bars-change.json')['beforeApkSha256']
for f in ['states.json','extras.json','children.json']:assert reports[f]['apkSha256']==prior,(f,prior)
assert reports['qa-lineage.json']['deliveryApkSha256']==apk
assert len(reports['final-smoke.json']['checks'])==19
assert all(x['pass'] for x in reports['transient-final.json']['checks'])
contrast=reports['accessibility-audit.json']['contrast'];geometry=reports['accessibility-audit.json']['geometry']
text=f'''# S9-003/004 — единый стиль остальных экранов

## Результат

Изменения внедрены в React Native. Это продолжение принятых пяти корневых экранов. Добавлены общая палитра/контролы и возврат, оформлены реальные вложенные маршруты, учебные состояния, onboarding, recovery и ошибки. Финансовые команды, SQLite schema, контент и правила наград не менялись.

- [APK для Android AVD x86_64](finni-details-review.apk) — offline release, публичная локальная debug-подпись для QA; не production-подпись и не универсальный ARM APK.
- SHA256: `{apk}`.
- [Основные экраны](review/remaining-screens.jpg), [восемь уроков](review/lesson-mechanics.jpg), [200%](review/accessibility-200.jpg), [пять roots](review/root-regression.jpg), [fallback/loading QA](review/fallback-and-loading.jpg).
- [Полный инвентарь достижимых экранов](INVENTORY.md), [diff только текущего пакета](package-only.diff), [точные source hashes](source-files.json).

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
| Все 8 уроков через UI | {count('lessons.json')} PASS: завершение, перезапуск, открытие сохранённого разбора; кошелёк100→120, одна награда; `lessons.json` |
| Native matrix | {count('matrix.json')} PASS; `matrix.json`: 360×640,390×844,412×915;100/119/150/200%; репрезентативные сочетания, не полный декартов продукт |
| Финансовый e2e | {count('financial.json')} PASS: purchase/care/deposit/close и cancel; итог40/20; `financial.json` |
| Ошибки / onboarding / формы до последней правки StatusBar | {count('states.json')} PASS: последний урок+SQLite trigger, неизменность денег, реальная повреждённая SQLite, создание профиля200%, DRAFT acknowledgement, недостаток денег; `states.json` |
| Дочерние финансовые формы до последней правки StatusBar | {count('children.json')} PASS: дополнительный доход через настоящее завершение B01, cancel/confirm формы, сохранение кошелька, снятие и claim/cancel достигнутой цели; `children.json` |
| Adult / night до последней правки StatusBar | {count('extras.json')} PASS: настоящий hold, switches, отмена удаления, background lock, арифметика и controls200%, системный night/native Alert; `extras.json` |
| Финальная установленная сборка | {count('final-smoke.json')} PASS: SHA256 установленного APK, install-over восьми файлов, пять roots/деталей, все типы форм, встроенный bundle без QA markers; `final-smoke.json` |
| Реальный boot-error / retry на финальном APK | {count('transient-final.json')} PASS; `transient-final.json`; крупный текст200%, recovery и тёмные значки StatusBar |
| Resource / loading QA | {count('resource-qa.json')} PASS на отдельной QA сборке: реальный Image.onError для missing/corrupt файла; удержанное loading presentation100/200%; `resource-qa.json`, `qa-lineage.json` |
| Accessibility geometry | {len(geometry)} native кадров PASS; полностью видимые targets≥48dp, без пересечений. Частично обрезанные viewport элементы явно исключены; `accessibility-audit.json` |
| Контраст | {len(contrast)} пар PASS: текст≥4.5:1, граница input≥3:1; точные ratios в `accessibility-audit.json` |
| Whitespace / map | `git diff --check` PASS; `whitespace.log`; full rebuild `belief-map.log` |
| AVD restore | 8/8 исходных SHA256 совпали; size/density/font/transition восстановлены, night=no, приложение остановлено; `restore.json` |

### Lineage сборок и обнаруженные ошибки

Полные 8 lessons /53 matrix /7 financial прошли на `{reports['lessons.json']['apkSha256']}`. Затем fault последнего урока обнаружил, что сообщение остаётся выше viewport. Первый scrollTo(0) сохранил проблему при200%: большая шапка выталкивала текст вниз. UIA при этом возвращал offscreen Text; визуальный просмотр выявил ложноположительный assertion. Финальное исправление перемещает сообщение сразу под Back и прокручивает к нему. Final fault требует положительные **полностью видимые** bounds; screenshot проверен глазами. Нормальные layouts, content и domain handlers этим исправлением не изменялись; все типы форм повторно открыты на финальном APK.

`states-intermediate.json` не является итоговым PASS; причина записана в `intermediate-resolution.json`. Отрицательные screenshot/log сохранены в `before-native/`, `*-before-error-focus.log`. Native harness отдельно исправлялся для exact EditText selector, проверки IME перед Back, перекрывающейся прокрутки, реальных границ ScrollView и крупного Menu после onboarding. Это отделено от продуктового дефекта. Первоначальные source-regex tests заменены проверкой shared-style контракта. Первый вызов Windows PowerShell остановился на Expo stderr о NODE_ENV; wrapper исправлен, повторный build PASS.

После предыдущего delivery `{prior}` добавлен только StatusBar dark в LoadingScreen и ErrorScreen; обычные routes/layouts не изменялись (`system-bars-change.json`). Configured Verify142 и offline build повторены. Финальный `{apk}` прошёл полный smoke19, boot-error/retry и повторную QA-проверку loading/fallback. Прерванный ход после14 PASS сохранён в `final-smoke-turn-interrupted.json`; повторный полный прогон завершён.

QA resource APK имеет отдельный hash `{reports['resource-qa.json']['apkSha256']}` и не выдаётся за delivery. В нём временно заменён только URI preview и удерживается реальный LoadingScreen по синтетическому имени. Это доказательство fallback/presentation, не измерение времени реальной загрузки. Product source восстановлен побайтно, delivery APK переустановлен и проверен по hash; bundled QA markers отсутствуют. Скриншоты — реальные AVD кадры, лишь crop/resize до логического viewport.

## Ограничения

- Spoken TalkBack **NOT RUN**: пакет не установлен. Проверены native accessibility tree, labels/roles/states и геометрия; озвучивание ими не подменяется.
- Физическое Android-устройство, performance/battery, дети/родители и новое внешнее методическое/редакторское ревью **NOT RUN**.
- Install-over проверен на существующих данных schema6; отдельная native миграция с предыдущей schema в этом presentation-пакете не повторялась. Доменные/migration тесты configured Verify прошли; schema не менялась.
- Приложение сохраняет тёплую фиксированную палитру при системном night; отдельная тёмная тема не заявляется. Проверен native Alert на затемнённой подложке.
- Отдельных Settings/Family/item-detail routes нет. SectionScreen и standalone closed-result branch не объявлены пройденными маршрутами; сохранённый итог находится в History.
- S9-002 event presentation controller и последующие art/performance задачи не закрываются этим пакетом. Реестр S9-003/004 фиксирует внедрение и сохраняет внешнюю приёмку открытой.

## Документация

Обновлены Accepted DEC-013, CURRENT_IMPLEMENTATION, диаграмма S9_001_HOME_LAYERS, обе задачи и TASKS. Изменилось владение presentation/insets, а не финансовый workflow. Дополнительные подтверждения пользователя для обратимых UI правок не требовались; прежнее DIRECT согласие сохранено.

```text
EXECUTION_MODE: DIRECT
MODEL: gpt-6-astra
REASONING: xhigh
OTHER_MODELS_USED_FOR_CONTENT: NO
```
'''
(r/'README.md').write_text(text,encoding='utf-8')
print('Final report written',apk)
