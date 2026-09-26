# Finni S7-002 R3 provenance

Status: **candidate only — not art PASS, not production, not integrated**.

## Authorship and toolchain

- Built on 2026-09-19 with Blender 5.2.2 LTS by
  `source/build_finni_r3.py`.
- Geometry, rig, actions, room fragment, Chest decoration and textures are
  generated procedurally by that project-local Python source.
- The package contains no downloaded mesh, rig, animation, font or texture.
- Video previews are actual Blender renders encoded locally with FFmpeg/H.264.
- Official glTF validation evidence is stored in `validator-report.json`.

The supplied intended art-owner and technical-owner name is recorded exactly,
without correction, as `Скоробагатько Константин Владимирочич`. This record
does not constitute either owner's acceptance or signature.

## Approved identity reference

The actual REF-001 image is read from outside this candidate directory and is
not copied into the package:

- `../Finni_3D_Addendum_v1.0/reference/finni-home-approved.png
- SHA-256:
  `84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211

The reference is embedded only visually into the generated acceptance sheet.
Its existing project rights and approval record are not re-granted by this
candidate.

## Mood-only generative evidence

The five prior R3 PNGs were consulted only as mood/gesture references. They
were not used as texture, geometry, training input, image input, or an identity
baseline for this build:

- `R3_art_pass_anchor.png` —
  `5faa75f1cb128fd26e5bf33299b9a1726dfe9956ef6a9520354fac7331149d05
- `clip_idle.png` —
  `c9b3fc093f3a54b38e216b6b8eae673edbcbda32ecc0831945065331829a9288
- `clip_blink.png` —
  `d0487d1a42bfa61d63e48ae837519ce6e7a78ce6dbebb414d6aabf0f2611568f
- `clip_joy.png` —
  `2afa6ccb1a2615e1fe05680a321c9269dc8b7a506542a859ea440a0199c23c00
- `clip_curiosity.png` —
  `c89f927e4e8447bda56cd77e9934b48b738fdc03c36f381ff411a674a13f8580

Their service-level provenance remains in the earlier vertical-slice evidence
package and is not restated as provenance for this independently generated 3D
asset.

## Limitations

- Visual identity and animation quality require explicit art-owner review.
- The acceptance overlay is evidence for review, not a measured identity PASS.
- `silhouetteIoU`, landmark error and color-difference gates remain
  `NOT MEASURED`.
- Device runtime/performance and application integration are outside this
  isolated candidate.
- A licensing/release decision is still required before production use.
