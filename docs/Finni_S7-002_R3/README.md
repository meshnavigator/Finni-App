# Finni S7-002 R3 candidate

This is an isolated Blender/glTF candidate. It does not replace R2 and is no
integrated into the application.

Primary artifacts:

- `Finni_R3.blend` — editable Blender source;
- `Finni_R3.glb` — self-contained glTF 2.0 binary;
- `renders/neutral.png` and four motion extremes — 941×1672 evidence;
- `previews/{idle,blink,joy,curiosity}.mp4` — portrait H.264 previews;
- `renders/acceptance_sheet_ref_neutral_overlay_silhouette.png`;
- `slice-manifest.json`, `SHA256SUMS.txt`, `validator-report.json`;
- `PROVENANCE.md`.

Full rebuild:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'docs\Finni_S7-002_R3\source\build_finni_r3.py' -- --output 'docs\Finni_S7-002_R3' --reference 'docs\Finni_3D_Addendum_v1.0\reference\finni-home-approved.png'


`--reuse-stills` may resume after completed stills while rerendering all
videos. `--reuse-evidence` is only for a post-render export/manifest retry.
Neither flag should be used when model, material, light, camera, action or
scene content changed.

Run `source/finalize_r3_evidence.py --output docs/Finni_S7-002_R3` after the
official validator report has been generated. It refreshes current hashes,
budgets and ffprobe evidence without changing the 3D asset.
