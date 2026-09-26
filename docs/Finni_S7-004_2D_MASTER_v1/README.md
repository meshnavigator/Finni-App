# S7-004 — Finni layered 2D master v1

Status: **ACCEPTED, 2026-09-21**.

This immutable package supplies the editable layered source and clean-room
Home art slice accepted by the named art/project-rights owner. The exact-hash
verdict is recorded in
`../Finni_S7-004_2D_ART_ACCEPTANCE/OWNER_VERDICTS_2026-09-21.md`.

## Deliverables

- `source/finni_home_layered_master_v1.ora` — OpenRaster source editable in
  Krita/GIMP, canvas `941×1672`, with separate room, neutral-pet and blink-pet
  layers. Neutral is visible by default; blink is a hidden toggle layer.
- `layers/room_clean_v1.png` — clean-room background without UI, money, text,
  catalog IDs or runtime claims.
- `layers/pet_neutral_canvas_v1.png` and
  `layers/pet_blink_canvas_v1.png` — aligned full-canvas RGBA layers.
- `exports/home_neutral_v1.png` and `exports/home_blink_v1.png` — flattened
  acceptance exports.
- `exports/acceptance_preview_v1.jpg` — side-by-side review preview.
- `master-manifest.json`, `PROVENANCE.md` and `SHA256SUMS.txt` — immutable
  identity and provenance evidence.
- `build_master.ps1` — deterministic local assembly from the recorded room and
  S7-002 candidate cutouts.

## Explicit limits

- The pet cutouts originate from S7-002 POC and retain its incomplete backend
  generation metadata.
- The room was generated with the built-in image-generation workflow and is
  recorded as AI-assisted output.
- Скоробагатько Константин Владимирович, руководитель разработки, accepted the
  exact package for contest/public APK use on 2026-09-21. RuStore publication
  during the contest remains excluded.
- This package contains one shape/pattern presentation only; the 3 stages and
  full `3×3` production set remain downstream production scope.
