# Finni S7-002 R4 candidate

R4 is a new Blender 5.2 character build, not a re-export or geometry reuse of
R3. It preserves the 15-joint/four-action diagnostic contract while replacing
the visible character with a fused sculpted fur shell, custom facial meshes,
ears, four paws, haunches, side tail, collar, medallion and embedded PBR set.

## Reproducible full rebuild (no reuse)

From the repository root, run:

```powershell
python -B docs\Finni_S7-002_R4\source\rebuild_r4_v2.py --output docs\Finni_S7-002_R4 --reference docs\Finni_3D_Addendum_v1.0\reference\finni-home-approved.png
```

The command runs a clean Blender geometry/render build, UV-safe GLB re-export
and raw GLB structural finalization. It rebuilds every R4 still and does not
import R3 geometry or copy REF-001. It changes only `docs/Finni_S7-002_R4`.

This is a candidate for technical and art review only. It is not an art/identity
PASS, a device/runtime result, an application integration result or production
release approval.
