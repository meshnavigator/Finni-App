# S8-001 — полная матрица внешностей v1

2026-09-25. Реализованы и подключены все девять комбинаций: `pointy|round|floppy × plain|spots|stripes`. Технический Verify и API26 runtime smoke PASS. Семь новых художественных вариантов представлены владельцу для визуальной оценки; ранее принятые pointy/plain и pointy/spots сохранены.

## Артефакты

- `review/matrix-nine.jpg` — девять внешностей; `review/matrix-27.jpg` — все три стадии; `review/blink-nine.jpg` — девять blink.
- `runtime/nine-home-review.jpg` — реальные снимки всех девяти Home. Полные constructor/Home PNG и XML рядом.
- `runtime/floppy-stripes-blink.mp4` — реальная анимация новой формы/рисунка.
- `input/` — три исходных Image Gen donor; `imagegen-prompts.json` и `imagegen-provenance.json` — prompts/transport/hash/provenance.
- `components/` — зарегистрированные уши и анатомические striped части. `masks/` — механические области переноса.
- `variants/<shape>-<pattern>/source.ora` — редактируемые neutral/blink stacks; каждый содержит девять контрактных слоёв. `export/{neutral,blink}/` — 162 PNG, все 941×1672 origin0/0.
- `build_matrix.py` — воспроизводимая механическая сборка, `verify_matrix.py` — независимая проверка, `package_matrix.py` — упаковка ассетов, `runtime_smoke.py` — UI smoke.
- Production asset directory: `assets/2d/variants/FINNI-MATRIX-V1`, manifest фиксирует hashes 9 ORA и всех PNG.

## Художественные и геометрические границы

Новые уши и полосы созданы Image Gen. Процедурного рисования окраса нет. Донорские лица/позы не используются: уши извлечены отдельно и зарегистрированы у исходных корней; тело stripes передаётся через исходные анатомические маски с оригинальной alpha. У floppy уши естественно перекрывают внешний верхний край головы, но обе области глаз и мордочка пиксельно сохранены. После первой пробы устранён зазор правого уха и остаточный кончик исходного pointy-уха.

Canvas, feet anchor 470/1272, stage scales .86/1/1.12 и доменные IDs не меняются. Pattern раздельно читается на передних/задних лапах; белая грудка, носочки и хвост сохранены. Round отличается округлой верхушкой ушей; floppy — опущенными наружными складками. Цвет не является единственным отличием.

## Verify

- `verify_matrix.py` — PASS: 9 уникальных neutral, 18 кадров, 162 layer PNG, 9 ORA; exact reassembly каждого кадра, CRC, order, mergedimage; исходные pointy/plain и pointy/spots совпадают пиксельно. Глаза/мордочка, стопы и хвост совпадают с исходным neutral/blink. `verification.json`, `verify.log`.
- `npm run verify` — PASS: lint, typecheck, 132 tests/0 fail, content, fixtures. `configured-verify.log`.
- `git diff --check` — PASS. Full belief map rebuilt, `belief-build.log`.
- AVD API26, текущий debug native APK + текущий Metro JS: 9/9 constructor selection/save/Home PASS; cancel и cold restart сохраняют floppy/stripes (`runtime/smoke.json`). Визуально осмотрены все девять реальных Home; fallback не возник.
- Blink новой floppy/stripes PASS: записаны несколько циклов без пропадания; изображение предварительно декодируется, уши и полосы сохраняются. Все девять blink также осмотрены статически. AVD reduced-motion setting временно изменён 0→1 для записи и восстановлен 0.
- ReactNativeJS/AndroidRuntime error scan пуст, кроме заголовков. Master не изменён; чужие S8-002 изменения сохранены.

## Ограничения и статус S8-001

Девять внешностей теперь реально существуют в приложении; прежнее «семь отсутствуют» является историей. На устройстве проверена stage1; стадии2/3 подтверждены контрактными transforms и визуальной матрицей27, без финансового ускорения/подмены SQLite. Release/offline, физическое устройство и memory/performance не проверялись этим пакетом.

S8-001 в целом остаётся in progress: отдельные happy/thoughtful/inspired expression states и оставшиеся критерии полной задачи не объявляются готовыми. Художественную приёмку семи новых вариантов нельзя подменять техническим PASS. Внешние GitHub-действия/commit/push не выполнялись.
