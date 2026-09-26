"""Correct R4 finalization: root lock is constant exported translation, not origin zero.

Blender's glTF exporter serializes the armature rest Y offset in every Root
translation key.  This verifier asserts that each sample is identical, which
proves zero root-motion delta while preserving the seated rest pose.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import finalize_r4_evidence as base


def inspect(path: Path) -> dict[str, object]:
    doc, binary = base.read_glb(path)
    nodes, skins, animations = doc.get("nodes", []), doc.get("skins", []), doc.get("animations", [])
    if len(skins) != 1:
        raise RuntimeError(f"Expected one skin, got {len(skins)}")
    joint_names = tuple(nodes[index].get("name") for index in skins[0].get("joints", []))
    if joint_names != base.JOINTS:
        raise RuntimeError(f"Joint contract mismatch: {joint_names}")
    names = tuple(item.get("name") for item in animations)
    if set(names) != set(base.CLIPS) or len(names) != len(base.CLIPS):
        raise RuntimeError(f"Action contract mismatch: {names}")
    if "Chest" not in [node.get("name") for node in nodes] or "Chest" in joint_names:
        raise RuntimeError("Chest is not a distinct non-joint node")
    root = skins[0]["joints"][0]
    samples = []
    for animation in animations:
        for channel in animation.get("channels", []):
            target = channel.get("target", {})
            if target.get("node") == root and target.get("path") == "translation":
                samples.extend(base.accessor_values(doc, binary, animation["samplers"][channel["sampler"]]["output"]))
    if not samples or any(any(abs(value - first) > 1e-7 for value, first in zip(sample, samples[0])) for sample in samples):
        raise RuntimeError(f"Root translation slides: {samples}")
    triangles = 0
    primitive_count = 0
    uv_primitives = 0
    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitive_count += 1
            uv_primitives += int("TEXCOORD_0" in primitive.get("attributes", {}))
            if primitive.get("mode", 4) == 4:
                triangles += doc["accessors"][primitive["indices"]]["count"] // 3
    if triangles > base.LIMIT:
        raise RuntimeError(f"Triangle budget exceeded: {triangles} > {base.LIMIT}")
    pbr = [item for item in doc.get("materials", []) if item.get("pbrMetallicRoughness", {}).get("baseColorTexture")]
    normal = [item for item in doc.get("materials", []) if item.get("normalTexture")]
    return {"bytes": path.stat().st_size, "triangles": triangles, "triangleLimit": base.LIMIT,
            "meshes": len(doc.get("meshes", [])), "primitives": primitive_count, "nodes": len(nodes),
            "skins": 1, "joints": len(joint_names), "animations": sorted(names), "chestSeparate": True,
            "materials": len(doc.get("materials", [])), "embeddedImages": len(doc.get("images", [])),
            "pbrBaseColorMaterials": len(pbr), "pbrNormalMaterials": len(normal),
            "primitivesWithUV": uv_primitives, "rootTranslationLocked": True,
            "rootRestTranslation": list(samples[0])}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    output = Path(parser.parse_args().output).resolve()
    glb, manifest_path = output / "Finni_R4.glb", output / "slice-manifest.json"
    if not glb.is_file() or not manifest_path.is_file():
        raise RuntimeError("Run build_finni_r4.py before finalization")
    metrics = inspect(glb)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["glb"] = {"path": "Finni_R4.glb", "sha256": base.sha256(glb), **metrics}
    manifest["rig"]["rootTranslationLocked"] = True
    for action in manifest["actions"]:
        action["rootLocked"] = True
    manifest["budgets"] = {"displayedTriangles": metrics["triangles"], "limit": base.LIMIT, "status": "PASS"}
    manifest["validation"] = {"glbStructuralContract": "PASS",
                              "rootTranslation": f"PASS (all exported samples identical; rest offset {metrics['rootRestTranslation']})",
                              "khronosValidator": "NOT RUN — no installed local gltf-validator module was found; no package was downloaded."}
    verify = output / "VERIFY.md"
    verify.write_text(verify.read_text(encoding="utf-8") + f"""
## Post-export structural verification

- UV postprocess was run after the clean Blender build: {metrics['primitivesWithUV']} texture-coordinate primitives;
- exported `Joint.Root` translation samples are identical at rest offset `{metrics['rootRestTranslation']}`; delta is zero;
- `{metrics['pbrBaseColorMaterials']}` PBR base-color and `{metrics['pbrNormalMaterials']}` normal-mapped materials are embedded;
- raw GLB chunks, one skin, exact joints/actions, separate `Chest`, root lock and {metrics['triangles']:,}/{base.LIMIT:,} triangles: **PASS**;
- Khronos glTF Validator: **NOT RUN** — no local or global installed module was found; no package was downloaded.
""", encoding="utf-8")
    current = base.records(output)
    manifest["files"] = current
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "SHA256SUMS.txt").write_text("\n".join(f"{entry['sha256']}  {entry['path']}" for entry in current) + "\n", encoding="utf-8")
    print(json.dumps({"sha256": base.sha256(glb), "metrics": metrics, "files": len(current)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
