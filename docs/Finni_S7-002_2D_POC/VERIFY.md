# Finni S7-002 2D POC verification

Verified locally on 2026-09-19.

- Open and blink assets: 1212×1298 RGBA PNG.
- Idle sprite sheet: 2048×1644 RGBA, 4×3 cells, 12 frames,
  512×548 per frame.
- Idle cutout preview: H.264, 940×1200, 30 fps, 6.0 s.
- Blink cutout preview: H.264, 940×1200, 30 fps, 4.0 s.
- Conservative full-frame REF loop: H.264, 940×1672, 30 fps, 6.0 s,
  180 frames.
- FFmpeg 8.0 completed all local conversions successfully.
- `SHA256SUMS.txt` records the initial package file hashes.

Visual conclusion: the 2D cutout preserves the approved illustrated character
substantially better than the rejected simplified R3/R4 3D attempts. It is
still a generated derivative and has not received art-owner acceptance.

Open gates: explicit decision whether this POC may supersede the accepted true
3D direction, application integration, Android runtime/performance, exact
release/provenance approval and final art review against `REF-001`.
