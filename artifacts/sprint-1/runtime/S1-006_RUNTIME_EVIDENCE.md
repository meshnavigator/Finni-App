# S1-006 — Android runtime evidence

- Дата: 2026-09-17
- Итог: **PASS**
- Package: `com.meshnavigator.finni`
- Version: `0.1.0` / `versionCode=1`
- Final APK: `../finni-0.1.0-s1-004-r4-release.apk`
- Размер: 75 814 685 bytes
- SHA-256: `3486DA3B6F0BFC46FC03D52CE2E2C825DF818CEE62A222D24732BF0EDD6B2804`
- Signing: локальный runtime-test key вне репозитория; это не production-ключ владельца

## Среда

- AVD: `small_phone`, `sdk_gphone64_x86_64`, Android 16 / API 36;
- Android Emulator 37.1.11, аппаратное ускорение WHPX;
- физическое разрешение 720×1280 px, density 320 dpi, полезный viewport
  360×640 dp;
- запуск emulator/adb выполнялся через ASCII-алиас SDK
  `C:\tmp\finni-android-sdk`: QEMU зависал при прямом пути SDK с кириллицей;
- release APK запускался без Metro; офлайн-перезапуск выполнен при
  `airplane_mode_on=1`.

AVD сохранён для дальнейшей разработки. Физический Android API 26 остаётся
отдельным carry-over gate S0-006 и не блокирует следующую задачу Sprint 1.
Перед физической/API 26 или M1-сборкой APK требуется повторная подпись штатным
release-ключом владельца проекта.

## Ход проверки и дефекты

Первый неизменяемый APK `finni-0.1.0-s1-004-release.apk`, SHA-256
`066830FD54824AE9C6DC0D73167E6D4819B91FFEA8FBA165DE3E59798ABD9930`,
установился и прошёл функциональный маршрут, но получил **FAIL** runtime-gate:
на Android status bar перекрывал имя питомца. Исходные отрицательные evidence
сохранены как `home-round-plain-360x640.*` и `home-fontscale2-*`.

После этого S1-004 была повторно открыта отдельно от evidence-прогона:
добавлены Android safe-area padding, однострочное адаптивное масштабирование
компактных подписей и ограничение роста текста внутри фиксированных 48 dp
controls. Промежуточные r2/r3 снимки сохраняют найденные регрессии
увеличенного шрифта; финальный runtime-gate выполнен на r4.

## Фактические наблюдения

| Gate | Результат | Evidence |
|---|---|---|
| TC-001: onboarding без регистрации/PII | PASS — сразу открыт детский сценарий, сеть не требуется | `r2-onboarding-360x640.png`, `.xml` |
| 9 комбинаций и первая комбинация | PASS — каталог 3×3 подтверждён тестом; runtime: `round/plain`, имя `Финни` | `r2-pet-default-360x640.*`, `r2-home-round-plain-360x640.*` |
| Отмена edit | PASS — несохранённые `pointed/spots` отменены, home остался `round/plain` | `r2-pet-pointed-spots-unsaved.*`, `r2-home-after-cancel.xml` |
| Вторая комбинация | PASS — сохранены `Finni7`, `floppy/stripes` | `r2-pet-floppy-stripes-finni7.*`, `r2-home-floppy-stripes-finni7.*` |
| TC-075: restart/persistence | PASS — force-stop и cold launch в авиарежиме восстановили имя и вид | `r2-home-offline-relaunch.*` |
| Деньги/история при edit | PASS — доступно 0, копилка 0 до и после edit/restart | соответствующие home XML; автоматический SQLite restart test |
| TC-183: home 360×640, fontScale=1 | PASS — обязательные сводные данные видны; home начинается с `y=48 px` под status bar | `r4-home-final-360x640.*` |
| Цели касания | PASS — шапка и основные actions имеют 96 px при density 2, то есть 48 dp | `r4-home-final-360x640.xml` |
| TC-185: fontScale=2 | PASS — имя/status bar не пересекаются, подписи не слипаются, низ доступен прокруткой | `r4-home-fontscale2-top.*`, `r4-home-fontscale2-bottom.*` |

`run-as` не читает SQLite release-пакета, потому что он non-debuggable. Поэтому
единственность строки профиля и неизменность ID проверены автоматическим
file-backed SQLite restart test (40/40 общий suite), а runtime подтверждает
восстановление тех же имени, внешности и нулевого финансового состояния.

## Final verdict

S1-006 — **DONE/PASS**. Runtime-критерии S1-004 закрыты; первая пользовательская
вертикаль готова к локальному merge в `dev`, S1-005 разблокирована. Нового
архитектурного решения и изменения workflow нет; Mermaid-диаграммы не меняются.
