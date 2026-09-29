# FINNI-POINTY-SPOTS-V1

2026-09-25. Expressive spotted v2 художественно принят владельцем; ответ «Подходит» разрешил интеграцию.

Пакет обслуживает только `shapeId=pointy`, `patternId=spots`. Neutral — точная копия принятого `S8-001-anatomy-spots-v2/review/spots-neutral.png`. Blink механически переносит принятые 31013 пикселей окраса в исходный S7 blink: лицо, уши, хвост, alpha и пиксели вне окраса сохраняются. Нового процедурного рисования нет. Image Gen provenance и точные prompts находятся в исходном пакете v2.

`source/` содержит редактируемый ORA; `layers/` — девять нейтральных экспортных слоёв. `neutral.png` и `blink.png` — flattened runtime frames для существующего RN renderer. Canvas 941×1672, origin 0/0, feet 470/1272; масштабы .86/1/1.12. Master не изменён.

`build_runtime_assets.py` воспроизводит упаковку и pixel assertions; manifest фиксирует SHA-256. `tests/finni-appearance.test.mjs` проверяет разрешённые пары, PNG/размеры/hashes/ORA и границу scope. Итог Verify и успешный API26 debug runtime smoke: `artifacts/sprint-8/S8-001-spots-runtime/QA.md`.

Это один новый принятый вариант. Семь остальных комбинаций остаются незавершёнными: Home сохраняет прежний master fallback, конструктор — прототипы. S8-001 и требование девяти внешностей не закрыты.
