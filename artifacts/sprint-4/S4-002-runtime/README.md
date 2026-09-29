# S4-002 — UI и доступность, Android API 26

Проверка 2026-09-28 на AVD `finni_s3_007_api26`, Android API 26, x86_64. Source: `f86dc29bcc7b9a5a29094c6833949d8a59629c1f` плюс локальная правка `src/ui/budget-purchase-renderers.tsx`. QA APK: `android/app/build/outputs/apk/release/app-release.apk`, SHA-256 `F9BDFCDFD58B185ABE5A20E24AF1A8BB2E01706A8481A8FFFFECC1FC4DEC17F0`. Сборка использует публичный debug keystore; это не поставочная подпись. `build-final.log` — повторная сборка после локальной LF-нормализации JSON контента.

Установленный ранее APK имел другую подпись и устаревший экран. Его и восемь приватных файлов AVD сохранили в `C:\tmp\s4-002-avd-prior-install` до замены. Его UI не используется как evidence S4-002. Новый APK установлен после удаления прежнего пакета. `fresh-home.png` показывает экран знакомства, `modern-home.png` — новый Home/HUD после создания профиля: раздельная финансовая сводка, цель, сцена Финни, занятие, CTA и пять разделов с «Ещё».

## Матрица

| Профиль | Состояние | Evidence | Результат |
|---|---|---|---|
| 1080×1920 px, density 420, 100% | Home, новый профиль | `modern-home.png/xml` | Суммы 0/0, цель, стадия 1, занятие, CTA и навигация видимы. |
| 945×1680 px = 360×640 dp, 200% | Home до/после открытия дня | `home-360x640-200.png/xml`, `after-open-day.xml` | Суммы 0/0 и затем 100/0, цель, состояние, урок, CTA доступны; крупный вариант навигации. |
| 945×1470 px = 360×560 dp, 200% | Home с открытым днём | `home-360x560-200.png/xml` | Суммы 100/0, цель, состояние, урок и CTA видимы без пересечения. |
| 945×1680 px, 200% | LS-B01 | `lesson-b01-360x640-200-top/fields/inputs.png/xml` | Заголовок, условия, три поля и actions достижимы прокруткой. XML содержит labels «Нужно», «Хочется», «На мечту». |
| 945×1680 px, 100% | LS-B01 | `lesson-b01-360x640-100.png/xml` | Категории имеют текст, разные формы ■/●/★ и разные полосы; подписи полей и подсказки доступны. |

Формы прокручиваются вертикально; XML-проверка подтверждает наличие элементов, снимки — видимый результат. Полный проход от ввода сумм до завершения урока и все ключевые экраны при каждом профиле здесь не засвидетельствованы. Три стадии питомца, сцена выбранной цели и контраст в монохроме не получили нового native прогона этим пакетом. `pm list packages` не нашёл TalkBack на AVD: spoken focus/back маршрут остаётся **NOT RUN**. Source уже содержит сохранение motion/sound preferences и системный reduce motion; тесты `finni-presentation-preferences`/`finni-animation-set` входят в пройденный `npm run test`. Реальное переключение настроек на AVD в этом пакете не проверено.

## Verify

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test` — PASS, 155/155.
- `npm run content` — FAIL на исходном Windows checkout: `core.autocrlf=true` меняет raw-byte hashes JSON; PASS после временного CRLF→LF в 13 файлах. Временная нормализация откатана, manifest и tracked JSON не изменены.
- `npm run fixtures` — PASS.
- `gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --offline` — PASS; финальный SHA выше.
- `git diff --check` — PASS.

После проверки возвращены исходные `1080×1920`, density 420 и отсутствие `font_scale`; приложение остановлено. AVD передан S4-001 с установленным новым APK. Решения и workflow-диаграмма не менялись: изменение касается только visual/label presentation двух уроков.
