# Provenance — Finni layered 2D master v1

## Sources

- Mandatory visual reference: `REF-001`,
  `../Finni_3D_Addendum_v1.0/reference/finni-home-approved.png`, SHA-256
  `84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211`.
- Neutral pet source: `../Finni_S7-002_2D_POC/finni_ref001_cutout_v1.png`,
  SHA-256 `88cd415a30faa7e3a2b9c70cd57ff59ea1d68d86ca9601438b3db93ad8ca8b86`.
- Blink pet source: `../Finni_S7-002_2D_POC/finni_ref001_blink_v1.png`,
  SHA-256 `0afee6b06cd93d018458a30dae6c240fbbdbc07075e70ce5c0e206912d0dded9`.

## Clean-room background generation

- Service: built-in Codex/OpenAI image-generation workflow.
- Date: 2026-09-21.
- Exact backend model/version and generation ID: unavailable in the built-in
  result metadata exposed to this task.
- Final generated source filename:
  `exec-bca6d1d5-151d-47b0-aa08-b1baab960c09.png`.
- Final room SHA-256:
  `2c76a1e29090e61de615c5e228bf309d34016f89aa74cac9ea1b990821ac6140`.
- Prompt intent: reproduce only the warm room visual language from `REF-001`;
  remove the pet, UI, text, numbers, money, coins, goals, product/catalog
  content and animal-shaped props; reserve a clear central floor area for a
  separately layered character.
- Iteration: the first generated room contained teddy bears and a paw-marked
  chest; the second targeted edit removed those objects and is the only room
  included in this package.

## Local derivative steps

- FFmpeg 8.0 scales the unchanged neutral/blink cutouts to `520 px` width,
  places them at the same `x=(941-w)/2`, `y=720` anchor on transparen
  `941×1672` canvases, and creates the two flattened review exports.
- `build_master.ps1` packages those three canvas-sized layers as OpenRaster.
- No financial text, catalog ID or runtime claim is added by the local build.

## Rights/terms record

- The project owner stated in the Codex task on 2026-09-21 that they are the
  responsible visual owner and confirmed authority to use the concrete images
  in contest and public APK scope.
- OpenAI individual Terms of Use checked 2026-09-21 state that, as between the
  user and OpenAI and to the extent permitted by law, the user owns Output and
  remains responsible for having rights to Input:
  https://openai.com/policies/oct-2024-row-terms/
- This record is evidence of the owner's declaration, not independent legal
  advice or a warranty against third-party similarity claims.
- RuStore publication during the contest is not authorized by this package.
