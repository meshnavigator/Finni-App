# S8-002 room and catalog package v2

Status: **engineering candidate; independent art and Android runtime acceptance open**.

Five functional OBJ cutouts now use warm painterly imagegen masters. Their exact
origins and prompts are recorded in `IMAGEGEN_PROVENANCE.md`. The 8 item and
3 goal illustrations remain code-drawn and require the same art review.

## Source and export

- `ROOM-BASE` reuses the immutable accepted `FINNI-ROOM-CLEAN-V1` PNG from
  `FINNI-2D-MASTER-V1`. Its editable OpenRaster source is
  `docs/Finni_S7-004_2D_MASTER_v1/source/finni_home_layered_master_v1.ora`.
- `build_assets.py` is the editable source for 11 catalog illustrations.
  `python -B build_assets.py` exports those 192×192 RGBA PNG with 4×
  supersampling and records exact SHA-256 for all 16 local files. Five OBJ
  imagegen masters are retained as exact PNG files and never redrawn by it.
- No image or font is fetched at build or runtime. The 11 code-native
  illustrations use original project geometry; five OBJ are AI-generated.
  No third-party font, trademark or baked-in UI copy is intentionally embedded.
  Product/art owner approval of the exact package remains open. The accepted base-room rights
  and generation provenance remain in S7-004's `PROVENANCE.md` and owner verdict.
- The 11 code-native illustrations use ink `#285164`, teal `#479C9C`,
  cream `#FFF2D5`, gold `#E5AC4E`, coral `#DB8172`, blue `#78B8CA`.
  The five OBJ use warm wood, cream and copper. All files have RGBA alpha.

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
| Code-native re-export equality, all 16 RGBA decodes/hashes | PASS; imagegen masters are exact-byte inputs |
| Unknown item/goal ID | Source contract: `null` fallback; no dynamic Metro require |
| Decode error in room object | Source contract: signed fallback in `RoomObjectsLayer`; Android run open |
| Offline import | All sources are local; signed offline APK run open |
| Visual composition, Finni clearance, light/material match | Open after S8-001 scene integration |
| Independent art/rights acceptance | Open; no owner verdict issued for this new package |

This package does not modify the historical 3D addendum manifest in the
governance tree. Its new `asset-manifest.json` is the proposed S6-001 binding
record for S8-002 integration.
