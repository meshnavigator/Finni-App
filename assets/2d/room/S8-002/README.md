# S8-002 room and catalog package v3

Status: **Home composition, five OBJ assets and eleven catalog illustrations
accepted by owner on 2026-09-23**.

The first 8 IT and 3 GL code-drawn thumbnails were rejected as too primitive.
Version 3 replaces them with individual painterly imagegen illustrations in
the same material and light language as the five accepted room objects.

## Source and export

- `ROOM-BASE` reuses the immutable accepted `FINNI-ROOM-CLEAN-V1` PNG from
  `FINNI-2D-MASTER-V1`. Its editable OpenRaster source is
  `docs/Finni_S7-004_2D_MASTER_v1/source/finni_home_layered_master_v1.ora`.
- `masters/*.png` are the exact 11 catalog imagegen outputs. Their hashes,
  source filenames and subjects are in `masters/source-manifest.json`; exact
  prompts are in `masters/exact-prompts.json`.
- `python -B build_assets.py` checks every master hash and deterministically
  exports 192×192 RGBA `png/it_*.png` and `png/gl_*.png` with 12 px minimum
  content padding. Five accepted OBJ PNG remain byte-for-byte unchanged.
- No image or font is fetched at build or runtime. No baked-in UI copy,
  third-party font or trademark is intentionally embedded. The base-room
  provenance remains in the accepted S7-004 package. The owner confirmed
  visual-use authority for these drawings on the same basis as S7-004
  (contest and public APK scope); provenance and hashes are recorded.

## Binding and states

`asset-manifest.json` binds all eight live `IT-*` IDs to `CAT-IT-*` and all
three live `GL-*` IDs to `CAT-GL-*`. `room-assets.ts` contains literal Metro
requires for every local file and returns `null` for unknown IDs. The catalog
IDs, names, prices, effects, purchase slots and economy logic remain in
`src/domain/catalog.ts`.

`RoomObjectsLayer` is a presentation-only overlay for the existing room and
character canvas. It owns four functional objects and receives current
`selectedGoalId` plus navigation callbacks from the parent. The goal frame
shows the selected goal image when present; without a selection it shows the
neutral goal-display image. A failed decode uses a signed text fallback. The
shop and savings cards also retain their text and controls if an image fails.

| Object | Anchor in scene | Hit region | States | Signed duplicate UI |
| --- | --- | --- | --- | --- |
| `OBJ-PLANNER` | top left, 8 dp inset | 72×72 dp | default, pressed, decode fallback | Home plan action |
| `OBJ-GOAL-DISPLAY` | top right, 8 dp inset | 72×72 dp | empty, selected GL ID, pressed, fallback | Home savings action |
| `OBJ-CARE` | bottom left, 8 dp inset | 72×72 dp | default, pressed, fallback | Home shop action |
| `OBJ-CHEST` | bottom right, 8 dp inset | 72×72 dp | default, pressed, fallback | Home savings action |
| `OBJ-COIN` | catalog/package asset | no hit target | static | wallet/currency text in Home |

The four interactive anchors leave the centre clear for Finni. Final bounds
with all S8-001 stages/variants and 360×640/390×844/412×915 devices must be
checked after the parent scene integration. There is no scene-only path to
purchase, transfer money or change a goal: all taps navigate to existing UI.

## QA matrix

| Check | Result |
| --- | --- |
| Catalog ID coverage and SHA-256 | PASS: `tests/room-assets.test.mjs` |
| Android Metro export/import | PASS: 19 local assets bundled, including all 16 S8-002 PNG files |
| Catalog master hashes, 192×192 RGBA exports and all 16 local hashes | PASS: `tests/room-assets.test.mjs` |
| Unknown item/goal ID | Source contract: `null` fallback; no dynamic Metro require |
| Decode error in room object | Source contract: signed fallback in `RoomObjectsLayer`; Android run open |
| Offline import | All sources are local; signed offline APK run open |
| Home composition and five OBJ visuals | Owner accepted on 2026-09-23 |
| Eleven new catalog visuals | Owner accepted on 2026-09-23; 64 dp sheet in `artifacts/sprint-8/S8-002-catalog-v3` |
| Physical-device run | Deferred to Sprint 10 by owner; not an S8-002 blocker |
| Other screen sizes, offline and release run | Open |

This package does not modify the historical 3D addendum manifest in the
governance tree. Its `asset-manifest.json` is the local S8-002 binding record.
The owner has accepted the new catalog art; remaining emulator/offline and release checks are tracked separately.
