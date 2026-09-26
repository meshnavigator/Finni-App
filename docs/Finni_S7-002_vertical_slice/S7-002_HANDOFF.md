# Текст передачи материалов для S7-002

Передаём минимальный художественный vertical slice для разблокировки S7-002.

Готово:
- один полнофигурный вариант Финни;
- редактируемый glTF-исходник + self-contained GLB + процедурный source;
- rig/skin, материалы и локальные текстуры;
- `idle`, `blink`, `interest`, `joy`;
- минимальный фрагмент комнаты;
- `Chest` отдельным объектом;
- ведомость происхождения/прав;
- пять AI-generated R3 visual references с hashes и generation IDs; это только
  art-direction evidence, а не GLB/runtime renders. Audited visual-source
  package содержал отклонённый R1 binary; отдельный R3 model candidate живёт
  вне R2 package и имеет только technical non-device evidence;
- роли appearance и 3D-source назначены в `RESPONSIBILITIES.md`:
  **Скоробагатько Константин Владимирочич**.

Не заявляем как готовое: 27 сочетаний, полный AN-001–016, законченный интерьер,
production grooming/retopology, identity-preserving соответствие без
side-by-side с оригиналом REF-001, product/legal acceptance, R2 runtime/perf
evidence или production render/animation evidence из R3 PNG.


## R2 structural correction

Revision **R2** replaces rejected R1. R1 allowed the room prop `Chest` to overwrite a `FinniRig` joint and to become the `idle` rotation target. R2 namespaces every rig node as `Joint.*`, freezes separate joint/object maps, and asserts that every skin joint has `extras.isJoint=true` while prop `Chest` is not an animation target. This remains an ART/INTEGRATION CANDIDATE, not an identity/art PASS.
