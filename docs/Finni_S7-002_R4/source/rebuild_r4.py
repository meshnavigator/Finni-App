"""One-command, no-reuse R4 Blender rebuild and evidence finalization."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--blender", default=r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe")
    args = parser.parse_args()
    output, reference = Path(args.output).resolve(), Path(args.reference).resolve()
    source = Path(__file__).resolve().parent
    if not reference.is_file():
        raise RuntimeError(f"REF-001 unavailable: {reference}")
    subprocess.run((args.blender, "--background", "--python", str(source / "build_finni_r4.py"), "--", "--output", str(output), "--reference", str(reference)), check=True)
    subprocess.run((args.blender, "--background", "--python", str(source / "add_r4_uvs.py"), "--", "--output", str(output)), check=True)
    subprocess.run((sys.executable, "-B", str(source / "finalize_r4_v2.py"), "--output", str(output)), check=True)
    (output / "README.md").write_text("""# Finni S7-002 R4 candidate

R4 is a new Blender 5.2 character build, not a re-export or geometry reuse of
R3. It preserves the 15-joint/four-action diagnostic contract while replacing
the visible character with a fused sculpted fur shell, custom facial meshes,
ears, four paws, haunches, side tail, collar, medallion and embedded PBR set.

## Reproducible full rebuild (no reuse)

From the repository root, run:

```powershell
python -B docs\\Finni_S7-002_R4\\source\\rebuild_r4.py --output docs\\Finni_S7-002_R4 --reference docs\\Finni_3D_Addendum_v1.0\\reference\\finni-home-approved.png
```

The command runs Blender geometry/render build, UV-safe GLB re-export and raw
GLB structural finalization. It rebuilds every R4 still and does not import R3
geometry or copy REF-001. It changes only `docs/Finni_S7-002_R4`.

This is a candidate for technical and art review only. It is not an art/identity
PASS, a device/runtime result, an application integration result or a production
release approval.
""", encoding="utf-8")


if __name__ == "__main__":
    main()
