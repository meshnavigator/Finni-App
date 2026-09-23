# S8-001 character candidate QA — 2026-09-23

These files are **non-production evidence**. The accepted
`FINNI-2D-MASTER-V1` neutral/blink PNGs remain the only runtime character
assets. The user attached the accepted neutral PNG as the reference. All four
candidates were generated with built-in image_gen; no bitmap was manually
retouched. Exact outputs, SHA-256, dimensions and alpha bounds are in
`candidate-manifest.json`.

| Candidate | Technical/art verdict |
| --- | --- |
| round/plain | 941×1672; paws align within 2 px, ears changed; faint alpha noise outside the character and face/body texture drift require cleanup and owner art review. |
| floppy/plain | 941×1672; silhouette and paws nearly align, but ears make the cat read as a dog; identity review rejected. |
| pointy/spots first pass | 941×1672, but the pet enlarged dramatically (alpha bounds 202,529–806,1311 versus accepted 280,724–694,1261); rejected. |
| pointy/spots correction | 981×1603 canvas, changed character bounds; rejected. |

The nine appearances and three stage-specific editable masters are **not
delivered** by these candidates. The technical layer contract and runtime stage
scaling do not substitute for matching art layers. No owner rights/art verdict
has been issued for these new outputs. The S8-003 animation recipes therefore
remain an engineering contract, not a full visual animation set.

Generation provenance: built-in image_gen in the current Codex task; accepted
source image `assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png`
(SHA-256 `8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0`).
Exact prompts and source images are recorded in the task conversation. Outputs
were copied byte-for-byte into this folder for reproducible review.
