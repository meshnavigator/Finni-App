"""Rebuild the R4 Finni art-slice without importing R3 geometry.

R3 is deliberately used only as the public rig/clip/export shell.  This source
constructs a new, joined organic fur shell, facial meshes and PBR texture set
from scratch.  It writes exclusively below ``--output`` and reads REF-001 only
for the review sheet; REF-001 is never copied into, or embedded in, the GLB.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


FPS = 30
PORTRAIT = (941, 1672)
TRIANGLE_LIMIT = 40_000
JOINTS = (
    "Joint.Root", "Joint.Spine", "Joint.Neck", "Joint.Head",
    "Joint.Ear.L", "Joint.Ear.R", "Joint.Eye.L", "Joint.Eye.R",
    "Joint.Lid.L", "Joint.Lid.R", "Joint.Paw.L", "Joint.Paw.R",
    "Joint.Tail.Base", "Joint.Tail.Mid", "Joint.Tail.Tip",
)
CLIPS = {"idle": 150, "blink": 42, "joy": 66, "curiosity": 60}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--reference", required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_output(value: str) -> Path:
    output = Path(value).resolve()
    if output == Path(output.anchor) or len(output.parts) < 3:
        raise RuntimeError("Refusing unsafe output path")
    output.mkdir(parents=True, exist_ok=True)
    return output


def look_at(obj: bpy.types.Object, point: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def configure_eevee(scene: bpy.types.Scene) -> None:
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            return
        except (TypeError, ValueError):
            pass
    raise RuntimeError("Eevee is unavailable")


def world(scene: bpy.types.Scene, name: str) -> bpy.types.World:
    if scene.world is None:
        scene.world = bpy.data.worlds.new(name)
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.017, 0.011, 1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32
    return scene.world


def texture_pixels(kind: str, size: int = 192) -> list[float]:
    """Return a small, deterministic hand-authored-looking PBR texture."""
    palette = {
        "orange": ((0.96, 0.35, 0.055), (0.46, 0.075, 0.014)),
        "cream": ((1.0, 0.79, 0.42), (0.64, 0.25, 0.05)),
        "collar": ((0.20, 0.026, 0.018), (0.055, 0.006, 0.004)),
        "wood": ((0.34, 0.06, 0.012), (0.105, 0.012, 0.003)),
        "rug": ((0.86, 0.19, 0.025), (0.35, 0.018, 0.006)),
        "wall": ((0.74, 0.26, 0.055), (0.31, 0.03, 0.012)),
    }
    bright, dark = palette[kind]
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            wave = math.sin(x * 0.37 + y * 0.11) * 0.50 + math.sin(x * 0.071 - y * 0.19) * 0.25
            noise = (((x * 73 + y * 151 + (x // 9) * 31) % 251) / 250.0 - 0.5) * 0.24
            if kind in {"orange", "cream"}:
                strand = max(0.0, math.sin(x * 0.18 + y * 1.9)) ** 9 * 0.23
                amount = 0.46 + wave * 0.16 + noise + strand
            elif kind == "wood":
                amount = 0.44 + math.sin(y * 0.35 + math.sin(x * .08) * 3.0) * .28 + noise
            elif kind == "rug":
                amount = 0.45 + ((x // 7 + y // 7) % 2) * .18 + noise
            else:
                amount = 0.50 + wave * .22 + noise
            amount = max(0.0, min(1.0, amount))
            pixels.extend(tuple(dark[i] * (1.0 - amount) + bright[i] * amount for i in range(3)) + (1.0,))
    return pixels


def normal_pixels(size: int = 192) -> list[float]:
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            dx = math.sin(x * .42 + y * .08) * .12
            dy = math.cos(x * .08 - y * .51) * .12
            pixels.extend((0.5 + dx, 0.5 + dy, 1.0, 1.0))
    return pixels


def roughness_pixels(value: float, size: int = 192) -> list[float]:
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            variation = ((((x * 29 + y * 17) % 19) / 18.0) - .5) * .10
            tone = max(0.0, min(1.0, value + variation))
            pixels.extend((tone, tone, tone, 1.0))
    return pixels


def image(output: Path, name: str, pixels: list[float], size: int = 192, color: bool = True) -> bpy.types.Image:
    item = bpy.data.images.new(name, size, size, alpha=True)
    item.colorspace_settings.name = "sRGB" if color else "Non-Color"
    item.pixels = pixels
    item.filepath_raw = str(output / "textures" / f"{name}.png")
    item.file_format = "PNG"
    item.save()
    return item


def pbr_material(output: Path, kind: str, roughness: float, metallic: float = 0.0) -> bpy.types.Material:
    color = image(output, f"{kind}_albedo", texture_pixels(kind))
    normal = image(output, f"{kind}_normal", normal_pixels(), color=False)
    rough = image(output, f"{kind}_roughness", roughness_pixels(roughness), color=False)
    material = bpy.data.materials.new(f"MAT.{kind.title()}")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    for node in tuple(nodes):
        nodes.remove(node)
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = metallic
    albedo = nodes.new("ShaderNodeTexImage")
    albedo.image = color
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.image = normal
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = .28
    rough_tex = nodes.new("ShaderNodeTexImage")
    rough_tex.image = rough
    links.new(albedo.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(rough_tex.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(normal_tex.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return material


def solid(name: str, rgba: tuple[float, float, float, float], roughness: float, metallic: float = 0.0) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return material


def new_mesh(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]], material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    for polygon in data.polygons:
        polygon.use_smooth = True
    return obj


def ellipsoid(name: str, center: tuple[float, float, float], scale: tuple[float, float, float], material: bpy.types.Material, collection: bpy.types.Collection, segments: int = 28, rings: int = 18) -> bpy.types.Object:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    for ring in range(rings + 1):
        theta = math.pi * ring / rings
        for segment in range(segments):
            phi = 2 * math.pi * segment / segments
            vertices.append((center[0] + scale[0] * math.sin(theta) * math.cos(phi), center[1] + scale[1] * math.sin(theta) * math.sin(phi), center[2] + scale[2] * math.cos(theta)))
    for ring in range(rings):
        for segment in range(segments):
            nxt = (segment + 1) % segments
            a, b = ring * segments + segment, ring * segments + nxt
            c, d = (ring + 1) * segments + nxt, (ring + 1) * segments + segment
            faces.append((a, b, c, d))
    return new_mesh(name, vertices, faces, material, collection)


def organic_shell(collection: bpy.types.Collection, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    """Fuse anatomical volumes with a voxel remesh, producing one custom shell."""
    volumes = (
        ((0, .04, 1.04), (.76, .59, .84)),       # pear-shaped torso
        ((0, -.01, 2.34), (.91, .70, .82)),      # broad head
        ((0, -.01, 1.74), (.52, .48, .46)),      # neck connection
        ((-.54, .10, .54), (.47, .40, .52)), ((.54, .10, .54), (.47, .40, .52)),
        ((-.30, -.44, .68), (.25, .23, .64)), ((.30, -.44, .68), (.25, .23, .64)),
        ((-.30, -.51, .22), (.30, .25, .19)), ((.30, -.51, .22), (.30, .25, .19)),
        ((-.58, -.05, .22), (.34, .31, .20)), ((.58, -.05, .22), (.34, .31, .20)),
        ((.72, .17, .61), (.40, .31, .28)), ((1.02, .22, .78), (.31, .25, .33)),
        ((1.14, .18, 1.05), (.25, .22, .31)), ((1.02, .13, 1.28), (.21, .19, .25)),
        ((-.43, -.51, 2.10), (.38, .22, .27)), ((.43, -.51, 2.10), (.38, .22, .27)),
        ((0, -.68, 2.08), (.42, .18, .27)),
    )
    parts = [ellipsoid("R4_FuseVolume", location, scale, materials["orange"], collection, 24, 14) for location, scale in volumes]
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    shell = bpy.context.object
    shell.name = "Finni.FurShell"
    remesh = shell.modifiers.new("Sculpted_Continuous_Fur_Form", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = .052
    remesh.use_smooth_shade = True
    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    return shell


def tuft(name: str, base: tuple[float, float, float], direction: tuple[float, float, float], width: float, length: float, material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    start = Vector(base) - Vector(direction).normalized() * .06
    axis = Vector(direction).normalized()
    side = axis.cross(Vector((0, 0, 1)))
    if side.length < .02:
        side = axis.cross(Vector((0, 1, 0)))
    side.normalize()
    up = axis.cross(side).normalized()
    end = start + axis * length
    vertices = [tuple(start + side * width + up * width * .40), tuple(start - side * width + up * width * .40), tuple(start - side * width - up * width * .40), tuple(start + side * width - up * width * .40), tuple(end + up * width * .18), tuple(end - up * width * .18)]
    faces = [(0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4), (0, 3, 2, 1)]
    return new_mesh(name, vertices, faces, material, collection)


def ear(name: str, side: float, materials: dict[str, bpy.types.Material], collection: bpy.types.Collection) -> tuple[bpy.types.Object, bpy.types.Object]:
    base_x = .48 * side
    outline = [(base_x - side * .27, -.05, 2.69), (base_x - side * .16, -.01, 3.05), (base_x - side * .23, .02, 3.43), (base_x + side * .10, -.01, 3.17), (base_x + side * .22, -.05, 2.78)]
    front = [(x, y - .16, z) for x, y, z in outline]
    back = [(x, y + .10, z) for x, y, z in outline]
    faces = [tuple(range(5)), tuple(range(9, 4, -1))]
    for i in range(5):
        faces.append((i, (i + 1) % 5, (i + 1) % 5 + 5, i + 5))
    outer = new_mesh(name, front + back, faces, materials["orange"], collection)
    inner_outline = [(base_x - side * .15, -.215, 2.78), (base_x - side * .11, -.215, 3.06), (base_x - side * .18, -.20, 3.30), (base_x + side * .05, -.215, 3.10), (base_x + side * .12, -.215, 2.83)]
    inner = new_mesh(name.replace("Ear", "EarInner"), inner_outline, [tuple(range(5))], materials["ear"], collection)
    return outer, inner


def join_geometry(parts: list[bpy.types.Object], target: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.join()
    target.name = "Finni.FurShell"
    return target


def make_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.armatures.new("FinniR4Rig")
    armature = bpy.data.objects.new("FinniR4Rig", data)
    collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    definitions = (
        ("Joint.Root", (0, 0, 0.12), (0, 0, .78), None),
        ("Joint.Spine", (0, 0, .72), (0, 0, 1.65), "Joint.Root"),
        ("Joint.Neck", (0, 0, 1.55), (0, 0, 1.96), "Joint.Spine"),
        ("Joint.Head", (0, -.01, 1.92), (0, -.01, 2.65), "Joint.Neck"),
        ("Joint.Ear.L", (-.46, -.02, 2.67), (-.67, -.02, 3.35), "Joint.Head"),
        ("Joint.Ear.R", (.46, -.02, 2.67), (.67, -.02, 3.35), "Joint.Head"),
        ("Joint.Eye.L", (-.40, -.60, 2.48), (-.40, -.83, 2.48), "Joint.Head"),
        ("Joint.Eye.R", (.40, -.60, 2.48), (.40, -.83, 2.48), "Joint.Head"),
        ("Joint.Lid.L", (-.40, -.76, 2.57), (-.40, -.91, 2.57), "Joint.Head"),
        ("Joint.Lid.R", (.40, -.76, 2.57), (.40, -.91, 2.57), "Joint.Head"),
        ("Joint.Paw.L", (-.30, -.44, 1.16), (-.30, -.54, .23), "Joint.Spine"),
        ("Joint.Paw.R", (.30, -.44, 1.16), (.30, -.54, .23), "Joint.Spine"),
        ("Joint.Tail.Base", (.55, .15, .73), (1.02, .18, .82), "Joint.Root"),
        ("Joint.Tail.Mid", (1.02, .18, .82), (1.20, .16, 1.20), "Joint.Tail.Base"),
        ("Joint.Tail.Tip", (1.20, .16, 1.20), (.96, .12, 1.48), "Joint.Tail.Mid"),
    )
    built: dict[str, bpy.types.EditBone] = {}
    for name, head, tail, parent in definitions:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent:
            bone.parent = built[parent]
        built[name] = bone
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.show_in_front = True
    armature.select_set(False)
    return armature


def attach_rigid(obj: bpy.types.Object, armature: bpy.types.Object, bone: str) -> None:
    group = obj.vertex_groups.new(name=bone)
    group.add(range(len(obj.data.vertices)), 1.0, "REPLACE")
    modifier = obj.modifiers.new("FinniRig", "ARMATURE")
    modifier.object = armature


def skin_shell(shell: bpy.types.Object, armature: bpy.types.Object) -> None:
    groups = {name: shell.vertex_groups.new(name=name) for name in JOINTS}
    for vertex in shell.data.vertices:
        co = vertex.co
        if co.x > .75:
            name = "Joint.Tail.Tip" if co.z > 1.12 else "Joint.Tail.Mid" if co.x > 1.02 else "Joint.Tail.Base"
        elif co.z > 2.70:
            name = "Joint.Ear.L" if co.x < 0 else "Joint.Ear.R"
        elif co.z > 1.80:
            name = "Joint.Head"
        elif co.y < -.33 and co.z < 1.35:
            name = "Joint.Paw.L" if co.x < 0 else "Joint.Paw.R"
        elif co.z < .68:
            name = "Joint.Root"
        else:
            name = "Joint.Spine"
        groups[name].add([vertex.index], 1.0, "REPLACE")
    modifier = shell.modifiers.new("FinniRig", "ARMATURE")
    modifier.object = armature


def build_character(collection: bpy.types.Collection, armature: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> list[bpy.types.Object]:
    shell = organic_shell(collection, materials)
    joins: list[bpy.types.Object] = []
    for side, label in ((-1.0, "L"), (1.0, "R")):
        outside, inside = ear(f"Finni.Ear.{label}", side, materials, collection)
        joins.append(outside)
        attach_rigid(inside, armature, f"Joint.Ear.{label}")
    # Individual low-relief fur wedges are joined into the same shell, avoiding the R3 bead silhouette.
    tuft_specs: list[tuple[tuple[float, float, float], tuple[float, float, float], float, float, bpy.types.Material]] = []
    for side in (-1.0, 1.0):
        for index in range(10):
            angle = math.radians(112 + index * 15)
            point = (side * (.73 + .05 * math.sin(index)), -.05 + .14 * math.cos(angle), 2.36 + .62 * math.sin(angle))
            direction = (side * .65, -.12, math.sin(angle) * .45)
            tuft_specs.append((point, direction, .065, .18 + .025 * (index % 3), materials["orange"]))
        for z in (.72, .98, 1.25):
            tuft_specs.append(((side * .72, -.05, z), (side * .8, -.05, .12), .07, .19, materials["orange"]))
    for side in (-1.0, 1.0):
        for index in range(5):
            tuft_specs.append(((side * (.19 + index * .08), -.70, 1.70 - abs(index - 2) * .10), (side * .18, -.65, -.15), .05, .15, materials["cream"]))
    for point, direction, width, length, material in tuft_specs:
        joins.append(tuft("Finni.FurTuft", point, direction, width, length, material, collection))
    shell = join_geometry(joins, shell)
    skin_shell(shell, armature)

    details: list[tuple[bpy.types.Object, str]] = []
    # Warm, slightly green-hazel layered eyes and separate lids permit a real blink.
    for side, label in ((-1.0, "L"), (1.0, "R")):
        eye = ellipsoid(f"Finni.Eye.{label}", (side * .40, -.67, 2.48), (.225, .095, .285), materials["eye_white"], collection, 30, 18)
        iris = ellipsoid(f"Finni.Iris.{label}", (side * .40, -.758, 2.47), (.142, .026, .180), materials["iris"], collection, 28, 16)
        pupil = ellipsoid(f"Finni.Pupil.{label}", (side * .40, -.786, 2.47), (.057, .014, .128), materials["pupil"], collection, 22, 14)
        glint = ellipsoid(f"Finni.Glint.{label}", (side * .355, -.806, 2.56), (.040, .010, .055), materials["glint"], collection, 18, 12)
        lid = ellipsoid(f"Finni.Lid.{label}", (side * .40, -.772, 2.64), (.245, .040, .095), materials["orange"], collection, 30, 12)
        details.extend(((eye, f"Joint.Eye.{label}"), (iris, f"Joint.Eye.{label}"), (pupil, f"Joint.Eye.{label}"), (glint, f"Joint.Eye.{label}"), (lid, f"Joint.Lid.{label}")))
    nose = ellipsoid("Finni.Nose", (0, -.865, 2.18), (.115, .045, .075), materials["nose"], collection, 24, 14)
    mouth = ellipsoid("Finni.Mouth", (0, -.855, 2.025), (.145, .029, .070), materials["mouth"], collection, 24, 14)
    tongue = ellipsoid("Finni.Tongue", (0, -.882, 1.995), (.082, .018, .034), materials["tongue"], collection, 22, 12)
    details.extend(((nose, "Joint.Head"), (mouth, "Joint.Head"), (tongue, "Joint.Head")))
    # collar band and medallion are custom meshes, not a replacement rig joint.
    collar = ellipsoid("Finni.Collar", (0, -.02, 1.70), (.56, .49, .105), materials["collar"], collection, 40, 12)
    collar.scale.z = .42
    medallion = ellipsoid("Finni.Medallion", (0, -.565, 1.53), (.135, .035, .150), materials["gold"], collection, 30, 18)
    details.extend(((collar, "Joint.Neck"), (medallion, "Joint.Spine")))
    for item, bone in details:
        attach_rigid(item, armature, bone)
    return [shell] + [item for item, _ in details]


def cube(name: str, location: tuple[float, float, float], scale: tuple[float, float, float], material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    for old in tuple(obj.users_collection):
        if old != collection:
            old.objects.unlink(obj)
    bevel = obj.modifiers.new("SoftEdges", "BEVEL")
    bevel.width, bevel.segments = .06, 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def build_room(collection: bpy.types.Collection, materials: dict[str, bpy.types.Material]) -> None:
    cube("Room.Floor", (0, .75, -.10), (4.3, 4.3, .10), materials["wood"], collection)
    cube("Room.BackWall", (0, 2.22, 2.25), (4.3, .10, 2.25), materials["wall"], collection)
    rug = ellipsoid("Room.Rug", (0, -.04, .015), (2.10, 1.45, .045), materials["rug"], collection, 48, 12)
    rug["roomFragment"] = True
    chest = cube("Chest", (2.18, .12, .43), (.59, .42, .35), materials["wood"], collection)
    cube("Chest.Lid", (2.18, .12, .79), (.61, .44, .10), materials["orange"], collection)
    cube("Chest.Band", (2.18, -.315, .45), (.055, .025, .37), materials["gold"], collection)
    paw = ellipsoid("Chest.Paw", (2.18, -.352, .54), (.13, .018, .105), materials["gold"], collection, 20, 12)
    chest["isIndependentProp"] = True
    chest["animationTargetForbidden"] = True
    for index, x in enumerate((2.02, 2.13, 2.24, 2.35), 1):
        ellipsoid(f"Chest.PawToe.{index}", (x, -.352, .67), (.042, .014, .044), materials["gold"], collection, 16, 10)


def reset_pose(armature: bpy.types.Object) -> None:
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)


def key_pose(armature: bpy.types.Object, action: bpy.types.Action, frame: int, rotation: dict[str, tuple[float, float, float]], scales: dict[str, tuple[float, float, float]] | None = None) -> None:
    armature.animation_data.action = action
    reset_pose(armature)
    root = armature.pose.bones["Joint.Root"]
    root.location = (0, 0, 0)
    root.keyframe_insert(data_path="location", frame=frame)
    for name, degrees in rotation.items():
        bone = armature.pose.bones[name]
        bone.rotation_euler = tuple(math.radians(v) for v in degrees)
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    for name, scale in (scales or {}).items():
        bone = armature.pose.bones[name]
        bone.scale = scale
        bone.keyframe_insert(data_path="scale", frame=frame)


def set_bezier(action: bpy.types.Action) -> None:
    pools = [getattr(action, "fcurves", ())]
    for layer in getattr(action, "layers", ()):
        for strip in getattr(layer, "strips", ()):
            for bag in getattr(strip, "channelbags", ()):
                pools.append(getattr(bag, "fcurves", ()))
    for curves in pools:
        for curve in curves:
            for point in curve.keyframe_points:
                point.interpolation = "BEZIER"


def make_actions(armature: bpy.types.Object) -> dict[str, bpy.types.Action]:
    poses = {
        "idle": ((1, {"Joint.Spine": (0, 0, -1), "Joint.Tail.Base": (0, 0, -5), "Joint.Tail.Mid": (0, 0, 7)}), (75, {"Joint.Spine": (0, 0, 1), "Joint.Head": (0, 0, 1.4), "Joint.Tail.Base": (0, 0, 5), "Joint.Tail.Mid": (0, 0, -6)}), (150, {"Joint.Spine": (0, 0, -1), "Joint.Tail.Base": (0, 0, -5), "Joint.Tail.Mid": (0, 0, 7)})),
        "blink": ((1, {}), (18, {"Joint.Lid.L": (18, 0, 0), "Joint.Lid.R": (18, 0, 0)}), (24, {"Joint.Lid.L": (32, 0, 0), "Joint.Lid.R": (32, 0, 0)}), (42, {})),
        "joy": ((1, {}), (33, {"Joint.Paw.L": (-38, 0, -8), "Joint.Paw.R": (-38, 0, 8), "Joint.Head": (0, 0, -5), "Joint.Ear.L": (0, 8, -10), "Joint.Ear.R": (0, -8, 10), "Joint.Tail.Base": (0, 0, 14)}), (66, {})),
        "curiosity": ((1, {}), (30, {"Joint.Head": (0, 14, 8), "Joint.Ear.L": (0, 0, -12), "Joint.Ear.R": (0, 0, 10), "Joint.Paw.R": (-26, 0, 8), "Joint.Tail.Mid": (0, 0, -10)}), (60, {})),
    }
    output: dict[str, bpy.types.Action] = {}
    armature.animation_data_create()
    for name, keys in poses.items():
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        for frame, rotation in keys:
            key_pose(armature, action, frame, rotation)
        action.frame_range = (1, CLIPS[name])
        set_bezier(action)
        output[name] = action
    armature.animation_data.action = output["idle"]
    reset_pose(armature)
    return output


def camera_lights(scene: bpy.types.Scene, collection: bpy.types.Collection) -> None:
    data = bpy.data.cameras.new("Camera.Portrait")
    camera = bpy.data.objects.new("Camera.Portrait", data)
    collection.objects.link(camera)
    camera.location = (0.0, -10.6, 2.03)
    data.lens = 57
    look_at(camera, (0.0, -.03, 1.63))
    scene.camera = camera
    for name, point, energy, size, color in (
        ("Light.Key", (-3.7, -4.8, 5.6), 1150, 4.2, (1.0, .66, .40)),
        ("Light.Fill", (3.4, -3.2, 4.2), 740, 3.0, (1.0, .87, .69)),
        ("Light.Rim", (-1.2, 2.0, 5.3), 1050, 3.2, (1.0, .45, .18)),
    ):
        lamp_data = bpy.data.lights.new(name, "AREA")
        lamp_data.energy, lamp_data.shape, lamp_data.size, lamp_data.color = energy, "DISK", size, color
        lamp = bpy.data.objects.new(name, lamp_data)
        collection.objects.link(lamp)
        lamp.location = point
        look_at(lamp, (0, 0, 1.55))


def configure_scene(scene: bpy.types.Scene) -> None:
    configure_eevee(scene)
    world(scene, "World.FinniR4")
    scene.render.resolution_x, scene.render.resolution_y = PORTRAIT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.fps = FPS
    try:
        scene.render.image_settings.color_mode = "RGBA"
    except AttributeError:
        pass


def render_stills(scene: bpy.types.Scene, armature: bpy.types.Object, actions: dict[str, bpy.types.Action], output: Path) -> dict[str, str]:
    plan = {"neutral": ("idle", 1), "idle_extreme": ("idle", 75), "blink_extreme": ("blink", 24), "joy_extreme": ("joy", 33), "curiosity_extreme": ("curiosity", 30)}
    paths: dict[str, str] = {}
    for label, (action, frame) in plan.items():
        armature.animation_data.action = actions[action]
        scene.frame_set(frame)
        target = output / "renders" / f"{label}.png"
        scene.render.filepath = str(target)
        bpy.ops.render.render(write_still=True)
        paths[label] = str(target.relative_to(output).as_posix())
    return paths


def glb_document(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total != len(data):
        raise RuntimeError("invalid GLB header")
    length, kind = struct.unpack_from("<I4s", data, 12)
    if kind != b"JSON":
        raise RuntimeError("GLB JSON chunk missing")
    return json.loads(data[20:20 + length].decode("utf-8").rstrip(" \t\r\n\0"))


def glb_metrics(path: Path) -> dict[str, object]:
    doc = glb_document(path)
    meshes = doc.get("meshes", [])
    triangles = 0
    primitives = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            primitives += 1
            accessor = doc["accessors"][primitive["indices"]] if "indices" in primitive else doc["accessors"][primitive["attributes"]["POSITION"]]
            triangles += int(accessor.get("count", 0)) // 3
    names = [item.get("name") for item in doc.get("nodes", [])]
    joint_ids = doc.get("skins", [{}])[0].get("joints", [])
    joint_names = [doc["nodes"][index].get("name") for index in joint_ids]
    animations = [item.get("name") for item in doc.get("animations", [])]
    if len(doc.get("skins", [])) != 1 or tuple(joint_names) != JOINTS:
        raise RuntimeError(f"skin contract mismatch: {joint_names}")
    if set(animations) != set(CLIPS) or len(animations) != 4:
        raise RuntimeError(f"action contract mismatch: {animations}")
    if "Chest" not in names or "Chest" in joint_names:
        raise RuntimeError("Chest is not an independent non-joint node")
    if triangles > TRIANGLE_LIMIT:
        raise RuntimeError(f"triangle budget exceeded: {triangles} > {TRIANGLE_LIMIT}")
    return {"bytes": path.stat().st_size, "meshes": len(meshes), "primitives": primitives, "triangles": triangles, "materials": len(doc.get("materials", [])), "embeddedImages": len(doc.get("images", [])), "nodes": len(names), "skins": len(doc.get("skins", [])), "joints": len(joint_names), "animations": sorted(animations), "chestSeparate": True}


def root_locked(actions: dict[str, bpy.types.Action]) -> bool:
    for action in actions.values():
        curves = list(getattr(action, "fcurves", ()))
        if not curves:
            for layer in getattr(action, "layers", ()):
                for strip in getattr(layer, "strips", ()):
                    for bag in getattr(strip, "channelbags", ()):
                        curves.extend(getattr(bag, "fcurves", ()))
        root_curves = [curve for curve in curves if 'pose.bones["Joint.Root"].location' in curve.data_path]
        if not root_curves or any(abs(point.co.y) > 1e-8 for curve in root_curves for point in curve.keyframe_points):
            return False
    return True


def records(output: Path) -> list[dict[str, object]]:
    ignored = {"slice-manifest.json", "SHA256SUMS.txt"}
    result = []
    for path in sorted((p for p in output.rglob("*") if p.is_file() and p.name not in ignored), key=lambda p: p.relative_to(output).as_posix().lower()):
        result.append({"path": path.relative_to(output).as_posix(), "sha256": sha256(path), "bytes": path.stat().st_size})
    return result


def write_docs(output: Path, reference: Path, metrics: dict[str, object], rendered: dict[str, str], root_is_locked: bool) -> None:
    manifest = {
        "package": "Finni_S7-002_R4", "status": "candidate_not_art_pass_or_production", "blender": bpy.app.version_string,
        "reference": {"path": str(reference), "sha256": sha256(reference), "bundled": False, "role": "mandatory_REF-001_review_only"},
        "geometry": {"method": "new R4 fused voxel-remeshed organic shell plus joined custom fur wedges; no R3 character geometry imported", "target": "cohesive seated fluffy kitten/fox character"},
        "rig": {"jointNames": list(JOINTS), "jointCount": 15, "separateChest": True, "rootTranslationLocked": root_is_locked},
        "actions": [{"name": name, "frames": frames, "seconds": frames / FPS, "rootLocked": root_is_locked} for name, frames in CLIPS.items()],
        "glb": {"path": "Finni_R4.glb", "sha256": sha256(output / "Finni_R4.glb"), **metrics},
        "renders": {"camera": list(PORTRAIT), "stills": list(rendered.values())},
        "budgets": {"displayedTriangles": metrics["triangles"], "limit": TRIANGLE_LIMIT, "status": "PASS" if metrics["triangles"] <= TRIANGLE_LIMIT else "FAIL"},
        "artAcceptance": "NOT GRANTED — technical evidence only; owner review, device runtime and provenance/release decision remain open.",
        "files": records(output),
    }
    (output / "slice-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "SHA256SUMS.txt").write_text("\n".join(f"{item['sha256']}  {item['path']}" for item in records(output)) + "\n", encoding="utf-8")
    (output / "README.md").write_text("""# Finni S7-002 R4 candidate

R4 is a new Blender 5.2 character build, not a re-export or geometry reuse of R3.
It preserves the 15-joint and four-action diagnostic contract while replacing the
visible character with a fused sculpted fur shell, custom facial meshes, ears,
four paws, haunches, side tail, collar and medallion.

Build from the repository root:

```powershell
& 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe' --background --python 'docs\\Finni_S7-002_R4\\source\\build_finni_r4.py' -- --output 'docs\\Finni_S7-002_R4' --reference 'docs\\Finni_3D_Addendum_v1.0\\reference\\finni-home-approved.png'
```

The build replaces its own R4 generated artifacts. It does not read R3 meshes,
does not copy REF-001 and must not be interpreted as art, identity, device or
production acceptance.
""", encoding="utf-8")
    (output / "VERIFY.md").write_text(f"""# Finni S7-002 R4 verification

## Build evidence

- Blender: {bpy.app.version_string}
- Source: `source/build_finni_r4.py`
- Editable scene: `Finni_R4.blend`; self-contained export: `Finni_R4.glb`.
- GLB SHA-256: `{sha256(output / 'Finni_R4.glb')}`.
- Five actual Eevee stills: neutral plus idle, blink, joy and curiosity extremes.

## Static contract checked by the build

- exactly one skin and 15 ordered `Joint.*` joints;
- actions exactly `idle`, `blink`, `joy`, `curiosity`;
- `Chest` is an independent GLB node, never a skin joint;
- authored `Joint.Root` translation keys are all zero: **{root_is_locked}**;
- displayed GLB triangles: **{metrics['triangles']:,} / {TRIANGLE_LIMIT:,}**;
- GLB size: **{metrics['bytes']:,} bytes**; materials: {metrics['materials']}; embedded images: {metrics['embeddedImages']}.

## Honest limitations

This is non-device technical/art-review evidence, not an art PASS. REF-001 remains
the mandatory reference. Owner acceptance, quantitative identity review, Android
runtime/performance, application integration and licensing/release decisions are
still open. A Khronos validator result is recorded only when the separate validator
command has actually been run; this build does not fabricate one.
""", encoding="utf-8")


def main() -> None:
    args = parse_args()
    output, reference = safe_output(args.output), Path(args.reference).resolve()
    if not reference.is_file():
        raise RuntimeError(f"REF-001 unavailable: {reference}")
    for folder in ("textures", "renders"):
        (output / folder).mkdir(exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "FinniR4Portrait"
    configure_scene(scene)
    export = bpy.data.collections.new("ExportScene")
    room = bpy.data.collections.new("RoomFragment")
    scene.collection.children.link(export)
    scene.collection.children.link(room)
    materials = {kind: pbr_material(output, kind, roughness) for kind, roughness in (("orange", .72), ("cream", .78), ("collar", .38), ("wood", .66), ("rug", .86), ("wall", .82))}
    materials.update({"eye_white": solid("MAT.EyeWhite", (.97, .78, .36, 1), .22), "iris": solid("MAT.HazelIris", (.16, .42, .22, 1), .18), "pupil": solid("MAT.Pupil", (.008, .004, .002, 1), .12), "glint": solid("MAT.Glint", (1, 1, .92, 1), .08), "nose": solid("MAT.Nose", (.34, .045, .035, 1), .38), "mouth": solid("MAT.Mouth", (.12, .008, .005, 1), .50), "tongue": solid("MAT.Tongue", (.95, .20, .24, 1), .58), "ear": solid("MAT.EarInner", (.78, .13, .11, 1), .70), "gold": solid("MAT.MedallionGold", (1.0, .48, .045, 1), .28, .72)})
    armature = make_armature(export)
    build_character(export, armature, materials)
    build_room(room, materials)
    camera_lights(scene, export)
    actions = make_actions(armature)
    rendered = render_stills(scene, armature, actions, output)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in export.all_objects:
        if obj.type not in {"CAMERA", "LIGHT"}:
            obj.select_set(True)
    for obj in room.all_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    glb = output / "Finni_R4.glb"
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_yup=True, export_animations=True, export_animation_mode="ACTIONS", export_nla_strips=False, export_image_format="AUTO")
    metrics = glb_metrics(glb)
    locked = root_locked(actions)
    if not locked:
        raise RuntimeError("Root lock validation failed")
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "Finni_R4.blend"))
    write_docs(output, reference, metrics, rendered, locked)
    print(json.dumps({"output": str(output), "glb": sha256(glb), "metrics": metrics, "rootLocked": locked}, ensure_ascii=False))


if __name__ == "__main__":
    main()
