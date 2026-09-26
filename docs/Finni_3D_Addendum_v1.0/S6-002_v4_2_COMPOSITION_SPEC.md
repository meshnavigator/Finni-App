# S6-002 v4.2 — Home с HUD по периметру комнаты

- Статус: **COMPOSITION BASELINE ACCEPTED — S6-002 OPEN**.
- Принятые профили: `390×844 / 100%` и `360×640 / 100%`.
- Канонический design source: `S6-002_HOME_SYSTEM_v4_2.html`.
- V1–V3 отклонены; промежуточные V4/V4.1 не являются поставкой.
- `QA-005 NOT RUN`; `QA-006 NOT RUN`.
- HTML/CDP подтверждает геометрию design fixture, но не Android runtime,
  renderer, `48 dp`, safe-area устройства, TalkBack или приёмку.

## 1. Принятая композиция

V4.2 следует геометрии утверждённого визуального ориентира
`reference/finni-home-approved.png`:

- компактная финансовая сводка и состояние находятся сверху;
- подписанные действия находятся справа;
- основное действие плавает над нижней навигацией;
- четыре постоянных маршрута находятся снизу;
- центр экрана резервируется для полнофигурного Финни и комнаты.

Комната является полноэкранным нижним слоем; отдельной scene-card нет. Общая
геометрия двух принятых 100% профилей больше не перерабатывается без нового
блокера.

`design/S6-002_v3_scene-preview.png` сейчас выводится как blurred cover и как
contain-character. Это **двойной review-only PNG**, а не часть финального
дизайна, clean plate, 3D asset, renderer evidence или art master. Вертикальная
центральная вставка должна исчезнуть при подключении настоящей 3D-сцены; новый
цикл полировки этого приёма не планируется.

## 2. Контент, evidence и маршруты

Child UI не показывает `ACTIVE`, `GL-01` или `LS-P02`. В `<meta>` и
`data-evidence` исходника записано:

`DESIGN FIXTURE FROM SRS — NOT RUNTIME EVIDENCE`.

| Роль | Строка V4.2 | Источник и статус |
| --- | --- | --- |
| Доступно | `100 монет` | SRS TC-132; design fixture |
| Копилка | `0 монет` | SRS TC-132; design fixture |
| Цель | `Воздушный змей`; `Цель: 0 из 150 монет` | SRS §7.5 / GL-01; design fixture |
| Настроение | `Настроение: спокойно` | текущая UI-реализация |
| Care | `Еда и уход — пока нет` | текущая UI-модель |
| Занятие | `Детектив предложений` | SRS LS-P02 / TC-132; design fixture |
| Period CTA | зависит от lifecycle state | текущая `homeActionForState` |

Видны шесть обязательных маршрутов: `Домик`, `План`, `Покупки`, `Копилка`,
`Прогресс`, `Для взрослого`. Взрослый маршрут сохраняет защитный barrier.

## 3. Responsive coverage

Из одного DOM/data source сняты точные CDP-профили:

- принятый baseline: `390×844/100%`, `360×640/100%`;
- новый viewport: `412×915/100%`;
- 150%: `360×640`, `390×844`, `412×915`;
- 200%: `360×640`, `390×844`, `412×915` и full continuation `360×2200`.

В 150% все суммы, подписи, маршруты и действия остаются без горизонтального
clipping; навигация переходит в 2×2. Однако projected scene-space
`360×640/150%` имеет только `178×44 CSS px`, поэтому этот профиль **не принят
как защита Финни**. Он остаётся evidence обнаруженного ограничения, а не PASS.

В 200% интерфейс переходит в вертикальный flow. Review badge
`REVIEW CONFLICT — §2.5.3 NOT MET` сохраняется. Scroll — accessibility fallback,
но не исключение из требования одновременной видимости.

## 4. Lifecycle и shell fixtures

Один источник поддерживает параметры `state` и `shell`. Сняты:

- `READY`, `DRAFT`, `ACTIVE`, `CLOSED`, `WAITING`;
- `onboarding`, `loading`, `error`.

CTA и базовые строки lifecycle взяты из текущей UI-модели. `WAITING` имеет
настоящее disabled-состояние. `[hidden]` явно защищён от переопределения CSS,
поэтому onboarding-карточки не появляются в loading/error.

Эти PNG подтверждают только дизайн-покрытие. Они не являются доказательством,
что состояния подключены к runtime, БД или командам приложения.

## 5. Projected safe-frustum

Protected bounds считаются по `.scene-space`, а не по текущему `<img>`:

| Профиль | Projected safe-zone |
| --- | --- |
| `390×844/100%` | `x=8..242`, `y=226..702`, `234×476 CSS px` |
| `360×640/100%` | `x=8..218`, `y=208..516`, `210×308 CSS px` |
| `412×915/100%` | `x=8..264`, `y=226..773`, `256×547 CSS px` |
| `360×640/150%` | `x=8..186`, `y=390..434`, `178×44 CSS px`; insufficient |

Эти прямоугольники — композиционный резерв, не измеренные bounds 3D-модели.
S7-001/S7-002 должны проверить камеру и максимальные bounds idle, blink и
крайних поз: уши, лапы и хвост не пересекают top/right/bottom HUD.

## 6. Before / After

| Before | After |
| --- | --- |
| V4.2 ожидала общей product/design приёмки. | `390×844/100%` и `360×640/100%` приняты как композиционный baseline; S6-002 остаётся открытой. |
| Двойной PNG мог восприниматься как цельный дизайн сцены. | Cover+contain явно классифицирован как review-only техника, которая исчезает в настоящем renderer. |
| Были только 360/390 при 100% и 200%. | Добавлены 412×915 и все три профиля 150%; 412×915/200% также снят. |
| 150% не существовал в адаптивном источнике. | Добавлен 150%-layout: 2×2 navigation, отдельные top-right routes, полные суммы и подписи. |
| 360×640/150% мог получить ложный PASS по отсутствию clipping. | Зафиксирован недостаточный safe-frustum `178×44 CSS px`; профиль остаётся open. |
| HTML показывал только один ACTIVE fixture. | Добавлены READY/DRAFT/CLOSED/WAITING и отдельные onboarding/loading/error fixtures. |
| CSS мог показывать hidden onboarding content в других shell states. | `[hidden] { display: none !important; }` отделяет onboarding от loading/error. |
| WAITING выглядел как активная кнопка. | CTA получает реальный `disabled`, `aria-disabled` и спокойную визуальную подачу. |
| SRS-данные были описаны рядом, но не маркировались в HTML metadata. | Добавлена постоянная `DESIGN FIXTURE FROM SRS — NOT RUNTIME EVIDENCE` metadata. |
| `.scene-space` считался доказательством безопасности персонажа. | Записаны projected bounds и отдельный runtime gate по камере/animation bounds. |
| `48px` назывался проверенной touch target. | Уточнено: CDP подтверждает только CSS px; `48 dp` требует Android device evidence. |
| Sprint 7 ожидал полного закрытия S6-002. | S7-001 разрешён параллельно на принятом ordinary baseline; API 26 остаётся gate его PASS. |

## 7. Открытые проверки

- runtime camera/animation bounds и настоящий 3D renderer;
- 150% safe-frustum на 360×640;
- 200% конфликт §2.5.3 и ответ заказчика о допустимости scroll;
- Android `48 dp`, status/navigation bars, keyboard, back, focus и TalkBack;
- физический API 26 и release APK без Metro;
- связь lifecycle/shell fixtures с фактическим runtime;
- clean plate и identity-preserving production art.

S6-002 не закрыта. S7-001 запускается параллельно; S7-002 остаётся зависимой от
`S7-001 PASS`. `QA-005` и `QA-006` не объявляются пройденными.
