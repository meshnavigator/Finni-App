# S6-002 — Home/HUD v2: композиционная спецификация

- Статус: **v2 для review; макет, не production UI и не runtime PASS**.
- Предыдущая база: [v1 layouts](S6-002_HOME_HUD_LAYOUTS.md) и
  [v1 wireframes](S6-002_HOME_HUD_WIREFRAMES.svg) — **rejected baseline по
  композиции**. Они не удаляются и не являются design handoff.
- Визуальная проверка: [v2 wireframes](S6-002_HOME_HUD_WIREFRAMES_v2.svg).
- Нормализованные источники, evidence и критерии: [rework brief](S6-002_REWORK_BRIEF.md).

## Решение v2

Home — одна настоящая 3D-комната, а не карточка со сценой. Камера фиксирована;
композиционный фокус — Финни. HUD живёт поверх спокойных участков комнаты и
вокруг safe silhouette. Он читаем и функционален, но не занимает половину
экрана четырьмя равными плитками. `REF-001` применяется к иерархии героя,
пространства и света, но не к его случайным суммам, объектам или контролам.

### Обычный Home: `READY`, 390 × 844 dp, 100%

`READY` выбран вместо условного `ACTIVE`, потому что EV-01 даёт реальные
проверенные runtime values только для `READY`. Перенос визуальной структуры на
`ACTIVE` разрешён, но значения `{activeLesson…}`, goal и care должны прийти из
будущей прикладной модели, а не из этого макета.

| Зона | Координаты в viewport | Содержимое и правило |
| --- | --- | --- |
| System insets | верх 24 dp, низ 24 dp | Ни HUD, ни nav не уходят в системную область. |
| Header | `x16–374`, `y24–80`, 56 dp | `Finni7`, «День ещё не начат», «Прогресс», «Для взрослого». Оба текстовых действия имеют самостоятельную 48 dp hit area. |
| Compact finance | `x16–374`, `y92–148`, 56 dp | Единая двухсекционная surface: «Доступно — 0 монет» и «Копилка — 0 монет». Это один финансовый блок, а не две высокие карточки. Числа используют `tabular-nums`. |
| Goal row | `x16–374`, `y160–204`, 44 dp visual / 48 dp target | EV-01: «Цель пока не выбрана». После goal model field показывает token `{goalLabel}`/`{goalProgress}` без выдуманного `GL-*`. |
| Room | `x0–390`, `y80–600`, 520 dp | Непрерывный интерьер; панели верхнего HUD лежат на свободной стене/окне. Нет отдельной рамки сцены. |
| Finni silhouette-safe zone | уши `x132–264, y218–270`; голова `x133–257, y250–360`; тело `x137–270, y338–530`; лапы `x140–267, y510–570`; хвост `x260–333, y365–510` | В normal Home ни постоянная панель, ни цель, care chip, dock или nav эти площади не пересекают. Будущие анимации обязаны иметь свои bounds внутри расширенной зоны `x120–345, y205–580`. |
| Care chip | `x20–126`, `y488–544`, 56 dp | EV-01: «Еда и уход — пока нет». Отдельный UI-показатель рядом с персонажем, не mood по выражению мордочки и не новая шкала. |
| Action dock | `x16–374`, `y612–738`, 126 dp | Верхняя строка: EV-01 lesson «Начни день, чтобы открыть занятие» + 48 dp переход «Задания». Нижняя строка: independent CTA «Начать день». Две цели не сливаются. |
| Bottom nav | `x0–390`, `y748–820`, 72 dp | Ровно «Домик», «План», «Покупки», «Копилка»; каждая область 90+ × 64 dp. `progress`/`adult` не добавляются как tabs. |

**Ограничение EV-01:** текущее runtime evidence подтверждает, что `План`,
`Покупки` и `Копилка` в `READY` могут быть disabled. V2 сохраняет их как
подписанные маршруты с model-derived availability; она не обещает действия до
правил периода.

### Hard mode: 360 × 640 dp, 200%

Это не уменьшенная копия ordinary Home. Системный масштаб применяется честно:

| Базовый style | В hard mode | Последствие |
| --- | --- | --- |
| pet name 20 sp | **40 sp**, line-height 48 sp | 16-code-point `Финни 1234567890` занимает две строки: «Финни» / «1234567890». |
| primary/ключевая сумма 24 sp | **48 sp**, line-height 56 sp | EV-01 `0 монет` переносится как `0` / `монет` в каждой из двух финансовых секций. |
| body/lesson/care 16 sp | **32 sp**, line-height 40 sp | Care и lesson растут по высоте; не ellipsis и не `adjustsFontSizeToFit`. |
| secondary label 12 sp | **24 sp**, line-height 30 sp | Подписи остаются текстом, не иконками без подписи. |

First fold сохраняет непрерывную комнату, длинное имя, 48 dp links, крупного
Финни и care state. Financial panel, goal, lesson и CTA начинаются после fold
в едином ScrollView, а nav закреплена внизу. Это намеренно демонстрирует, что
при этих входных ограничениях нельзя одновременно обеспечить: (a) весь набор
`HUD-001`, (b) отсутствие text reduction и (c) доминирующего полнофигурного
Финни. V2 **не объявляет `QA-005`/`QA-006` PASS** для этого профиля.

Если product owner примет scroll continuation, порядок после fold: compact
finance → goal → lesson + «Задания» → primary CTA. Если одновременно видимый
HUD является непереговорным, требуется изменение одного из внешних условий
(минимальный viewport, maximum font scale или обязательная площадь персонажа),
а не скрытое уменьшение текста.

## Data contract и gaps

| UI element | 390 ordinary value | 360 hard-mode value | Source / дальнейшее правило |
| --- | --- | --- | --- |
| Имя | `Finni7` | `Финни 1234567890` | Ordinary — EV-01 runtime; hard — EV-02 boundary probe, не persisted fixture. |
| День | «День ещё не начат» | «День ещё не начат» после имени | EV-01. |
| Баланс/копилка | `0 монет` / `0 монет` | те же EV-01 строки, реальные 48sp и перенос | EV-01; production берёт `availableLabel`/`savingsLabel`. |
| Цель | «Цель пока не выбрана» | тот же current-model placeholder после fold | EV-01. Не заменять названием цели до реализованного model field. |
| Care | «Еда и уход — пока нет» | тот же current-model placeholder рядом с Финни | EV-01; не выдавать как постоянную финальную потребность. |
| Занятие | «Начни день, чтобы открыть занятие» | то же после fold | EV-01; нет реального `LS-*` названия. |
| CTA | «Начать день» | «Начать день» после fold | EV-01; `READY` action `open-day`. |

## Interaction, safe areas и accessibility

- **Touch/input:** Header actions, goal row, lesson transition, CTA и четыре
  tab имеют непересекающиеся зоны не менее 48×48 dp. Scene object получает
  input только при active scene/no overlay; фиксированная камера не открывает
  скрытый UI via pan/pinch.
- **Overlay/Back:** Любой modal/error/adult overlay получает TalkBack focus,
  скрывает реплику Финни и блокирует scene input, dock и nav позади. Back
  сначала закрывает keyboard/верхний overlay без операции, затем возвращает на
  предыдущий экран; подтверждённую финансовую запись Back не отменяет.
- **Keyboard:** Для `NO_PROFILE`/форм keyboard-avoiding ScrollView поднимает
  focused field. `NO_PROFILE` получает отдельную композицию знакомства без
  финансового HUD; v2 не показывает её как screen frame.
- **TalkBack:** Header → finance (balance, savings) → goal → scene description
  + care → lesson → CTA → nav. Динамическую перемену суммы/состояния объявлять
  один раз. Не полагаться только на цвет, мимику или расположение.
- **Long text:** Нельзя применять `maxFontSizeMultiplier` ниже системного
  scale, `adjustsFontSizeToFit`, `minimumFontScale`, clipping или ellipsis к
  деньгам, name, goal, care или lesson. Растёт поверхность либо появляется
  описанный continuation.

## UI detail rules — после утверждения композиции

- outer room-adjacent panel radius 24 dp; вложенная interactive surface 16 dp
  с 8 dp padding: это концентрические радиусы, а не одинаковые углы.
- Depth строится двумя полупрозрачными тенями (`0 2 8` ambient и `0 12 28`
  key equivalent), не толстой рамкой. Нейтральный image/3D-preview outline —
  1 dp black/white с низкой opacity по теме.
- Числа имеют `font-variant-numeric: tabular-nums`; это не анимация денег.
- При motion-enabled press разрешён только `scale(0.96)`; transition property
  ровно `transform, opacity`, не `all`. Reduced motion: static room/Finni,
  никаких camera move, pulse, scale или скрытия доступной информации.
- Никакой motion hint не добавляется до S7 measurements. Если он понадобится,
  возможны лишь `transform`, `opacity` или `filter` после evidence first-frame
  stutter.

## Следующая волна

V2 намеренно не создаёт восемь новых схем. После product review ordinary/hard
pair нужно применить принятую композицию к `NO_PROFILE`, `loading`, `error`,
`DRAFT`, `ACTIVE`, `CLOSED`, `WAITING`, сохранив state rules v1 и brief:
отсутствие профиля не имитирует финансы; loading/error не используют fake data;
периодные CTA и availability принадлежат lifecycle/model.

## Before / After — layouts

| Before | After |
| --- | --- |
| Home был вертикальной цепочкой шапка → 2×2 HUD → короткая сцена → lesson → CTA → nav. | Комната занимает доминирующую область 80–600 dp, HUD располагается по её свободным краям, а action dock вынесен ниже safe silhouette. |
| Balance, savings, goal и care были одинаковыми карточками, конкурирующими с персонажем. | Balance+savings — одна компактная панель; цель — строка; care — chip у Финни. Все сведения сохранены, их визуальный вес различается. |
| Была защищена лишь номинальная прямоугольная сцена. | Установлены отдельные bounds ушей, глаз/головы, тела, лап и хвоста плюс animation expansion zone. |
| SVG называл 200%, но использовал мелкий schematical text. | Hard mode задаёт 40/32/24/48sp-equivalent, длинное допустимое имя, реальные переносы и scroll continuation вместо искусственного fit. |
| State contact sheet оставлял мало места для оценки одного Home. | V2 содержит только тщательно размеченный ordinary READY и hard mode; остальные states — документированные правила следующей волны. |
| V1 использовал tokens почти без связи с существующим runtime snapshot. | Все отображённые non-token values соотнесены с EV-01/EV-02; отсутствующие catalog data явно остались gap. |
