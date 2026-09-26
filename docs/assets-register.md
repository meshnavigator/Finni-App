# Реестр ассетов

## Правила статуса

Этот реестр ведётся по SRS v1.3 §22.8 и NFR-19. Запись `candidate` или
`comparative_evidence` не разрешает import в production runtime, не подтверждает
права и не заменяет отдельный verdict art owner и product/legal owner.

`REF-001`, S7-002 POC, R1–R4 и 3D addendum — неизменяемые evidence packages.
Их хеши фиксируются для сопоставления, а не как разрешение перезаписывать или
переносить файл в приложение.

## Записи S7-004/S7-006 (2026-09-21)

| assetId | Путь | Назначение / статус | Происхождение и ручная доработка | Фиксированные свойства | Права / открытый gate |
| --- | --- | --- | --- | --- | --- |
| `REF-001` | `Finni_3D_Addendum_v1.0/reference/finni-home-approved.png` | mandatory visual reference; historical, не runtime asset | Концепт из переписки; source service указан в historical `asset-manifest.json` как ChatGPT Images 2.5. Точный backend date/prompt отсутствует. | SHA-256 `84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211`; 941×1672 RGB, alpha channel отсутствует (fresh scan 2026-09-20). | Named project/rights owner принял использование reference relationship для exact `FINNI-2D-MASTER-V1` в contest/public APK; RuStore во время конкурса исключён. |
| `S7-002-2D-OPEN-V1` | `Finni_S7-002_2D_POC/finni_ref001_cutout_v1.png` | comparative candidate, neutral pose; не production | Built-in image-generation workflow из `REF-001`, 2026-09-19; manual edit не заявлен. | SHA-256 `88cd415a30faa7e3a2b9c70cd57ff59ea1d68d86ca9601438b3db93ad8ca8b86`; 1212×1298 RGBA; non-zero-alpha bbox `[0,0,1178,1294)` (fresh scan 2026-09-20). | Exact backend/model/generation ID и terms applicability unavailable; art и product/legal acceptance open. |
| `S7-002-2D-BLINK-V1` | `Finni_S7-002_2D_POC/finni_ref001_blink_v1.png` | comparative candidate, closed-eyelid pose; не production | Generated from `S7-002-2D-OPEN-V1` с заявленным ограничением изменения: closed eyelids; manual edit не заявлен. | SHA-256 `0afee6b06cd93d018458a30dae6c240fbbdbc07075e70ce5c0e206912d0dded9`; 1212×1298 RGBA; non-zero-alpha bbox `[0,0,1180,1298)` (fresh scan 2026-09-20). | Same unresolved provenance/rights as OPEN; no owner verdict. |
| `S7-002-2D-IDLE-SHEET-V1` | `Finni_S7-002_2D_POC/finni_idle_sprite_4x3_v1.png` | comparative candidate derivative; не production | Local FFmpeg 8.0 derivative of POC images; no new image transmission stated. | SHA-256 `7f82deb89fbb85f22fe22a4ebd1a80c7fd02d4cdc6741093a9f7e2ca2bfa918e`; 2048×1644 RGBA, 4×3, 12×(512×548); non-zero-alpha bbox `[7,11,2026,1623)` (fresh scan 2026-09-20). | Inherits unresolved source rights; no production ID or acceptance. |
| `FINNI-ROOM-CLEAN-V1` | `Finni_S7-004_2D_MASTER_v1/layers/room_clean_v1.png`; runtime copy `Finni App/assets/2d/master/FINNI-2D-MASTER-V1/room_clean_v1.png` | production Home room layer | AI-assisted built-in image-generation workflow; exact limitations in `PROVENANCE.md`; no financial data embedded. | SHA-256 `2c76a1e29090e61de615c5e228bf309d34016f89aa74cac9ea1b990821ac6140`; 941×1672 RGB. | Accepted by Скоробагатько Константин Владимирович for contest/public APK; RuStore contest publication excluded. |
| `FINNI-PET-NEUTRAL-CANVAS-V1` | `Finni_S7-004_2D_MASTER_v1/layers/pet_neutral_canvas_v1.png`; runtime copy under `Finni App/assets/2d/master/FINNI-2D-MASTER-V1/` | production neutral Home layer | Aligned derivative in editable OpenRaster master; source relationship and manual assembly recorded. | SHA-256 `8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0`; 941×1672 RGBA. | Same named owner/hash-bound acceptance. |
| `FINNI-PET-BLINK-CANVAS-V1` | `Finni_S7-004_2D_MASTER_v1/layers/pet_blink_canvas_v1.png`; runtime copy under `Finni App/assets/2d/master/FINNI-2D-MASTER-V1/` | production blink Home layer | Aligned blink toggle layer in editable OpenRaster master. | SHA-256 `2797ab29e3d6b91d4342f80a71c892a574751513833c569c53e7f8c077b51905`; 941×1672 RGBA. | Same named owner/hash-bound acceptance. |

## Обязательные поля до production status

Для нового master/export добавить immutable `assetId`, versioned path, SHA-256,
dimensions, alpha bounds, назначение, editable source relationship, author/service,
model и доступную версию, дату, source/references, manual edits, terms URL и
проверенную дату, разрешённый scope, status и hash-bound owner verdicts. Не
выдавать generated derivative за ручную иллюстрацию.

Использование в contest submission APK, public APK или иной distribution scope
пишется дословно в product/legal verdict. Во время конкурса нельзя молча
подменять это разрешением на публикацию в RuStore: SRS S05-16 фиксирует запрет
такой публикации.
