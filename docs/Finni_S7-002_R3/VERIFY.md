# Finni S7-002 R3 verification

Verified on 2026-09-19. This report describes an isolated candidate and does
not grant art acceptance or application release.

## Build

- Blender: 5.2.2 LTS.
- Build source: `source/build_finni_r3.py`.
- Editable source: `Finni_R3.blend`.
- Self-contained export: `Finni_R3.glb`.
- Final GLB SHA-256:
  `4d035682e96917d234f5088e5fff03d0daecbad274d1481203a41d5588245830`.

## Official glTF validator

`validator-report.json` was generated through the official Khronos
`gltf-validator` Node API:

- errors: 0;
- warnings: 0;
- infos: 16 (`UNUSED_OBJECT` for unused TEXCOORD attributes);
- hints: 0.

## GLB contrac

- glTF 2.0 GLB header and chunk lengths: valid;
- 1 skin, 15 namespaced `Joint.*` joints;
- `Chest`: one independent node and not a skin joint;
- 5 embedded images; no external texture dependency;
- actions: exactly `idle`, `blink`, `joy`, `curiosity`;
- exported action durations: 2.4 s, 1.2 s, 1.6 s and 1.8 s;
- each action's `Joint.Root` translation sample range is exactly
  `[0, 0, 0]`; the constant exported Y value `0.15` is the rest offset,
  not root sliding.

Recorded static budgets:

- GLB: 899,920 bytes;
- 49 meshes / 49 primitives;
- 14,732 vertices summed per primitive;
- 24,580 triangles;
- 8 materials;
- 65 nodes.

## Video evidence

FFprobe confirmed H.264, yuv420p, 470×836 portrait and 30 fps:

- `idle.mp4`: 72 frames, 2.4 s;
- `blink.mp4`: 36 frames, 1.2 s;
- `joy.mp4`: 48 frames, 1.6 s;
- `curiosity.mp4`: 54 frames, 1.8 s.

The videos were rerendered after the final identity-polish changes; they are
not stale previews from the earlier candidate.

## Render evidence and visual verdic

- Five 941×1672 stills, a transparent character pass and a true binary
  silhouette were generated from the final Blender scene.
- The acceptance sheet displays REF-001, neutral final render, 50% overlay and
  binary silhouette without the earlier black-panel/UV defect.
- Bounded polish is visible: smooth organic shading, seated haunches and floor
  paws, side-wrapped tail, smile/tongue, continuous cream cheeks and ches
  tufts, collar/medallion, and Chest bands/paw motif.
- Motion extremes visibly distinguish blink, joy paw lift and curiosity
  head/paw pose while preserving the seated root.

Truthful verdict: **technical candidate PASS; art/identity PASS not granted**.
The final asset remains a deliberately simple stylized low-poly approximation.
Compared with REF-001 it still lacks the approved image's fluffy silhouette,
facial subtlety, material richness and detailed Home/HUD composition. The
acceptance overlay makes that divergence explicit. Art-owner review, measured
identity gates, licensing/release decision, device runtime and application
integration remain open.

## Integrity

`SHA256SUMS.txt` contains 27 entries at the time of this report's firs
generation; after this report is added it is refreshed by
`source/finalize_r3_evidence.py`. The final checksum verification must repor
zero mismatches and no temporary frame directories.
