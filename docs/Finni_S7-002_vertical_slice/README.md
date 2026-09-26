# S7-002 — минимальный художественный vertical slice Финни

Статус: **ART/INTEGRATION CANDIDATE**, не production-final. Пакет подготовлен ровно для разблокировки проверки S7-002 и не подменяет полный Sprint 8.

## Что внутри

- `Finni_S7-002.glb` — самодостаточный glTF 2.0 binary с rig/skin, материалами, встроенными текстурами, 4 анимационными клипами, фрагментом комнаты и отдельным сундуком.
- `Finni_S7-002.gltf` + `Finni_S7-002.bin` + `textures/` — редактируемая/разворачиваемая версия для DCC и ручной проверки структуры.
- `source/finni_spec.json` — параметры vertical slice и связь с REF-001.
- `source/build_finni_vertical_slice.py` — воспроизводимый процедурный исходник.
- `RIGHTS_AND_PROVENANCE.md` — происхождение и права.
- `RESPONSIBILITIES.md` — роли приёмки.
- `ANIMATION_CLIPS.md` — состав минимальных анимаций.
- `INTEGRATION_NOTES.md` — узлы, единицы и ожидаемая проверка.
- `GENERATIVE_MATERIALS.md` и `generative_evidence/` — пять AI-generated
  visual references R3 с provenance; это не GLB/runtime renders.

## Состав slice

### Финни
Полнофигурный один вариант: рыже-кремовый мягко-стилизованный персонаж с большими глазами и крупным хвостом. Масштаб: 1 unit = 1 метр, общая высота около 1.58 м.

Rig/skin: `FinniRig`, 15 joints. Лицевые детали (`Eye.L`, `Eye.R`, `Muzzle`, `Nose`) находятся в иерархии головы; моргание реализовано трансформацией глаз.

### Анимации
- `idle` / `CLIP-001` — 4.0 с, loop;
- `blink` / `CLIP-002` — 0.24 с;
- `interest` / `CLIP-003` — 1.6 с;
- `joy` / `CLIP-007` — 1.2 с.

### Комната
Минимальный угол комнаты: пол, две стены, ковёр, диагностические camera/light nodes. Это не законченный интерьер.

### Сундук
`Chest` — отдельный root-level object; `Chest.Lid` — дочерний объект с заданным pivot metadata. Декоративного текста на сундуке нет.

## Что намеренно не входит

27 сочетаний внешности, три полноценные стадии роста, полный AN-001–016, законченная комната, финальный grooming/fur shader, production retopology, Android runtime/perf evidence.

## Важное ограничение

Исходный PNG `REF-001` в текущей среде не был доступен отдельным файлом. Поэтому этот пакет — **reference-directed candidate**, а не доказательство identity-preserving совпадения. Side-by-side с оригинальным `REF-001` остаётся обязательным gate перед production-статусом.

## R3 visual references

`generative_evidence/R3_art_pass_anchor.png` и четыре PNG состояний являются
AI-generated art-direction references. Они задают направление внешности и
настроения, но **не являются render фактического `Finni_S7-002.glb`, runtime
render, video или animation playback evidence**. R3 binary package из audited
source отклонён как R1 и не заменяет канонический R2 GLB этого пакета.

Подробные asset IDs, generation IDs, hashes, service/terms check и открытые
legal gates приведены в `GENERATIVE_MATERIALS.md`.


## R2 structural correction

Revision **R2** replaces rejected R1. R1 allowed the room prop `Chest` to overwrite a `FinniRig` joint and to become the `idle` rotation target. R2 namespaces every rig node as `Joint.*`, freezes separate joint/object maps, and asserts that every skin joint has `extras.isJoint=true` while prop `Chest` is not an animation target. This remains an ART/INTEGRATION CANDIDATE, not an identity/art PASS.
