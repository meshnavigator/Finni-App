# S8-002 imagegen OBJ provenance

Five object cutouts replaced the first code-drawn icons in this package. They
were made with the built-in `image_gen` tool on 2026-09-23, without input
images. Original outputs remain under `C:/Users/skoro/.codex/generated_images/`;
the exact copied bytes and SHA-256 are in `asset-manifest.json`. No bitmap was
retouched, cropped or resized after generation. These masters retain their
native dimensions and RGBA alpha.

## OBJ-PLANNER

Original: `01a0cdcb-c511-7093-9d96-bc316dc1e8f9/exec-74627fbd-f09b-45af-804d-2f5849224eb9.png`

Prompt:

> Use case: game UI art asset. Asset type: transparent object layer for a children's financial literacy app. One small friendly paper planner notebook, no text or numbers. Soft, warm hand-painted 2.5D illustration with natural sunlight, painterly material texture, warm honey wood and cream paper, subtle teal accent. Three-quarter front view, centered, isolated transparent background, clean alpha, generous transparent padding, no cast floor shadow, no logos, no watermark. It must visually sit in a cozy sunlit living room beside a golden fluffy kitten.

## OBJ-CHEST

Original: `01a0cdcd-c3fc-73e0-a140-9bf54493427e/exec-98066193-ab7c-4cf7-b091-69313b12ba94.png`

Prompt:

> Use case: stylized-concept. Asset type: transparent PNG cutout for a children's Android app room, OBJ-CHEST. Primary request: a small closed treasure chest that is clearly a savings chest for coins, hand-painted warm 2.5D illustration. Scene/backdrop: absolutely transparent background, isolated single object, no floor or room. Style: painterly storybook with soft natural texture, warm honey wood, muted cream and copper, gentle golden late-afternoon light, matching a cozy sunlit living room with natural wood floor and plants. Composition: centered object, complete silhouette with generous transparent margin, readable at 64 dp. Constraints: no text, no numbers, no currency symbol, no extra objects, no character, no shadow beyond the object's own soft contact shadow, no border or icon tile. True alpha transparency, clean cutout edges.

## OBJ-CARE

Original: `01a0cdcd-c3fc-73e0-a140-9bf54493427e/exec-9146997c-d13f-4663-9ae8-6f12fad9d60b.png`

Prompt:

> Use case: stylized-concept. Asset type: transparent PNG cutout for a children's Android app room, OBJ-CARE. Primary request: a child's pet-care station: a low ceramic food bowl and a soft wooden grooming brush arranged as one functional object, no food package. Scene/backdrop: absolutely transparent background, isolated single object, no room. Style: painterly storybook 2.5D with soft natural texture and believable material, warm honey wood, muted cream and copper, gentle golden late-afternoon light, matching a cozy sunlit living room with natural wood floor and plants. Composition: centered complete silhouette with transparent margin, readable at 64 dp. Constraints: no text, no numbers, no extra objects, no character, no border or icon tile. True alpha transparency, clean cutout edges.

## OBJ-GOAL-DISPLAY

Original: `01a0cdcd-c3fc-73e0-a140-9bf54493427e/exec-ad3b001d-c998-4244-88d7-03490dcfe1d4.png`

Prompt:

> Use case: stylized-concept. Asset type: transparent PNG cutout for a children's Android app room, OBJ-GOAL-DISPLAY. Primary request: a small warm wooden display frame with a blank cream inset surface ready to show a chosen savings goal; no image, no text, no symbols inside frame. Scene/backdrop: absolutely transparent background, isolated single object, no room. Style: painterly storybook 2.5D with soft natural texture and believable material, warm honey wood, muted cream and copper, gentle golden late-afternoon light, matching a cozy sunlit living room with natural wood floor and plants. Composition: centered complete silhouette with transparent margin, readable at 64 dp. Constraints: no text, no numbers, no extra objects, no character, no border or icon tile. True alpha transparency, clean cutout edges.

## OBJ-COIN

Original: `01a0cdcd-c3fc-73e0-a140-9bf54493427e/exec-771f7081-997b-4a7f-a810-d4431ec10dc2.png`

Prompt:

> Use case: stylized-concept. Asset type: transparent PNG cutout for a children's Android app room, OBJ-COIN. Primary request: one playful gold coin with a subtle embossed paw-print motif, readable but not a currency symbol. Scene/backdrop: absolutely transparent background, isolated single object, no room. Style: painterly storybook 2.5D with soft natural texture and believable material, warm honey wood, muted cream and copper, gentle golden late-afternoon light, matching a cozy sunlit living room with natural wood floor and plants. Composition: centered complete silhouette with transparent margin, readable at 64 dp. Constraints: no text, no numbers, no extra objects, no character, no border or icon tile. True alpha transparency, clean cutout edges.

## Limits

The tool did not provide an exact backend model identifier, seed or reproducible
edit layers. The five OBJ production PNG files are exact copies of their generated
masters; `build_assets.py` leaves those bytes unchanged. The eleven catalog
runtime PNGs are deterministic 192×192 exports of separate exact masters.
The owner accepted the eleven catalog illustrations on 2026-09-23.
The owner confirmed visual-use authority for these drawings on the same basis
as the accepted S7-004 images (contest and public APK scope). The source
record is the owner's declaration, not an independent legal opinion.
Physical-device decode and memory budgets remain Sprint 10 checks.

## Catalog replacement v3, 2026-09-23

The owner accepted Home composition and these five OBJ images, and rejected
the previous 11 code-drawn IT/GL thumbnails as too primitive. Eleven separate
built-in `image_gen` calls produced the new transparent catalog masters.
Their exact prompts, output filenames and SHA-256 hashes are recorded in
`masters/exact-prompts.json` and `masters/source-manifest.json`. The two
accepted OBJ images used as initial style references were OBJ-CARE and
OBJ-CHEST. Later calls used the recent painterly outputs as style references.

The master PNG bytes are copied unchanged to `masters/`.
`build_assets.py` verifies their hashes and exports centered 192×192 RGBA
runtime thumbnails by alpha-bounds crop and LANCZOS resize. The original
imagegen backend model identifier and seed were not exposed by the tool.
The owner accepted all eleven catalog illustrations on 2026-09-23.
Physical-device review is deferred and does not block S8-002.
