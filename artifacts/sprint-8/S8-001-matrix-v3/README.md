# S8-001 — локальное исправление швов v3

Основание: `input/owner-marked-seams.png`. Сравнение v2 → v3: `review/ear-fit-before-after.jpg`, `review/ear-fit-blink-before-after.jpg`; четыре отмеченных стыка при 200%: `review/four-seams-200pct.jpg`.

Все новые цвета шерсти взяты из ранее созданных Image Gen donors. Новых вызовов Image Gen нет. Правка механическая: маски, непрерывное alpha-перекрытие и локальная регистрация готовой шерсти. Исходный master и утверждённые окрасы не перерисовываются.

Воспроизведение из code_root:

```text
python -B artifacts/sprint-8/S8-001-matrix-v3/build_matrix.py
python -B artifacts/sprint-8/S8-001-matrix-v3/review_from_exports.py
python -B artifacts/sprint-8/S8-001-matrix-v3/review_seams.py
python -B artifacts/sprint-8/S8-001-matrix-v3/verify_matrix.py
python -B artifacts/sprint-8/S8-001-matrix-v3/verify_pointy_preservation.py
python -B artifacts/sprint-8/S8-001-matrix-v3/package_matrix.py
npm run verify
```

`--draft` собирает только round/plain и floppy/plain для промежуточного визуального QA; такой manifest нельзя пакетировать. `--round-only` пересобирает round, сохраняя остальные уже собранные состояния.

Художественный статус: owner-accepted (2026-09-25). Технические результаты — `QA.md`.


## Художественная приёмка — 2026-09-25

Владелец: «Принимаю, всё устраивает. что дальше?». Принята матрица 3 формы × 3 узора, включая исправленные round/floppy ear-seams-v3. Точные neutral/blink/ORA hashes закреплены в `acceptance.json`. Предыдущие pending-owner-review отметки в протоколе отражают состояние до этого ответа. Это закрывает художественную приёмку девяти внешностей, но не новых выражений и не всей S8-001.
