# S1-006 — completion report

- Статус: **done**
- Дата: 2026-09-17
- Проверяемая ветка: `S1-004/onboarding-pet-and-home`
- Runtime-fix/evidence коммит: `e5437da`
- Merge в `dev`: `37c954e`
- Signing-note follow-up/merge: `5854561` / `07f3ff1`

## Результат

Создан и сохранён AVD `small_phone` (`sdk_gphone64_x86_64`, Android 16 / API
36) с viewport 360×640 dp. На нём фактически пройдены onboarding, первая
комбинация `round/plain`, отмена несохранённых `pointed/spots`, вторая
комбинация `Finni7 / floppy / stripes`, cold relaunch без Metro и fontScale 2.

Исходный immutable APK получил FAIL из-за перекрытия status bar. После
отдельного повторного открытия S1-004 собран финальный immutable r4 APK; именно
он получил final PASS. Такая последовательность не маскирует отрицательный
прогон: исходный APK, hash и снимки сохранены рядом с финальным evidence.

## Final artifact

- `Finni App/artifacts/sprint-1/finni-0.1.0-s1-004-r4-release.apk`;
- 75 814 685 bytes;
- SHA-256
  `3486DA3B6F0BFC46FC03D52CE2E2C825DF818CEE62A222D24732BF0EDD6B2804`;
- package `com.meshnavigator.finni`, version `0.1.0` / code 1,
  min/target SDK 26/36;
- подпись локальным runtime-test key вне репозитория, не production-ключом;
- полный журнал: `Finni App/artifacts/sprint-1/runtime/S1-006_RUNTIME_EVIDENCE.md`.

## Verify

- AVD 720×1280 px / density 320 = 360×640 dp — **PASS**;
- TC-001/003/075/183/185 — **PASS** с screenshots/XML;
- touch targets: 96 px / density 2 = 48 dp — **PASS**;
- `airplane_mode_on=1`, force-stop, launch without Metro — **PASS**;
- восстановлены `Finni7`, `floppy/stripes`, доступно 0, копилка 0 — **PASS**;
- fontScale 2: status bar свободен, nav labels разделены, scroll fallback
  открывает нижние controls — **PASS**;
- итоговый automated suite — **PASS**, 40/40.

## Ограничения

AVD доказывает Android runtime и разблокирует S1-005, но не заменяет
физическую API 26 регрессию S0-006. AVD сохранён; запускать emulator/adb нужно
через `C:\tmp\finni-android-sdk`, потому что QEMU зависает на прямом SDK-пути с
кириллицей.
Перед API 26/M1 нужен APK, подписанный штатным release-ключом владельца.

Архитектурных решений и workflow изменений нет; решения/диаграммы не менялись.
