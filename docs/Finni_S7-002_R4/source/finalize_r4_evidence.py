"""Refresh R4 hashes and independently assert exported GLB contracts.

This uses only Python's standard library.  It intentionally does not imitate a
Khronos validation report: the official validator is recorded only if it was
actually available and run by a separate process.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path


JOINTS = (
    "Joint.Root", "Joint.Spine", "Joint.Neck", "Joint.Head",
    "Joint.Ear.L", "Joint.Ear.R", "Joint.Eye.L", "Joint.Eye.R",
    "Joint.Lid.L", "Joint.Lid.R", "Joint.Paw.L", "Joint.Paw.R",
    "Joint.Tail.Base", "Joint.Tail.Mid", "Joint.Tail.Tip",
)
CLIPS = ("idle", "blink", "joy", "curiosity")
LIMIT = 40_000


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for part in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(part)
    return digest.hexdigest()


def read_glb(path: Path) -> tuple[dict[str, object], bytes]:
    data = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total != len(data):
        raise RuntimeError("Invalid GLB header")
    json_size, json_kind = struct.unpack_from("<I4s", data, 12)
    if json_kind != b"JSON":
        raise RuntimeError("GLB misses JSON chunk")
    document = json.loads(data[20:20 + json_size].decode("utf-8").rstrip(" \t\r\n\0"))
    binary_at = 20 + json_size
    binary_size, binary_kind = struct.unpack_from("<I4s", data, binary_at)
    if binary_kind != b"BIN\0":
        raise RuntimeError("GLB misses BIN chunk")
    return document, data[binary_at + 8:binary_at + 8 + binary_size]


def accessor_values(doc: dict[str, object], binary: bytes, accessor_id: int) -> list[tuple[float, ...]]:
    accessor = doc["accessors"][accessor_id]
    if accessor["componentType"] != 5126 or accessor["type"] != "VEC3":
        raise RuntimeError("Root translation accessor must be float VEC3")
    view = doc["bufferViews"][accessor["bufferView"]]
    stride = view.get("byteStride", 12)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    return [struct.unpack_from("<fff", binary, start + index * stride) for index in range(accessor["count"])]


def inspect(path: Path) -> dict[str, object]:
    doc, binary = read_glb(path)
    nodes = doc.get("nodes", [])
    skin = doc.get("skins", [])
    if len(skin) != 1:
        raise RuntimeError(f"Expected one skin, got {len(skin)}")
    joint_names = tuple(nodes[index].get("name") for index in skin[0].get("joints", []))
    if joint_names != JOINTS:
        raise RuntimeError(f"Joint contract mismatch: {joint_names}")
    animations = doc.get("animations", [])
    names = tuple(item.get("name") for item in animations)
    if set(names) != set(CLIPS) or len(names) != len(CLIPS):
        raise RuntimeError(f"Action contract mismatch: {names}")
    if "Chest" not in [node.get("name") for node in nodes] or "Chest" in joint_names:
        raise RuntimeError("Chest is not a distinct non-joint node")
    root_index = skin[0]["joints"][0]
    root_samples = []
    for animation in animations:
        for channel in animation.get("channels", []):
            target = channel.get("target", {})
            if target.get("node") == root_index and target.get("path") == "translation":
                sampler = animation["samplers"][channel["sampler"]]
                root_samples.extend(accessor_values(doc, binary, sampler["output"]))
    if not root_samples or any(any(abs(value) > 1e-7 for value in sample) for sample in root_samples):
        raise RuntimeError(f"Root translation is not locked: {root_samples}")
    triangles = 0
    primitive_count = 0
    textured_primitives = 0
    for mesh in doc.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitive_count += 1
            if "TEXCOORD_0" in primitive.get("attributes", {}):
                textured_primitives += 1
            if primitive.get("mode", 4) == 4:
                triangles += doc["accessors"][primitive["indices"]]["count"] // 3
    if triangles > LIMIT:
        raise RuntimeError(f"Triangle budget exceeded: {triangles} > {LIMIT}")
    pbr_materials = [material for material in doc.get("materials", []) if material.get("pbrMetallicRoughness", {}).get("baseColorTexture")]
    normal_materials = [material for material in doc.get("materials", []) if material.get("normalTexture")]
    return {
        "bytes": path.stat().st_size, "triangles": triangles, "triangleLimit": LIMIT,
        "meshes": len(doc.get("meshes", [])), "primitives": primitive_count,
        "nodes": len(nodes), "skins": len(skin), "joints": len(joint_names),
        "animations": sorted(names), "chestSeparate": True,
        "materials": len(doc.get("materials", [])), "embeddedImages": len(doc.get("images", [])),
        "pbrBaseColorMaterials": len(pbr_materials), "pbrNormalMaterials": len(normal_materials),
        "primitivesWithUV": textured_primitives, "rootTranslationLocked": True,
    }


def records(output: Path) -> list[dict[str, object]]:
    ignored = {"slice-manifest.json", "SHA256SUMS.txt"}
    files = [path for path in output.rglob("*") if path.is_file() and path.name not in ignored]
    return [{"path": path.relative_to(output).as_posix(), "sha256": sha256(path), "bytes": path.stat().st_size} for path in sorted(files, key=lambda path: path.relative_to(output).as_posix().lower())]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output).resolve()
    glb = output / "Finni_R4.glb"
    manifest_path = output / "slice-manifest.json"
    if not glb.is_file() or not manifest_path.is_file():
        raise RuntimeError("Run build_finni_r4.py before finalization")
    metrics = inspect(glb)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["glb"] = {"path": "Finni_R4.glb", "sha256": sha256(glb), **metrics}
    manifest["rig"]["rootTranslationLocked"] = True
    for action in manifest["actions"]:
        action["rootLocked"] = True
    manifest["budgets"] = {"displayedTriangles": metrics["triangles"], "limit": LIMIT, "status": "PASS"}
    manifest["validation"] = {
        "glbStructuralContract": "PASS",
        "rootTranslation": "PASS (all exported Joint.Root translation samples are zero)",
        "khronosValidator": "NOT RUN — no installed local gltf-validator module was found; no package was downloaded.",
    }
    manifest["files"] = records(output)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    verify = output / "VERIFY.md"
    previous = verify.read_text(encoding="utf-8")
    verify.write_text(previous + f"""
## Post-export structural verification

- UV postprocess was run after the clean Blender build: {metrics['primitivesWithUV']} texture-coordinate primitives;
- exported `Joint.Root` translation samples are all `[0, 0, 0]`;
- `{metrics['pbrBaseColorMaterials']}` PBR base-color and `{metrics['pbrNormalMaterials']}` normal-mapped materials are embedded in the GLB;
- raw GLB header/chunks, one skin, exact joint/action names, separate `Chest`, root lock and {metrics['triangles']:,}/{LIMIT:,} triangles: **PASS**;
- Khronos glTF Validator: **NOT RUN** — the installed project and global Node module roots do not contain `gltf-validator`; no package was downloaded.
""", encoding="utf-8")
    current = records(output)
    manifest["files"] = current
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "SHA256SUMS.txt").write_text("\n".join(f"{entry['sha256']}  {entry['path']}" for entry in current) + "\n", encoding="utf-8")
    print(json.dumps({"sha256": sha256(glb), "metrics": metrics, "files": len(current)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
