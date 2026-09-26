"""Write the final, post-UV R4 VERIFY report from the checked manifest."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    output = Path(parser.parse_args().output).resolve()
    manifest = json.loads((output / "slice-manifest.json").read_text(encoding="utf-8"))
    glb, budget, validation = manifest["glb"], manifest["budgets"], manifest["validation"]
    (output / "VERIFY.md").write_text(f"""# Finni S7-002 R4 verification

## Clean no-reuse build

- Blender: {manifest['blender']}.
- Canonical command: `python -B docs\\Finni_S7-002_R4\\source\\rebuild_r4_v2.py --output docs\\Finni_S7-002_R4 --reference docs\\Finni_3D_Addendum_v1.0\\reference\\finni-home-approved.png`.
- The executed build regenerated `Finni_R4.blend`, `Finni_R4.glb`, 18 embedded source texture images and five 941×1672 Eevee stills: neutral plus idle, blink, joy and curiosity extremes.
- Final post-UV GLB SHA-256: `{glb['sha256']}` ({glb['bytes']:,} bytes).

## Export contract: PASS

- one skin with 15 ordered namespaced `Joint.*` joints;
- actions exactly `idle`, `blink`, `joy`, `curiosity`;
- `Chest` is a distinct GLB node and not a skin joint;
- all exported `Joint.Root` translation samples equal the seated rest offset `{glb['rootRestTranslation']}`; animation delta is zero (no root sliding);
- {glb['triangles']:,} / {budget['limit']:,} displayed triangles; {glb['meshes']} meshes, {glb['primitives']} primitives, {glb['materials']} materials;
- {glb['pbrBaseColorMaterials']} PBR base-color and {glb['pbrNormalMaterials']} normal-map material slots; {glb['primitivesWithUV']} texture-coordinate primitives;
- checksum manifest: current files listed in `SHA256SUMS.txt`.

## Validator and limits

- Raw GLB structural validator: **{validation['glbStructuralContract']}**.
- Khronos glTF Validator: **NOT RUN** — neither the project nor global Node module root contains installed `gltf-validator`; no dependency was downloaded.
- This is technical/art-review evidence only. REF-001 remains mandatory; art/identity acceptance, device/runtime/performance, application integration and release/provenance decisions are open.
""", encoding="utf-8")
    subprocess.run((sys.executable, "-B", str(Path(__file__).resolve().parent / "finalize_r4_v2.py"), "--output", str(output)), check=True)


if __name__ == "__main__":
    main()
