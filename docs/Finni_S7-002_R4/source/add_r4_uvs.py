"""Add export-safe UVs to the self-contained R4 Blender asset and re-export it.

Run after a fresh ``build_finni_r4.py`` build.  It makes no reference to R3 and
does not regenerate geometry; it supplies the generated planar UV coordinate
layer that glTF textures require, then saves and exports the complete R4 scene.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def planar_uv(obj: bpy.types.Object) -> None:
    mesh = obj.data
    if not mesh.vertices or not mesh.loops:
        return
    xs = [vertex.co.x for vertex in mesh.vertices]
    zs = [vertex.co.z for vertex in mesh.vertices]
    x_min, z_min = min(xs), min(zs)
    x_span, z_span = max(max(xs) - x_min, 1e-5), max(max(zs) - z_min, 1e-5)
    layer = mesh.uv_layers.get("UVMap") or mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        point = mesh.vertices[loop.vertex_index].co
        layer.data[loop.index].uv = ((point.x - x_min) / x_span, (point.z - z_min) / z_span)


def main() -> None:
    args = parse_args()
    output = Path(args.output).resolve()
    blend, glb = output / "Finni_R4.blend", output / "Finni_R4.glb"
    if not blend.is_file():
        raise RuntimeError(f"R4 Blender source is absent: {blend}")
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    textured = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        has_image_material = any(material and material.use_nodes and any(node.type == "TEX_IMAGE" for node in material.node_tree.nodes) for material in obj.data.materials)
        if has_image_material:
            planar_uv(obj)
            textured += 1
    bpy.ops.object.select_all(action="DESELECT")
    armature = bpy.data.objects.get("FinniR4Rig")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" or obj == armature:
            obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_yup=True, export_animations=True, export_animation_mode="ACTIONS", export_nla_strips=False, export_image_format="AUTO")
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    print(f"R4 UV export: {textured} textured meshes")


if __name__ == "__main__":
    main()
