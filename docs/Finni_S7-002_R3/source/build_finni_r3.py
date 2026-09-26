"""Build the isolated Blender R3 Finni candidate.

This script writes only below --output. It reads REF-001 for the acceptance
sheet but never copies, embeds or changes the approved reference. R3 remains a
candidate: the built-in measurement record deliberately reports visual gates as
NOT MEASURED until an owner performs the agreed review.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector


FPS = 30
PORTRAIT = (941, 1672)
R2_HASH = "d5e4ed776b32c04a06eed27eeffaf53746ab06cff19fa76cf00da69d6e20ca83"
R1_REJECTED_HASH = "26011d81398eb8f9a16a39400e0244c933564cb3c2b21907982cf84f2c0a219b"
JOINTS = (
    "Joint.Root", "Joint.Spine", "Joint.Neck", "Joint.Head",
    "Joint.Ear.L", "Joint.Ear.R", "Joint.Eye.L", "Joint.Eye.R",
    "Joint.Lid.L", "Joint.Lid.R", "Joint.Paw.L", "Joint.Paw.R",
    "Joint.Tail.Base", "Joint.Tail.Mid", "Joint.Tail.Tip",
)
CLIPS = {
    "idle": 72,
    "blink": 36,
    "joy": 48,
    "curiosity": 54,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="New or existing safe output directory")
    parser.add_argument("--reference", required=True, help="Read-only actual REF-001 PNG")
    parser.add_argument("--reuse-evidence", action="store_true", help="Reuse already-rendered evidence after a post-render failure")
    parser.add_argument("--reuse-stills", action="store_true", help="Reuse completed stills but rerender every animation preview")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def safe_output(value: str) -> Path:
    output = Path(value).resolve()
    if output == Path(output.anchor) or len(output.parts) < 3:
        raise RuntimeError("Refusing filesystem-root output directory")
    output.mkdir(parents=True, exist_ok=True)
    return output


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for previous in tuple(obj.users_collection):
        previous.objects.unlink(obj)
    collection.objects.link(obj)


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def configure_eevee(scene: bpy.types.Scene) -> None:
    """Select the Eevee identifier supported by the running Blender build."""
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            return
        except (TypeError, ValueError):
            continue
    supported = tuple(
        item.identifier
        for item in scene.render.bl_rna.properties["engine"].enum_items
    )
    raise RuntimeError(f"Eevee render engine is unavailable; supported engines: {supported}")


def ensure_world(scene: bpy.types.Scene, name: str) -> bpy.types.World:
    """Factory-empty and newly-created scenes are not guaranteed to own a World."""
    if scene.world is None:
        scene.world = bpy.data.worlds.new(name)
    return scene.world


def make_texture(output: Path, name: str, base: tuple[float, float, float], accent: tuple[float, float, float]) -> bpy.types.Image:
    image = bpy.data.images.new(name, width=64, height=64, alpha=True)
    pixels: list[float] = []
    for y in range(64):
        for x in range(64):
            pattern = ((x * 37 + y * 17 + (x // 7) * 11) % 23) / 22.0
            mix = 0.08 * pattern
            pixels.extend((
                min(1.0, base[0] * (1 - mix) + accent[0] * mix),
                min(1.0, base[1] * (1 - mix) + accent[1] * mix),
                min(1.0, base[2] * (1 - mix) + accent[2] * mix),
                1.0,
            ))
    image.pixels = pixels
    image.filepath_raw = str(output / "textures" / f"{name}.png")
    image.file_format = "PNG"
    image.save()
    return image


def make_material(name: str, image: bpy.types.Image, roughness: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for node in tuple(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    shader.inputs["Roughness"].default_value = roughness
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def solid_material(name: str, color: tuple[float, float, float, float], roughness: float = 0.8) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = roughness
    return material


def add_armature(collection: bpy.types.Collection) -> bpy.types.Object:
    armature_data = bpy.data.armatures.new("FinniR3Rig")
    armature = bpy.data.objects.new("FinniR3Rig", armature_data)
    collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    definitions = (
        ("Joint.Root", (0, 0, 0.15), (0, 0, 0.8), None),
        ("Joint.Spine", (0, 0, 0.75), (0, 0, 1.65), "Joint.Root"),
        ("Joint.Neck", (0, 0, 1.55), (0, 0, 1.95), "Joint.Spine"),
        ("Joint.Head", (0, 0, 1.9), (0, 0, 2.6), "Joint.Neck"),
        ("Joint.Ear.L", (-0.42, 0, 2.65), (-0.58, 0, 3.18), "Joint.Head"),
        ("Joint.Ear.R", (0.42, 0, 2.65), (0.58, 0, 3.18), "Joint.Head"),
        ("Joint.Eye.L", (-0.39, -0.55, 2.38), (-0.39, -0.78, 2.38), "Joint.Head"),
        ("Joint.Eye.R", (0.39, -0.55, 2.38), (0.39, -0.78, 2.38), "Joint.Head"),
        ("Joint.Lid.L", (-0.39, -0.75, 2.48), (-0.39, -0.92, 2.48), "Joint.Head"),
        ("Joint.Lid.R", (0.39, -0.75, 2.48), (0.39, -0.92, 2.48), "Joint.Head"),
        ("Joint.Paw.L", (-0.36, -0.24, 1.32), (-0.42, -0.52, 0.58), "Joint.Spine"),
        ("Joint.Paw.R", (0.36, -0.24, 1.32), (0.42, -0.52, 0.58), "Joint.Spine"),
        ("Joint.Tail.Base", (0.52, 0.14, 0.82), (1.08, 0.18, 0.98), "Joint.Root"),
        ("Joint.Tail.Mid", (1.08, 0.18, 0.98), (1.32, 0.1, 1.48), "Joint.Tail.Base"),
        ("Joint.Tail.Tip", (1.32, 0.1, 1.48), (0.98, -0.05, 1.76), "Joint.Tail.Mid"),
    )
    created: dict[str, bpy.types.EditBone] = {}
    for name, head, tail, parent in definitions:
        bone = armature_data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.use_deform = True
        if parent:
            bone.parent = created[parent]
            bone.use_connect = False
        created[name] = bone
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.show_in_front = True
    return armature


def skin(obj: bpy.types.Object, armature: bpy.types.Object, bone: str) -> bpy.types.Object:
    group = obj.vertex_groups.new(name=bone)
    group.add(range(len(obj.data.vertices)), 1.0, "REPLACE")
    modifier = obj.modifiers.new("Armature", "ARMATURE")
    modifier.object = armature
    return obj


def finish_mesh(obj: bpy.types.Object, collection: bpy.types.Collection, material: bpy.types.Material, armature: bpy.types.Object | None = None, bone: str | None = None) -> bpy.types.Object:
    move_to_collection(obj, collection)
    if material:
        obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if armature and bone:
        skin(obj, armature, bone)
    obj.select_set(False)
    return obj


def sphere(name: str, location: tuple[float, float, float], scale: tuple[float, float, float], collection: bpy.types.Collection, material: bpy.types.Material, armature: bpy.types.Object | None = None, bone: str | None = None) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return finish_mesh(obj, collection, material, armature, bone)


def cone(name: str, location: tuple[float, float, float], radius: float, depth: float, collection: bpy.types.Collection, material: bpy.types.Material, armature: bpy.types.Object, bone: str) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=radius, radius2=0.035, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return finish_mesh(obj, collection, material, armature, bone)


def torus(name: str, location: tuple[float, float, float], major_radius: float, minor_radius: float, collection: bpy.types.Collection, material: bpy.types.Material, armature: bpy.types.Object, bone: str) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=8, major_radius=major_radius, minor_radius=minor_radius, location=location)
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return finish_mesh(obj, collection, material, armature, bone)


def cube(name: str, location: tuple[float, float, float], scale: tuple[float, float, float], collection: bpy.types.Collection, material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish_mesh(obj, collection, material)


def build_character(collection: bpy.types.Collection, armature: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    orange, cream, dark, pink = (materials[key] for key in ("orange", "cream", "dark", "pink"))
    # Compact pear body (width 76% of the rounded head), sitting rather than bipedal.
    objects.append(sphere("Finni.Body", (0, 0.08, 0.96), (0.68, 0.57, 0.70), collection, orange, armature, "Joint.Spine"))
    objects.append(sphere("Finni.Belly", (0, -0.50, 0.91), (0.42, 0.10, 0.46), collection, cream, armature, "Joint.Spine"))
    # Rounded head: width 1.68, height 1.52, with moderate 0.48 ears.
    objects.append(sphere("Finni.Head", (0, -0.03, 2.38), (0.84, 0.70, 0.76), collection, orange, armature, "Joint.Head"))
    objects.append(cone("Finni.Ear.L", (-0.49, 0.0, 3.10), 0.27, 0.50, collection, orange, armature, "Joint.Ear.L"))
    objects.append(cone("Finni.Ear.R", (0.49, 0.0, 3.10), 0.27, 0.50, collection, orange, armature, "Joint.Ear.R"))
    objects.append(sphere("Finni.EarInner.L", (-0.49, -0.18, 3.07), (0.12, 0.04, 0.22), collection, pink, armature, "Joint.Ear.L"))
    objects.append(sphere("Finni.EarInner.R", (0.49, -0.18, 3.07), (0.12, 0.04, 0.22), collection, pink, armature, "Joint.Ear.R"))
    # Each eye is 20% of head width; lids, not eyeballs, animate the blink action.
    for side, x in (("L", -0.39), ("R", 0.39)):
        objects.append(sphere(f"Finni.Eye.{side}", (x, -0.66, 2.42), (0.17, 0.09, 0.23), collection, dark, armature, f"Joint.Eye.{side}"))
        objects.append(sphere(f"Finni.Highlight.{side}", (x - 0.035, -0.745, 2.49), (0.045, 0.018, 0.065), collection, cream, armature, f"Joint.Eye.{side}"))
        objects.append(sphere(f"Finni.Lid.{side}", (x, -0.745, 2.58), (0.19, 0.035, 0.075), collection, orange, armature, f"Joint.Lid.{side}"))
    # A wide, shallow cream muzzle prevents a fox-like long snout.
    objects.append(sphere("Finni.Muzzle", (0, -0.72, 2.12), (0.37, 0.095, 0.26), collection, cream, armature, "Joint.Head"))
    objects.append(sphere("Finni.Cheek.L", (-0.30, -0.685, 2.14), (0.22, 0.075, 0.19), collection, cream, armature, "Joint.Head"))
    objects.append(sphere("Finni.Cheek.R", (0.30, -0.685, 2.14), (0.22, 0.075, 0.19), collection, cream, armature, "Joint.Head"))
    objects.append(sphere("Finni.Nose", (0, -0.815, 2.21), (0.09, 0.04, 0.055), collection, pink, armature, "Joint.Head"))
    objects.append(sphere("Finni.Mouth", (0, -0.812, 2.01), (0.105, 0.038, 0.075), collection, dark, armature, "Joint.Head"))
    objects.append(sphere("Finni.Tongue", (0, -0.850, 1.985), (0.055, 0.018, 0.035), collection, pink, armature, "Joint.Head"))
    objects.append(torus("Finni.Collar", (0, -0.01, 1.66), 0.48, 0.045, collection, dark, armature, "Joint.Neck"))
    objects.append(sphere("Finni.Medallion", (0, -0.57, 1.55), (0.11, 0.035, 0.11), collection, materials["gold"], armature, "Joint.Spine"))
    for suffix, x, z, scale in (
        ("L", -0.16, 1.35, (0.17, 0.075, 0.16)),
        ("C", 0.0, 1.39, (0.18, 0.078, 0.19)),
        ("R", 0.16, 1.35, (0.17, 0.075, 0.16)),
    ):
        objects.append(sphere(f"Finni.ChestTuft.{suffix}", (x, -0.515, z), scale, collection, cream, armature, "Joint.Spine"))
    # Seated front paws: width 0.32 (19% of head width), never long limbs.
    objects.append(sphere("Finni.Paw.L", (-0.23, -0.51, 0.24), (0.17, 0.24, 0.17), collection, cream, armature, "Joint.Paw.L"))
    objects.append(sphere("Finni.Paw.R", (0.23, -0.51, 0.24), (0.17, 0.24, 0.17), collection, cream, armature, "Joint.Paw.R"))
    objects.append(sphere("Finni.Haunch.L", (-0.52, 0.02, 0.48), (0.38, 0.35, 0.48), collection, orange, armature, "Joint.Root"))
    objects.append(sphere("Finni.Haunch.R", (0.52, 0.02, 0.48), (0.38, 0.35, 0.48), collection, orange, armature, "Joint.Root"))
    # Large side-wrapped feline tail, deliberately not an upright plume.
    objects.append(sphere("Finni.Tail.Base", (0.72, 0.18, 0.58), (0.38, 0.30, 0.28), collection, orange, armature, "Joint.Tail.Base"))
    objects.append(sphere("Finni.Tail.Mid", (1.07, 0.16, 0.86), (0.30, 0.25, 0.38), collection, orange, armature, "Joint.Tail.Mid"))
    objects.append(sphere("Finni.Tail.Tip", (1.00, 0.03, 1.20), (0.25, 0.21, 0.30), collection, cream, armature, "Joint.Tail.Tip"))
    return objects


def build_room(collection: bpy.types.Collection, materials: dict[str, bpy.types.Material]) -> None:
    floor = cube("Room.Floor", (0, 0.7, -0.08), (4.4, 4.4, 0.08), collection, materials["wood"])
    back_wall = cube("Room.BackWall", (0, 2.1, 2.1), (4.4, 0.08, 2.2), collection, materials["wall"])
    side_wall = cube("Room.SideWall", (3.6, 0.4, 2.1), (0.08, 2.0, 2.2), collection, materials["wall"])
    rug = cube("Room.Rug", (0, -0.1, 0.015), (1.85, 1.30, 0.025), collection, materials["rug"])
    shelf = cube("Room.Shelf", (-2.55, 1.52, 1.1), (0.46, 0.18, 1.1), collection, materials["wood"])
    for z in (0.65, 1.12, 1.59):
        cube(f"Room.ShelfBoard.{z}", (-2.55, 1.30, z), (0.48, 0.05, 0.045), collection, materials["cream"])
    cube("Room.Picture", (1.95, 2.0, 2.55), (0.50, 0.045, 0.40), collection, materials["cream"])
    # Chest remains an independent, root-level object and is never skinned/animated.
    chest = cube("Chest", (2.05, 0.28, 0.42), (0.57, 0.42, 0.36), collection, materials["wood"])
    lid = cube("Chest.Lid", (2.05, 0.28, 0.80), (0.59, 0.44, 0.10), collection, materials["orange"])
    cube("Chest.Band.Vertical", (2.05, -0.155, 0.43), (0.055, 0.025, 0.36), collection, materials["gold"])
    cube("Chest.Band.Horizontal", (2.05, -0.158, 0.43), (0.57, 0.025, 0.045), collection, materials["gold"])
    sphere("Chest.Paw.Pad", (2.05, -0.198, 0.53), (0.105, 0.025, 0.085), collection, materials["gold"])
    for index, x in enumerate((1.91, 2.00, 2.10, 2.19), start=1):
        sphere(f"Chest.Paw.Toe.{index}", (x, -0.198, 0.66), (0.040, 0.020, 0.040), collection, materials["gold"])
    lid["pivotMetadata"] = "hingeBack"
    chest["isIndependentProp"] = True
    floor["roomFragment"] = True
    back_wall["roomFragment"] = True
    side_wall["roomFragment"] = True
    rug["roomFragment"] = True


def reset_pose(armature: bpy.types.Object) -> None:
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_euler = (0.0, 0.0, 0.0)


def key_pose(armature: bpy.types.Object, action: bpy.types.Action, frame: int, rotations: dict[str, tuple[float, float, float]]) -> None:
    armature.animation_data.action = action
    reset_pose(armature)
    root = armature.pose.bones["Joint.Root"]
    root.location = (0.0, 0.0, 0.0)
    root.keyframe_insert(data_path="location", frame=frame)
    for name, degrees in rotations.items():
        bone = armature.pose.bones[name]
        bone.rotation_euler = tuple(math.radians(value) for value in degrees)
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)


def set_action_interpolation(action: bpy.types.Action, interpolation: str) -> None:
    """Handle both legacy and Blender 4.4+ layered Action curve storage."""
    curve_groups: list[object] = []
    legacy = getattr(action, "fcurves", None)
    if legacy is not None:
        curve_groups.append(legacy)
    for layer in getattr(action, "layers", ()):
        for strip in getattr(layer, "strips", ()):
            for channelbag in getattr(strip, "channelbags", ()):
                curve_groups.append(getattr(channelbag, "fcurves", ()))
    for curves in curve_groups:
        for curve in curves:
            for point in curve.keyframe_points:
                point.interpolation = interpolation


def make_actions(armature: bpy.types.Object) -> dict[str, bpy.types.Action]:
    actions: dict[str, bpy.types.Action] = {}
    armature.animation_data_create()
    keyframes = {
        "idle": (
            (1, {"Joint.Tail.Base": (0, 0, -4), "Joint.Tail.Mid": (0, 0, 5)}),
            (36, {"Joint.Tail.Base": (0, 0, 4), "Joint.Tail.Mid": (0, 0, -5), "Joint.Head": (0, 0, 1)}),
            (72, {"Joint.Tail.Base": (0, 0, -4), "Joint.Tail.Mid": (0, 0, 5)}),
        ),
        "blink": (
            (1, {}),
            (18, {"Joint.Lid.L": (25, 0, 0), "Joint.Lid.R": (25, 0, 0)}),
            (36, {}),
        ),
        "joy": (
            (1, {}),
            (24, {"Joint.Paw.L": (-28, 0, 0), "Joint.Paw.R": (-28, 0, 0), "Joint.Head": (0, 0, -3), "Joint.Tail.Base": (0, 0, 7)}),
            (48, {}),
        ),
        "curiosity": (
            (1, {}),
            (27, {"Joint.Head": (0, 11, 5), "Joint.Paw.R": (-18, 0, 0), "Joint.Tail.Mid": (0, 0, -4)}),
            (54, {}),
        ),
    }
    for name, duration in CLIPS.items():
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        for frame, rotations in keyframes[name]:
            key_pose(armature, action, frame, rotations)
        set_action_interpolation(action, "BEZIER")
        action.frame_range = (1, duration)
        actions[name] = action
    reset_pose(armature)
    armature.animation_data.action = actions["idle"]
    return actions


def configure_scene(scene: bpy.types.Scene, output: Path) -> None:
    configure_eevee(scene)
    scene.render.resolution_x, scene.render.resolution_y = PORTRAIT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.fps = FPS
    scene.render.film_transparent = False
    ensure_world(scene, "World.FinniR3").color = (0.055, 0.028, 0.018)
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(output / "renders" / "neutral.png")


def create_camera_and_lights(collection: bpy.types.Collection, scene: bpy.types.Scene) -> bpy.types.Object:
    camera_data = bpy.data.cameras.new("Camera.Portrait")
    camera = bpy.data.objects.new("Camera.Portrait", camera_data)
    collection.objects.link(camera)
    camera.location = (0.0, -11.5, 2.0)
    camera_data.lens = 55
    look_at(camera, (0.0, 0.0, 1.62))
    scene.camera = camera
    for name, location, energy, size, color in (
        ("Light.Key", (-3.0, -4.5, 5.8), 1100.0, 4.0, (1.0, 0.78, 0.58)),
        ("Light.Fill", (3.0, -2.0, 3.5), 600.0, 3.0, (1.0, 0.90, 0.76)),
        ("Light.Rim", (0.0, 2.0, 5.0), 850.0, 2.5, (1.0, 0.62, 0.34)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
        lamp = bpy.data.objects.new(name, data)
        collection.objects.link(lamp)
        lamp.location = location
        look_at(lamp, (0.0, 0.0, 1.5))
    return camera


def render_character_masks(scene: bpy.types.Scene, armature: bpy.types.Object, actions: dict[str, bpy.types.Action], output: Path, room: bpy.types.Collection, character: list[bpy.types.Object]) -> dict[str, Path]:
    rendered: dict[str, Path] = {}
    original_world_color = tuple(scene.world.color)
    for obj in room.objects:
        obj.hide_render = True
    scene.world.color = (0.0, 0.0, 0.0)
    scene.render.film_transparent = True
    armature.animation_data.action = actions["idle"]
    scene.frame_set(1)
    transparent = output / "renders" / "neutral_character_alpha.png"
    scene.render.filepath = str(transparent)
    bpy.ops.render.render(write_still=True)
    rendered["alpha"] = transparent
    # Derive a true binary mask from the actual transparent character render.
    source = bpy.data.images.load(str(transparent), check_existing=False)
    source_pixels = list(source.pixels[:])
    mask_pixels: list[float] = []
    for offset in range(0, len(source_pixels), 4):
        value = 0.0 if source_pixels[offset + 3] > 0.01 else 1.0
        mask_pixels.extend((value, value, value, 1.0))
    mask = bpy.data.images.new("FinniR3.BinarySilhouette", width=source.size[0], height=source.size[1], alpha=False)
    mask.pixels = mask_pixels
    silhouette = output / "renders" / "silhouette.png"
    mask.filepath_raw = str(silhouette)
    mask.file_format = "PNG"
    mask.save()
    rendered["silhouette"] = silhouette
    for obj in room.objects:
        obj.hide_render = False
    scene.world.color = original_world_color
    scene.render.film_transparent = False
    return rendered


def render_stills(scene: bpy.types.Scene, armature: bpy.types.Object, actions: dict[str, bpy.types.Action], output: Path, room: bpy.types.Collection, character: list[bpy.types.Object]) -> dict[str, Path]:
    rendered: dict[str, Path] = {}
    stills = {"neutral": ("idle", 1), "idle_extreme": ("idle", 36), "blink_extreme": ("blink", 18), "joy_extreme": ("joy", 24), "curiosity_extreme": ("curiosity", 27)}
    for label, (action, frame) in stills.items():
        armature.animation_data.action = actions[action]
        scene.frame_set(frame)
        path = output / "renders" / f"{label}.png"
        scene.render.image_settings.file_format = "PNG"
        scene.render.film_transparent = False
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        rendered[label] = path
    rendered.update(render_character_masks(scene, armature, actions, output, room, character))
    return rendered


def render_videos(scene: bpy.types.Scene, armature: bpy.types.Object, actions: dict[str, bpy.types.Action], output: Path) -> list[Path]:
    videos: list[Path] = []
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("External ffmpeg is required because this Blender build has no FFMPEG output support")
    scene.render.image_settings.file_format = "PNG"
    full_resolution_percentage = scene.render.resolution_percentage
    scene.render.resolution_percentage = 50
    for name, frames in CLIPS.items():
        armature.animation_data.action = actions[name]
        scene.frame_start, scene.frame_end = 1, frames
        target = output / "previews" / f"{name}.mp4"
        frames_dir = output / "previews" / f".{name}_frames"
        if frames_dir.exists():
            shutil.rmtree(frames_dir)
        frames_dir.mkdir(parents=True)
        scene.render.filepath = str(frames_dir / "frame_")
        bpy.ops.render.render(animation=True)
        subprocess.run(
            (
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                "-framerate", str(FPS), "-start_number", "1",
                "-i", str(frames_dir / "frame_%04d.png"),
                "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(target),
            ),
            check=True,
        )
        shutil.rmtree(frames_dir)
        videos.append(target)
    scene.render.resolution_percentage = full_resolution_percentage
    return videos


def image_material(name: str, path: Path, opacity: float = 1.0) -> bpy.types.Material:
    image = bpy.data.images.load(str(path), check_existing=False)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    for node in tuple(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    if "Emission Color" in shader.inputs:
        links.new(texture.outputs["Color"], shader.inputs["Emission Color"])
        shader.inputs["Emission Strength"].default_value = 1.0
    if "Alpha" in texture.outputs:
        alpha = nodes.new("ShaderNodeMath")
        alpha.operation = "MULTIPLY"
        alpha.inputs[1].default_value = opacity
        links.new(texture.outputs["Alpha"], alpha.inputs[0])
        links.new(alpha.outputs["Value"], shader.inputs["Alpha"])
    shader.inputs["Roughness"].default_value = 1.0
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    try:
        material.surface_render_method = "DITHERED"
    except AttributeError:
        pass
    return material


def panel(scene: bpy.types.Scene, name: str, material: bpy.types.Material, x: float, z: float, collection: bpy.types.Collection) -> bpy.types.Object:
    width, height = 0.82, 1.46
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-width / 2, 0, -height / 2), (width / 2, 0, -height / 2), (width / 2, 0, height / 2), (-width / 2, 0, height / 2)], [], [(0, 1, 2, 3)])
    uv_layer = mesh.uv_layers.new(name="UVMap")
    uv_by_vertex = ((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))
    for loop in mesh.loops:
        uv_layer.data[loop.index].uv = uv_by_vertex[loop.vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = (x, 0, z)
    obj.data.materials.append(material)
    return obj


def label(collection: bpy.types.Collection, text: str, x: float, z: float) -> None:
    curve = bpy.data.curves.new(f"Label.{text}", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.size = 0.09
    obj = bpy.data.objects.new(f"Label.{text}", curve)
    collection.objects.link(obj)
    obj.location = (x, -0.03, z)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(solid_material(f"MAT.Label.{text}", (0.05, 0.03, 0.02, 1.0)))


def acceptance_sheet(reference: Path, stills: dict[str, Path], output: Path) -> Path:
    sheet = bpy.data.scenes.new("AcceptanceSheet")
    configure_eevee(sheet)
    sheet.render.resolution_x, sheet.render.resolution_y = PORTRAIT
    sheet.render.resolution_percentage = 100
    sheet.render.image_settings.file_format = "PNG"
    ensure_world(sheet, "World.AcceptanceSheet").color = (0.94, 0.82, 0.63)
    collection = bpy.data.collections.new("AcceptanceSheet.Visuals")
    sheet.collection.children.link(collection)
    camera_data = bpy.data.cameras.new("Camera.AcceptanceSheet")
    camera = bpy.data.objects.new("Camera.AcceptanceSheet", camera_data)
    collection.objects.link(camera)
    camera.location = (0.0, -8.0, 0.0)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 3.35
    look_at(camera, (0.0, 0.0, 0.0))
    sheet.camera = camera
    panel(sheet, "Sheet.REF", image_material("MAT.Sheet.REF", reference), -0.46, 0.78, collection)
    panel(sheet, "Sheet.Neutral", image_material("MAT.Sheet.Neutral", stills["neutral"]), 0.46, 0.78, collection)
    overlay_ref = panel(sheet, "Sheet.Overlay.REF", image_material("MAT.Sheet.Overlay.REF", reference), -0.46, -0.78, collection)
    overlay_ref.location.y = 0.01
    overlay_model = panel(sheet, "Sheet.Overlay.Model50", image_material("MAT.Sheet.Overlay.Model50", stills["alpha"], 0.50), -0.46, -0.78, collection)
    overlay_model.location.y = -0.01
    panel(sheet, "Sheet.Silhouette", image_material("MAT.Sheet.Silhouette", stills["silhouette"]), 0.46, -0.78, collection)
    label(collection, "REF-001", -0.46, 1.57)
    label(collection, "NEUTRAL", 0.46, 1.57)
    label(collection, "50% OVERLAY", -0.46, 0.01)
    label(collection, "SILHOUETTE", 0.46, 0.01)
    target = output / "renders" / "acceptance_sheet_ref_neutral_overlay_silhouette.png"
    sheet.render.filepath = str(target)
    bpy.context.window.scene = sheet
    bpy.ops.render.render(write_still=True)
    return target


def inspect_glb(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total != len(data):
        raise RuntimeError("Invalid GLB header")
    json_length, json_kind = struct.unpack_from("<I4s", data, 12)
    if json_kind != b"JSON":
        raise RuntimeError("GLB misses JSON chunk")
    doc = json.loads(data[20:20 + json_length].decode("utf-8").rstrip(" \t\r\n\0"))
    actions = [item.get("name") for item in doc.get("animations", [])]
    if len(actions) != len(CLIPS) or set(actions) != set(CLIPS):
        raise RuntimeError(f"Unexpected GLB actions: {actions}")
    if len(doc.get("skins", [])) != 1 or len(doc["skins"][0].get("joints", [])) != len(JOINTS):
        raise RuntimeError("GLB skin/joint contract mismatch")
    nodes = doc.get("nodes", [])
    names = [node.get("name") for node in nodes]
    if "Chest" not in names or any(name == "Chest" for name in (nodes[index].get("name") for index in doc["skins"][0]["joints"])):
        raise RuntimeError("Chest is not separate from skin joints")
    if any(name and name.startswith("Joint.") is False for name in (nodes[index].get("name") for index in doc["skins"][0]["joints"])):
        raise RuntimeError("Joint namespace contract mismatch")
    return {"animations": actions, "skins": len(doc.get("skins", [])), "joints": len(doc["skins"][0]["joints"]), "images": len(doc.get("images", [])), "nodes": len(nodes)}


def file_records(output: Path) -> list[dict[str, object]]:
    ignored = {"slice-manifest.json", "SHA256SUMS.txt"}
    records: list[dict[str, object]] = []
    for path in sorted((item for item in output.rglob("*") if item.is_file() and item.name not in ignored), key=lambda item: item.relative_to(output).as_posix().lower()):
        records.append({"path": path.relative_to(output).as_posix(), "sha256": sha256(path), "bytes": path.stat().st_size})
    return records


def write_manifest(output: Path, reference: Path, glb_info: dict[str, object], videos: list[Path]) -> None:
    manifest = {
        "package": "Finni_S7-002_R3",
        "status": "candidate_not_art_pass_or_production",
        "blender": bpy.app.version_string,
        "reference": {"path": str(reference), "sha256": sha256(reference), "bundled": False},
        "r2Preserved": {"sha256": R2_HASH},
        "rejectedR1FromAuditedR3Package": {"sha256": R1_REJECTED_HASH, "imported": False},
        "artBrief": {
            "identity": "compact seated chibi kitten/cat; portrait framing; no upright fox",
            "headSeatedHeight": "45-50%", "headWidthToHeight": "1.05-1.15", "bodyWidthToHead": "70-82%",
            "eyeWidthToHead": "18-22%", "muzzleToHead": "40-48%", "earToHeadEars": "22-28%",
            "pawsToHead": "16-20%", "roughness": "0.65-0.85",
            "camera": "941x1672 portrait", "rootSliding": "prohibited",
        },
        "rig": {"jointNames": list(JOINTS), "jointCount": len(JOINTS), "separateChest": True},
        "actions": [{"name": name, "frames": frames, "seconds": frames / FPS, "rootLocked": True} for name, frames in CLIPS.items()],
        "glb": {"path": "Finni_R3.glb", "sha256": sha256(output / "Finni_R3.glb"), **glb_info},
        "renders": {"camera": list(PORTRAIT), "videoScalePercent": 50, "videoEvenPadding": True, "stills": ["renders/neutral.png", "renders/idle_extreme.png", "renders/blink_extreme.png", "renders/joy_extreme.png", "renders/curiosity_extreme.png", "renders/acceptance_sheet_ref_neutral_overlay_silhouette.png"], "videos": [item.relative_to(output).as_posix() for item in videos]},
        "measurements": {"silhouetteIoU": "NOT MEASURED", "headEarsIoU": "NOT MEASURED", "landmarkError": "NOT MEASURED", "reason": "Requires owner-approved segmentation/landmark review against original REF-001."},
        "files": file_records(output),
    }
    (output / "slice-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    records = file_records(output)
    (output / "SHA256SUMS.txt").write_text("\n".join(f"{record['sha256']}  {record['path']}" for record in records) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    output = safe_output(args.output)
    reference = Path(args.reference).resolve()
    if not reference.is_file():
        raise RuntimeError(f"REF-001 is unavailable: {reference}")
    for directory in ("textures", "renders", "previews"):
        (output / directory).mkdir(exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "FinniR3Portrait"
    configure_scene(scene, output)
    export_collection = bpy.data.collections.new("ExportScene")
    scene.collection.children.link(export_collection)
    textures = {
        "orange": make_texture(output, "fur_orange", (0.78, 0.34, 0.11), (0.48, 0.14, 0.03)),
        "cream": make_texture(output, "fur_cream", (0.95, 0.76, 0.50), (0.73, 0.43, 0.18)),
        "wood": make_texture(output, "wood", (0.40, 0.11, 0.035), (0.18, 0.035, 0.012)),
        "wall": make_texture(output, "wall", (0.68, 0.20, 0.08), (0.35, 0.055, 0.02)),
        "rug": make_texture(output, "rug", (0.93, 0.44, 0.08), (0.54, 0.08, 0.025)),
    }
    materials = {name: make_material(f"MAT.{name.title()}", image, 0.76 if name in {"orange", "cream"} else 0.82) for name, image in textures.items()}
    materials["dark"] = solid_material("MAT.Eye", (0.035, 0.014, 0.008, 1.0), 0.18)
    materials["pink"] = solid_material("MAT.Pink", (0.86, 0.18, 0.18, 1.0), 0.72)
    materials["gold"] = solid_material("MAT.Gold", (0.95, 0.57, 0.08, 1.0), 0.42)
    armature = add_armature(export_collection)
    character = build_character(export_collection, armature, materials)
    room = bpy.data.collections.new("RoomFragment")
    scene.collection.children.link(room)
    build_room(room, materials)
    create_camera_and_lights(export_collection, scene)
    actions = make_actions(armature)
    if args.reuse_evidence or args.reuse_stills:
        stills = {
            "neutral": output / "renders" / "neutral.png",
            "idle_extreme": output / "renders" / "idle_extreme.png",
            "blink_extreme": output / "renders" / "blink_extreme.png",
            "joy_extreme": output / "renders" / "joy_extreme.png",
            "curiosity_extreme": output / "renders" / "curiosity_extreme.png",
            "alpha": output / "renders" / "neutral_character_alpha.png",
            "silhouette": output / "renders" / "silhouette.png",
        }
        videos = [output / "previews" / f"{name}.mp4" for name in CLIPS]
        required = (*stills.values(), *videos) if args.reuse_evidence else tuple(stills.values())
        missing = [path for path in required if not path.is_file()]
        if missing:
            raise RuntimeError(f"Cannot reuse missing render evidence: {missing}")
        if args.reuse_evidence:
            stills.update(render_character_masks(scene, armature, actions, output, room, character))
        else:
            videos = render_videos(scene, armature, actions, output)
    else:
        stills = render_stills(scene, armature, actions, output, room, character)
        videos = render_videos(scene, armature, actions, output)
    sheet = acceptance_sheet(reference, stills, output)
    bpy.context.window.scene = scene
    # Export only model, room and lights-independent scene nodes. GLB is self-contained.
    for obj in bpy.context.view_layer.objects:
        obj.select_set(False)
    for obj in export_collection.all_objects:
        obj.select_set(True)
    for obj in room.all_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    glb = output / "Finni_R3.glb"
    try:
        bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_yup=True, export_animations=True, export_animation_mode="ACTIONS", export_nla_strips=False, export_image_format="AUTO")
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_yup=True, export_animations=True, export_image_format="AUTO")
    glb_info = inspect_glb(glb)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "Finni_R3.blend"))
    write_manifest(output, reference, glb_info, videos)
    print(json.dumps({"output": str(output), "glb": sha256(glb), "acceptanceSheet": str(sheet), **glb_info}, ensure_ascii=False))


if __name__ == "__main__":
    main()
