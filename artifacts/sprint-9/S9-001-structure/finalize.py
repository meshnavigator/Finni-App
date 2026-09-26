
from pathlib import Path
import json,hashlib,difflib
R=Path('artifacts/sprint-9/S9-001-structure')
load=lambda n:json.loads((R/n).read_text(encoding='utf-8-sig'))
matrix=load('native-matrix.json');fault=load('fault/results.json');delivery=load('delivery.json');context=load('context-actions.json');restored=load('restore.json');apk=load('apk.json')
assert len(matrix['results'])==74 and not any(r['issues'] for r in matrix['results'])
assert len(fault)==11 and all(r['pass'] for r in fault)
assert len(delivery['results'])==21 and all(r['pass'] for r in delivery['results'])
assert len(context['results'])==3 and all(r['pass'] for r in context['results'])
assert all(restored['files'].values()) and restored['fontScale']=='null'
assert delivery['apkSha256']==context['apkSha256']==apk['apkSha256']
source=['src/ui/HomeScreen.tsx','src/ui/FinniHomeScene.tsx','src/ui/home-scene-layout.ts','src/ui/home-next-step.ts','src/ui/AppRoot.tsx','tests/home-next-step.test.mjs','tests/profile-ui.test.mjs']
hashes={p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in source}
(R/'production-hashes.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
diff=[]
for name in ('HomeScreen.tsx','FinniHomeScene.tsx','home-scene-layout.ts','AppRoot.tsx'):
    before=(R/(name+'.before.txt')).read_text(encoding='utf-8-sig').splitlines(keepends=True)
    after=(Path('src/ui')/name).read_text(encoding='utf-8-sig').splitlines(keepends=True)
    diff.extend(difflib.unified_diff(before,after,fromfile=name+' before this package',tofile=name+' delivery'))
(R/'package.diff').write_text(''.join(diff),encoding='utf-8')
readme="""# S9-001 — структурная переработка Home

2026-09-25. Реализация и доступные Android gates завершены. Новый внешний вид — **implemented for owner review**; художественная приёмка владельцу не приписывается. Commercial-release, physical-performance и TalkBack PASS не заявлены.

## Итоговые изображения

Это реальные снимки точного delivery APK на API26 AVD. Review PNG удаляют только чёрные поля framebuffer и приводят снимок к логическому размеру; интерфейс не дорисован.

- [390×844 / 100%](review/ordinary.png)
- [360×640 / 100%](review/small.png)
- [360×640 / 200%](review/large.png)
- [360×640 / 200%, stress](review/large-stress.png)
- [360×640 / 119%, stress](review/short-119-stress.png)
- [Все внешности, стадия 1](review/appearance-stage-1.jpg), [стадия 2](review/appearance-stage-2.jpg), [стадия 3](review/appearance-stage-3.jpg), [портреты](review/portraits.jpg)

Исходные PNG/XML матрицы — android/; точного delivery APK — delivery/. Обзорные листы являются подписанными crop реальных screenshots. Новый HTML-макет не использовался как доказательство.

## Источники и границы

Основание — согласие владельца «Согласен, реализовывай» с одобренной рекомендацией независимого разбора: новая композиция, единый блок денег/цели, большой Финни, одно занятие, контекстный шаг и одна навигация. DIRECT Astra Extra High подтверждён отдельно.

Прочитаны .project-kit/config.json, ТЗ §2.5.3 (из исходного PDF), S9-001, CURRENT_IMPLEMENTATION, IMPLEMENTATION_DECISIONS и S6-002_v4_2_COMPOSITION_SPEC; визуально сопоставлены прежние Android screenshots и finni-home-approved.png. DEC-2026-09-25-013 заменяет прежнюю обычную геометрию V4.2. Строгая сводка DEC-012 сохраняется.

Belief map: HomeScreen → AppRuntime snapshot / ui-model / FinniHomeScene / home-scene-layout / room-assets; единственный непосредственный dependent — AppRoot. Новый home-next-step — чистое presentation-правило маршрутизации. Domain, persistence и финансовые команды этого пакета не менялись. Существующие Sprint 8/9 правки сохранены; package.diff показывает только изменения относительно начала этого пакета.

## Before / After

| Before | After |
| --- | --- |
| Детальный bitmap комнаты конкурировал с данными | Спокойная native-сцена: светлая ниша, пол и коврик, ограниченная палитра. Новых bitmap art masters нет; принятый Финни сохраняет свои исходные PNG |
| Деньги, цель и предметы выглядели отдельными плашками | Один финансовый блок, цель с крупной предметной иллюстрацией, прогрессом и остатком; fallback иллюстрации сохраняет текст/маршрут |
| Боковой ряд, предметы и вкладки повторяли основные маршруты | Одна модель Домик / План / Покупки / Копилка, ясное selected-state. Прогресс, справка, взрослый раздел, сведения о питомце и все занятия находятся в подписанном меню |
| Забота и настроение были отделены от Финни | Еда, уход и настроение образуют компактную строку рядом с его сценой; при крупном тексте расположены около портрета |
| Маленькие текстовые/предметные иконки разных стилей | Десять собственных line icons на одной сетке, stroke и цвете. PNG проверены на decode и SHA256; воспроизводимый build-icons.py, manifest в assets/ui/home-v2 |
| «Продолжить день» открывало предварительный итог | Контекстный CTA указывает конкретный следующий маршрут: еда/уход, выбор мечты, накопление или проверка итогов. Покупка, перевод и закрытие дня сохраняют свои подтверждения |
| Названное занятие открывало общий каталог | Название открывает это занятие через существующий openLesson; полный каталог остаётся в меню. Контракт создания попытки не меняется |
| 360×640 использовал боковые ряды и тесный центр | Отдельный короткий профиль, компактные finance/lesson/nav; защищённый полнофигурный Финни в центре |
| При 200% питомец терял узнаваемость | Отдельный крупный портрет из принятых кадров, полные суммы, цель, состояние и название занятия одновременно. Нижняя часть тела намеренно кадрируется; лицо/уши сохраняются |
| Menu/notice isolation были распределены по слоям | Подложка Home блокирует taps и accessibility descendants при меню или сообщении; Android Modal/Back сохранены |
| Прозрачные материалы зависели от шумного фона | Устойчивые светлые поверхности, тёплая контрастная типографика, tabular numerals и press scale .96 без снижения opacity текста |

## Измерения и визуальная оценка

Первым проверен нативный 360×640/200% с суммами 1 000 000 000 и полным «Что изменится, если взять из копилки?». Все обязательные блоки видны одновременно. Размер fontScale не ограничен; numberOfLines/уменьшение текста для подгонки не применены.

Первый short-прототип был отвергнут в ходе работы: Финни оказался слишком мал, pet target пересекался с меню. Отрицательный prototype.json и screenshots сохранены. Во втором профиле финансовый блок и занятие стали компактнее, target отделён от меню. Из финальных native scene rect и общей alpha-границы принятых кадров получена высота силуэта стадии 2: **157,05 dp** на коротком и **241,22 dp** на обычном экране. Это расчёт по нативному rect, не segmentation screenshot.

Визуально просмотрены полные ordinary/short/200%/119% stress screenshots и все 27 полнофигурных сочетаний на трёх обзорных листах, девять портретов, все три цели. Лица и уши не обрезаются; стадии используют общий якорь лап. В крупном тексте stage label сохраняется, оптический размер портрета одинаков для читаемости лица.

Минимальный контраст текста — 4,98:1 (disabled CTA); обычный вторичный текст — 7,03:1, основной — 11,75:1. Расчёт: contrast.json. Геометрический PASS не присваивает художественную приёмку. Новая структура устраняет дублирование маршрутов и конкуренцию фона с данными; окончательная визуальная оценка остаётся владельцу.

## Фактический Verify

- npm run verify — **PASS**, 138/138 tests; lint, TypeScript, content, fixtures. Финальный лог verify-delivery.log.
- Новые контрактные проверки: контекстные маршруты всех состояний, отсутствие прямой финансовой команды, clearance ушей портрета. Существующий modal test усилен проверкой menu + notice.
- Полная Android матрица — **PASS 74/74**: 360×640, 390×844, 412×915 ×100/150/200%; обычные и stress данные; DRAFT/READY/WAITING; пустая цель; 119%; все 9 внешностей ×3 стадии; девять портретов; short стадии 1/3; все три цели. Targets ≥48 dp, обязательные rect в viewport, пересечений нет. native-matrix.json. CLOSED — контрактная presentation-проверка; сохранённый закрытый период lifecycle проецирует в READY/WAITING.
- QA-only resource/animation APK — **PASS 11/11**: happy/thoughtful/inspired, app/system reduced motion, skip, background cancellation, modal pause/Back, missing/corrupt pet PNG с реальным Image.onError и восстановлением после remount, goal image failure с сохранением подписи и маршрута. fault/results.json.
- Fault harness замораживает idle только для надёжного UIAutomator, оставляет native expression transitions/callbacks/onError. QA trigger не выполняет финансовых команд. Первый unstable-callback дефект инструмента проверки устранён через useCallback; first-system-reduced.log сохранён. Пустой ответ UIAutomator после смены настройки обрабатывается ограниченным повтором получения нового дерева.
- Production исходники восстановлены **побайтово по SHA256** после harness. QA markers отсутствуют в delivery bundle.
- Точный delivery APK — **PASS 21 checks**: основные/вторичные маршруты, прямой урок и каталог, взрослый barrier, modal/Back, крупная навигация, отмена подтверждения покупки/перевода и неизменность видимых сумм, пять финальных screenshots. delivery.json.
- Дополнительные контекстные действия exact delivery APK — **PASS 3/3**: выбор мечты, накопления, предварительный итог. Подтверждение закрытия дня открыто и отменено, суммы неизменны. context-actions.json. Fixture синтетический и проверяет presentation routes, не доказывает end-to-end учёт искусственно добавленных покупок.
- Delivery QA selector уточнён до точного совпадения, чтобы не нажимать статичную сумму «Копилка» вместо вкладки. Это дефект harness, прежние положительные проверки сохранены в delivery-selector-first.json.
- Offline Gradle :app:assembleRelease -PreactNativeArchitectures=x86_64 --offline — **PASS**. build-final.log. APK содержит assets/index.android.bundle, Metro listener отсутствует; API26 install/run пройден. apk.json / environment.json.
- Full belief-map rebuild — **PASS**; belief-map-final.log. git diff --check — **PASS**; diff-check-final.log. Новые untracked UI/test файлы отдельно проверены на whitespace: untracked-whitespace.json.
- Physical Android/performance — **NOT RUN**, gate S10. Настоящее TalkBack-озвучивание — **NOT RUN**, пакет отсутствует в AVD. XML labels/selected/disabled не подменяют аудиторскую проверку TalkBack.

Матрица 74 профиля выполнена до добавления одной вторичной строки «Все занятия» в меню. Точный delivery APK повторно проверен по маршрутам/меню и пяти финальным профилям; геометрия Home между этими сборками не менялась. SHA256 обеих сборок зафиксированы отдельно.

## Доставка и восстановление

Delivery APK: android/app/build/outputs/apk/release/app-release.apk (от code root).
SHA256: APK_HASH.

QA release x86_64 использует общеизвестный локальный debug keystore. Это offline проверочный пакет; production signing и physical release acceptance не приписаны.

До изменения AVD все восемь исходных файлов сравнены с уже существующим backup по on-device SHA256. Новая приватная БД из AVD не извлекалась. По завершении восстановлены эти файлы, 1080×1920 / density 420 / fontScale null / transitionScale 0. Все восемь hashes совпали; установленный delivery APK оставлен остановленным. original-state.json / restore.json.

## Документация и оставшиеся gates

Добавлена Accepted DEC-2026-09-25-013 по утверждённому владельцем направлению; обновлены CURRENT_IMPLEMENTATION, S9-001 task и S9_001_HOME_LAYERS. ТЗ, экономика, SQLite и исходные art masters не менялись.

S9-001 не объявляется безусловно закрытой: художественная оценка нового результата, TalkBack и physical/performance gates сохраняют свои границы. Commit/push не выполнялись.

EXECUTION_MODE: DIRECT
MODEL: gpt-6-astra
REASONING: xhigh
OTHER_MODELS_USED_FOR_CONTENT: NO
""".replace('APK_HASH',apk['apkSha256'])
(R/'README.md').write_text(readme,encoding='utf-8')
root=Path('..')
current="""

### 2026-09-25 — структурный Home по DEC-2026-09-25-013

По явному согласию владельца Home существенно пересобран: единый финансовый блок с предметом мечты, крупный Финни в спокойной native-сцене, состояние рядом, одно занятие, контекстный следующий маршрут и одна модель Домик/План/Покупки/Копилка. Боковые дублирующие предметы/маршруты удалены из Home; прогресс, полный каталог занятий, справка, сведения о питомце и защищённый взрослый раздел доступны через подписанное меню.

Короткий 360×640 имеет собственную компоновку. При fontScale >1.2 используется портрет из неизменённых принятых PNG; все обязательные данные и полное название занятия видны одновременно, без text clipping или fontScale clamp. Полнофигурные стадии сохраняют общий якорь лап. Из native rect расчётная высота силуэта стадии2: 157,05dp short / 241,22dp ordinary. Портрет кадрирует нижнюю часть тела, сохраняя уши/лицо/выражение.

Новый чистый home-next-step выбирает существующий маршрут: еда/уход, выбор мечты, накопления либо предварительный итог. CTA не покупает, не переводит и не завершает день; native подтверждения сохранены. Название занятия открывает именно рекомендованный урок через прежний openLesson; каталог остаётся в меню. Финансовая архитектура не менялась.

Evidence: Finni App/artifacts/sprint-9/S9-001-structure/README.md. Configured Verify138/138PASS; 74 native профиля; 11 fault/animation checks; exact delivery21 checks +3 contextual checks; offline API26 APK без Metro; исходные данные/settings AVD восстановлены с совпадением восьми hashes. Визуальный результат implemented-for-owner-review; geometry не означает художественное принятие. Physical/performance и настоящее TalkBack остаются NOT RUN. DEC-013 и S9_001_HOME_LAYERS описывают новую композицию/навигацию.
"""
p=root/'docs/CURRENT_IMPLEMENTATION.md'
assert 'структурный Home по DEC-2026-09-25-013' not in p.read_text(encoding='utf-8')
with p.open('a',encoding='utf-8') as f:f.write(current)
task="""

## Структурная переработка Home — 2026-09-25

По согласованному владельцем независимому разбору реализована новая композиция DEC-2026-09-25-013. Финансы/мечта объединены, Финни получил спокойную native-сцену и крупный портрет при 200%, дублирующие room/rail routes убраны, основной CTA отражает фактическое действие. Одно рекомендованное занятие открывается напрямую; полный каталог и вторичные разделы сохранены в меню. Финансовые подтверждения сохранены.

Evidence: Finni App/artifacts/sprint-9/S9-001-structure/README.md и review/. Первым выполнен native 360×640/200% stress prototype; выявленный short overlap устранён. Финальный Verify: 138 tests, 74 native profiles, 11 resource/animation checks, 21 exact-delivery checks и3contextual routes, offline APK/API26, full belief map и diff-check PASS. AVD data/settings восстановлены с SHA256-проверкой.

Реализация presentation-пакета завершена; художественная приёмка нового результата не приписана владельцу. Physical/performance остаются S10, TalkBack NOT RUN; общий статус S9-001 не повышается до безусловно done. Изменённая навигация отражена в S9_001_HOME_LAYERS.
"""
p=root/'tasks/sprint-9/S9-001_home-scene-hud-integration.md'
with p.open('a',encoding='utf-8') as f:f.write(task)
print('Final report and project documentation updated')

