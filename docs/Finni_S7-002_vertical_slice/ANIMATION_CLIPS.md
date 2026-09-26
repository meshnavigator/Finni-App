# Минимальные анимации

| Clip | Asset ID | Длительность | Loop | Что проверять | Reduced motion |
|---|---|---:|---|---|---|
| `idle` | CLIP-001 | 4.0 с | да | дыхание/качание корпуса, спокойное движение хвоста, без ухода из silhouette-safe zone | rest pose |
| `blink` | CLIP-002 | 0.24 с | нет | синхронное короткое моргание обоих глаз | no-op |
| `interest` | CLIP-003 | 1.6 с | нет | наклон головы, лёгкая реакция ушей/хвоста; читается как интерес/любопытство | небольшой статический наклон |
| `joy` | CLIP-007 | 1.2 с | нет | короткий прыжок, лапы вверх, хвост; без агрессивной амплитуды | краткая радостная поза |

Все клипы находятся в одном GLB как отдельные `animations[].name`.


## R2 structural correction

Revision **R2** replaces rejected R1. R1 allowed the room prop `Chest` to overwrite a `FinniRig` joint and to become the `idle` rotation target. R2 namespaces every rig node as `Joint.*`, freezes separate joint/object maps, and asserts that every skin joint has `extras.isJoint=true` while prop `Chest` is not an animation target. This remains an ART/INTEGRATION CANDIDATE, not an identity/art PASS.
