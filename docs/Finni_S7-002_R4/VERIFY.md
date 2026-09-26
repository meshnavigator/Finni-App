# Finni S7-002 R4 verification

## Clean no-reuse build

- Blender: 5.2.2 LTS.
- Canonical command: `python -B docs\Finni_S7-002_R4\source\rebuild_r4_v2.py --output docs\Finni_S7-002_R4 --reference docs\Finni_3D_Addendum_v1.0\reference\finni-home-approved.png`.
- The executed build regenerated `Finni_R4.blend`, `Finni_R4.glb`, 18 embedded source texture images and five 941×1672 Eevee stills: neutral plus idle, blink, joy and curiosity extremes.
- Final post-UV GLB SHA-256: `f7d0f42c91c0312af1fbab305c7bf6da1a5b51a14318953811632e95d435f408` (1,721,176 bytes).

## Export contract: PASS

- one skin with 15 ordered namespaced `Joint.*` joints;
- actions exactly `idle`, `blink`, `joy`, `curiosity`;
- `Chest` is a distinct GLB node and not a skin joint;
- all exported `Joint.Root` translation samples equal the seated rest offset `[0.0, 0.11999999731779099, 0.0]`; animation delta is zero (no root sliding);
- 35,986 / 40,000 displayed triangles; 29 meshes, 30 primitives, 15 materials;
- 6 PBR base-color and 6 normal-map material slots; 11 texture-coordinate primitives;
- checksum manifest: current files listed in `SHA256SUMS.txt`.

## Validator and limits

- Raw GLB structural validator: **PASS**.
- Khronos glTF Validator: **NOT RUN** — neither the project nor global Node module root contains installed `gltf-validator`; no dependency was downloaded.
- This is technical/art-review evidence only. REF-001 remains mandatory; art/identity acceptance, device/runtime/performance, application integration and release/provenance decisions are open.

## Post-export structural verification

- UV postprocess was run after the clean Blender build: 11 texture-coordinate primitives;
- exported `Joint.Root` translation samples are identical at rest offset `[0.0, 0.11999999731779099, 0.0]`; delta is zero;
- `6` PBR base-color and `6` normal-mapped materials are embedded;
- raw GLB chunks, one skin, exact joints/actions, separate `Chest`, root lock and 35,986/40,000 triangles: **PASS**;
- Khronos glTF Validator: **NOT RUN** — no local or global installed module was found; no package was downloaded.
