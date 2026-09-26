# Интеграционные заметки

## Coordinate/scale
- glTF 2.0, Y-up; фронт персонажа направлен в +Z.
- 1 unit = 1 m.
- Финни ≈ 1.58 m по максимальному габариту.

## Ключевые имена
- Rig: `FinniRig`
- Root joint: `RigRoot`
- Head: `Head`
- Eyes: `Eye.L`, `Eye.R`
- Tail: `Tail.Base`, `Tail.Mid`, `Tail.Tip`
- Chest: `Chest` (отдельный root-level node), lid: `Chest.Lid`
- Room fragment: `Room.Floor`, `Room.BackWall`, `Room.SideWall`, `Room.Rug`

## Анимации
`idle`, `blink`, `interest`, `joy`. Перед импортом в runtime не объединять их в один timeline.

## Diagnostic review
1. Проверить валидный import GLB и наличие `skin`/joints.
2. Проверить, что все 4 animation clips перечисляются отдельно.
3. На rest pose и крайних кадрах `joy`/`interest` Финни должен оставаться полнофигурным и не терять уши/лап/хвост.
4. Сундук должен оставаться самостоятельным selectable object.
5. Проверить материалы/текстуры без сети.
6. Сравнить силуэт, пропорции, цветовую схему, глаза и хвост с оригиналом `REF-001`.

## Не считать PASS без
- side-by-side с оригинальным REF-001;
- проверки Android renderer;
- clean debug/signed release;
- назначения конкретного 3D-owner.


## R2 structural correction

Revision **R2** replaces rejected R1. R1 allowed the room prop `Chest` to overwrite a `FinniRig` joint and to become the `idle` rotation target. R2 namespaces every rig node as `Joint.*`, freezes separate joint/object maps, and asserts that every skin joint has `extras.isJoint=true` while prop `Chest` is not an animation target. This remains an ART/INTEGRATION CANDIDATE, not an identity/art PASS.
