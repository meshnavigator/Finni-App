# S8-001 — исправление посадки round/floppy ушей v2

2026-09-25. Исправлены шесть вариантов neutral/blink; technical Verify и API26 runtime smoke PASS. Исправленная художественная посадка ушей ожидает оценки владельца. Pointy/plain, pointy/spots, pointy/stripes и все три окраса тела приняты владельцем и сохранены.

## Причина дефекта

- Round: общий сдвиг доноров +6/+12 размещал уши вниз/вправо относительно головы; правый корень оставлял щель, левый конфликтовал с чёлкой.
- Floppy: слишком широкая маска содержала донорскую бровь и участок лба. Бинарное удаление исходной головы под любым ненулевым alpha уха давало жёсткий шов и отверстия в полупрозрачном мехе. Это меняло визуальное положение брови/глаз, хотя сами глаза оставались исходными.
- Исторический pet-face также содержал несколько волосков контура старого pointy-уха выше настоящей головы. Их нельзя использовать как защитную маску новой округлой ушной формы.

## Исправление

Уши зарегистрированы независимо: round left(-6,-4), right(-10,-4); floppy left(-3,-10), right(-12,-7) относительно исходных donor canvas. У floppy маска следует краю реальной ушной складки и исключает донорскую бровь. Под корнями сохранена исходная шерсть accepted master в узкой области примыкания; это копирование существующих пикселей, не рисование. Для round донор исключён из настоящей маски лица y>=800; для floppy передняя/задняя части alpha композитируются с исходной головой без бинарных дыр. Глаза/брови/чёлка не передвигаются.

Новых Image Gen вызовов нет. Donor hashes совпадают с v1; точные первоначальные prompts — `../S8-001-matrix-v1/imagegen-prompts.json`. Перенос, маски и root backing воспроизводимы через `build_matrix.py`; provenance в `provenance.json`.

## Доказательства

- `review/ear-fit-before-after.jpg` — крупное итоговое сравнение neutral; `review/ear-fit-blink-before-after.jpg` — blink.
- `review/matrix-nine.jpg`, `review/stage-1-nine.jpg` / stage-2 / stage-3 — обновлённая матрица.
- `runtime/six-home-review.jpg` — шесть реальных Home; полные constructor/Home PNG/XML рядом.
- `runtime/round-blink.mp4`, `runtime/floppy-blink.mp4` и contact sheets — реальное моргание обеих исправленных форм.
- `variants/` — 9 ORA / 18frames / 162exports. Production package прежний `assets/2d/variants/FINNI-MATRIX-V1`, revision=ear-fit-v2; все hashes обновлены. Pointy ORA тоже сохранены byte-identical.

## Фактический Verify

- Independent `verify_matrix.py` PASS: exact ORA/layer/merged reconstruction, 18frames, 9 unique neutral; защищённые области обеих глаз, мордочки, центральной чёлки и брови — 0 pixel differences относительно принятого neutral/blink. Все окрасы ниже y1035 — 0 differences относительно v1. Pointy neutral/blink byte-identical. `verification.json`, `verify.log`.
- Дополнительно все файлы трёх pointy-пакетов (PNG, preview, exports, ORA) byte-identical v1; `pointy-preservation.json`.
- `npm run verify` PASS: lint/typecheck, 132tests/0fail, content/fixtures. После сохранения старых pointy ORA и обновления hashes focused suite8/8 PASS (`final-focused.log`).
- API26 debug+Metro: 6/6 constructor selection/save/Home PASS; cancel и cold restart сохраняют ожидаемый floppy/stripes (`runtime/smoke.json`). После этого для записи blink выбран round/stripes; это текущее тестовое состояние AVD.
- Обе blink-записи осмотрены: без пропадания/скачка, новое положение ушей устойчиво. Один uiautomator dump при включённой анимации не получил idle state; запись и ранее завершённый UI sweep доступны и осмотрены. Runtime exception scan пуст.
- `git diff --check` PASS. Runtime TypeScript/imports/routes/DB не менялись; новая belief map не требуется для asset-only correction. Прежние pointy/coat geometry и renderer контракт сохраняются.

## Статус и ограничения

Владелец принял pointy×3 и все body patterns. Round/floppy ear-fit-v2 — pending-owner-review; технический PASS не заменяет художественную приёмку. Обновлены CURRENT_IMPLEMENTATION, задача, acceptance note в decisions и подпись диаграммы; topology runtime не изменена. S8-001 не закрывается целиком: остальные expression states и финальные gates остаются. Release/offline, physical device и performance здесь не проверялись. Чужие изменения сохранены, внешних Git-действий нет.
