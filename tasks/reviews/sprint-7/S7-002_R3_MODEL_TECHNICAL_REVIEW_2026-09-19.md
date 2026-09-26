# S7-002 R3 model candidate — technical review

## Статус

**TECHNICAL PASS (non-device only); ART PASS НЕ ПРИСВОЕН, 2026-09-19.**
`docs/Finni_S7-002_R3/Finni_R3.glb` — отдельный R3 Blender candidate, не
production asset и не ресурс `Finni App`. Он не заменяет канонический R2 GLB и
не меняет статусы `PET-MASTER`, `ROOM-BASE`, `OBJ-CHEST` или `CLIP-*`.

## Проверенная структура

- SHA-256 GLB: `4d035682e96917d234f5088e5fff03d0daecbad274d1481203a41d5588245830`;
  размер `899920` bytes; toolchain Blender `5.2.2`.
- `24580` triangles, `14732` summed vertices, 8 materials, 5 embedded images,
  1 skin с 15 joints и 4 actions: `idle`, `blink`, `joy`, `curiosity`.
- Khronos glTF Validator: 0 errors, 0 warnings. Root translation delta: zero.
- Package фиксирует 28 checksums. Четыре H.264/yuv420p MP4 имеют 470×836 и 30
  fps: idle 72 frames/2.4 s; blink 36/1.2 s; joy 48/1.6 s; curiosity 54/1.8 s.

## Отделение R1, R2 и R3

Audited visual-reference source package содержал отклонённый R1 GLB (SHA-256
`26011d81398eb8f9a16a39400e0244c933564cb3c2b21907982cf84f2c0a219b`) и не
был импортирован. Канонический R2 GLB сохранён с SHA-256
`d5e4ed776b32c04a06eed27eeffaf53746ab06cff19fa76cf00da69d6e20ca83`.
Этот review фиксирует самостоятельный R3 candidate и не выдает R3 PNG за
рендеры GLB или runtime evidence.

## Открытые gates

- `REF-001` остаётся mandatory для side-by-side identity review; R3 PNG —
  только mood/pose references.
- Art/identity acceptance не проводилась. Метрические IoU/landmark checks в
  package имеют статус `NOT MEASURED`.
- REF-001 record: ChatGPT Images 2.5, но exact backend/date/prompts —
  `not recorded/unavailable`; personal ChatGPT account, country/jurisdiction и
  явное legal permission для competition/public APK не подтверждены.
- Нет интеграции в `Finni App`, Android runtime/performance evidence, signed
  release или физической device-проверки.

Следовательно, S7-002 остаётся **IN PROGRESS / ART BLOCKED**. Этот review не
является done-report и не открывает Sprint 8.
