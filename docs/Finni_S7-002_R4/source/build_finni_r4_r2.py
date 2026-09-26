"""R4 visual-correction build: round golden Finni, based on mandatory REF-001 review.

It replaces only the R4 visual construction functions.  The established R4
15-joint armature, exact clip names, exporter and evidence contracts remain the
technical shell; no R3 mesh, texture or scene data is read or imported.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

import build_finni_r4 as r4


def texture_pixels(kind: str, size: int = 192) -> list[float]:
    palettes = {
        "orange": ((0.98, 0.52, 0.105), (0.46, 0.12, 0.018)),
        "cream": ((1.0, 0.84, 0.55), (0.78, 0.43, 0.12)),
        "collar": ((0.10, 0.014, 0.010), (0.025, 0.002, 0.001)),
        "wood": ((0.48, 0.20, 0.052), (0.16, 0.035, 0.008)),
        "rug": ((0.77, 0.41, 0.11), (0.42, 0.13, 0.025)),
        "wall": ((0.78, 0.68, 0.52), (0.48, 0.37, 0.22)),
    }
    light, dark = palettes[kind]
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            grain = math.sin(x * .081 + y * .13) * .13 + math.sin(x * .31 - y * .16) * .055
            small = (((x * 61 + y * 43) % 37) / 36.0 - .5) * .075
            amount = .62 + grain + small
            if kind == "orange":
                # soft dark tabby bands, never hard graphic zebra stripes
                band = max(0.0, math.sin(x * .152 + y * .042 - .8)) ** 10
                amount -= band * .42
            elif kind == "cream":
                amount += max(0.0, math.sin(x * .20 - y * .08)) ** 7 * .09
            elif kind == "wood":
                amount += math.sin(y * .24 + math.sin(x * .07) * 2.8) * .19
            elif kind == "rug":
                amount += ((x // 11 + y // 11) % 2) * .12
            amount = max(0.0, min(1.0, amount))
            pixels.extend(tuple(dark[index] * (1 - amount) + light[index] * amount for index in range(3)) + (1.0,))
    return pixels


def world(scene: bpy.types.Scene, name: str) -> bpy.types.World:
    if scene.world is None:
        scene.world = bpy.data.worlds.new(name)
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.055, 0.052, 0.045, 1.0)
    bg.inputs["Strength"].default_value = .42
    return scene.world


def organic_shell(collection: bpy.types.Collection, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    """Build a small chibi cat body as one smooth shell with soft silhouette clumps."""
    volumes = (
        # Small seated body / haunches / individually readable paws.
        ((0, .06, 1.00), (.62, .51, .70)),
        ((-.49, .10, .49), (.41, .36, .45)), ((.49, .10, .49), (.41, .36, .45)),
        ((-.28, -.42, .76), (.20, .19, .57)), ((.28, -.42, .76), (.20, .19, .57)),
        ((-.28, -.56, .20), (.25, .27, .17)), ((.28, -.56, .20), (.25, .27, .17)),
        ((-.55, -.23, .20), (.26, .29, .17)), ((.55, -.23, .20), (.26, .29, .17)),
        # Broad rounded triangular head, neck bridge and cheek mass.
        ((0, -.02, 2.31), (1.01, .75, .82)), ((0, -.02, 1.72), (.46, .42, .43)),
        ((-.51, -.43, 2.13), (.41, .25, .29)), ((.51, -.43, 2.13), (.41, .25, .29)),
        ((0, -.61, 2.08), (.43, .19, .25)),
        # Smooth built-in fur clumps around head, cheeks and a large C-shaped tail.
        ((-.84, -.01, 2.52), (.25, .28, .34)), ((.84, -.01, 2.52), (.25, .28, .34)),
        ((-.55, .00, 2.98), (.30, .28, .25)), ((.55, .00, 2.98), (.30, .28, .25)),
        ((.67, .16, .63), (.40, .30, .29)), ((1.03, .18, .73), (.37, .28, .34)),
        ((1.35, .18, .99), (.34, .26, .39)), ((1.45, .15, 1.33), (.31, .25, .39)),
        ((1.30, .10, 1.64), (.32, .24, .34)), ((1.00, .07, 1.74), (.35, .24, .28)),
    )
    parts = [r4.ellipsoid("R4R2_FuseVolume", position, scale, materials["orange"], collection, 28, 17) for position, scale in volumes]
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    shell = bpy.context.object
    shell.name = "Finni.FurShell"
    modifier = shell.modifiers.new("Continuous_Fluffy_Sculpt", "REMESH")
    modifier.mode, modifier.voxel_size, modifier.use_smooth_shade = "VOXEL", .047, True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    # Cream areas are material regions of the same continuous mesh, not attached beads.
    shell.data.materials.append(materials["cream"])
    for polygon in shell.data.polygons:
        center = polygon.center
        x, y, z = center.x, center.y, center.z
        cream = False
        if y < -.36 and 1.85 < z < 2.42:
            cream = (abs(x) < .36 and z < 2.28) or (.27 < abs(x) < .78 and 1.96 < z < 2.33)
        if y < -.34 and .82 < z < 1.66 and abs(x) < .40:
            cream = True  # chest bib
        if y < -.40 and .54 < z < .99 and abs(x) < .34:
            cream = True  # belly
        if y < -.39 and z < .37 and (.06 < abs(x) < .48):
            cream = True  # front/back toe tips
        polygon.material_index = 1 if cream else 0
    return shell


def ear(name: str, side: float, materials: dict[str, bpy.types.Material], collection: bpy.types.Collection) -> tuple[bpy.types.Object, bpy.types.Object]:
    # Broad rounded triangles create the large, widely-set kitty ears of REF-001.
    outer = [
        (side * .24, -.02, 2.67), (side * .34, -.02, 3.17),
        (side * .56, -.01, 3.50), (side * .73, -.01, 3.70),
        (side * .91, -.01, 3.45), (side * 1.10, -.02, 3.06), (side * .99, -.02, 2.64),
    ]
    front, back = [(x, y - .17, z) for x, y, z in outer], [(x, y + .11, z) for x, y, z in outer]
    faces = [tuple(range(len(outer))), tuple(range(len(outer) * 2 - 1, len(outer) - 1, -1))]
    for index in range(len(outer)):
        nxt = (index + 1) % len(outer)
        faces.append((index, nxt, nxt + len(outer), index + len(outer)))
    outer_obj = r4.new_mesh(name, front + back, faces, materials["orange"], collection)
    inner = [
        (side * .38, -.195, 2.77), (side * .46, -.20, 3.16),
        (side * .71, -.20, 3.53), (side * .91, -.20, 3.13), (side * .87, -.20, 2.75),
    ]
    inner_obj = r4.new_mesh(name.replace("Ear", "EarInner"), inner, [tuple(range(len(inner)))], materials["ear"], collection)
    return outer_obj, inner_obj


def torus(name: str, location: tuple[float, float, float], major_x: float, major_y: float, minor: float, material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    vertices, faces = [], []
    seg_a, seg_b = 40, 10
    for a in range(seg_a):
        angle = 2 * math.pi * a / seg_a
        for b in range(seg_b):
            ring = 2 * math.pi * b / seg_b
            vertices.append((location[0] + (major_x + minor * math.cos(ring)) * math.cos(angle), location[1] + (major_y + minor * math.cos(ring)) * math.sin(angle), location[2] + minor * math.sin(ring)))
    for a in range(seg_a):
        for b in range(seg_b):
            nxt_a, nxt_b = (a + 1) % seg_a, (b + 1) % seg_b
            faces.append((a * seg_b + b, nxt_a * seg_b + b, nxt_a * seg_b + nxt_b, a * seg_b + nxt_b))
    return r4.new_mesh(name, vertices, faces, material, collection)


def button_nose(material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    front = [(-.115, -.888, 2.23), (.115, -.888, 2.23), (0, -.895, 2.08)]
    back = [(x, y + .055, z) for x, y, z in front]
    return r4.new_mesh("Finni.Nose", front + back, [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], material, collection)


def build_character(collection: bpy.types.Collection, armature: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> list[bpy.types.Object]:
    shell = organic_shell(collection, materials)
    add_to_shell = []
    for side, label in ((-1.0, "L"), (1.0, "R")):
        outside, inside = ear(f"Finni.Ear.{label}", side, materials, collection)
        add_to_shell.append(outside)
        r4.attach_rigid(inside, armature, f"Joint.Ear.{label}")
    shell = r4.join_geometry(add_to_shell, shell)
    r4.skin_shell(shell, armature)
    eye_dark = r4.solid("MAT.GlossyDeepBrown", (.045, .008, .003, 1), .12)
    iris = r4.solid("MAT.WarmAmberIris", (.62, .20, .025, 1), .20)
    pupil = r4.solid("MAT.RoundBlackPupil", (.004, .001, .0005, 1), .08)
    glint = r4.solid("MAT.Catchlight", (1, .98, .88, 1), .05)
    nose_material = r4.solid("MAT.ButtonNose", (.12, .018, .010, 1), .38)
    details: list[tuple[bpy.types.Object, str]] = []
    for side, label in ((-1.0, "L"), (1.0, "R")):
        # Nearly circular eyes: deep outer chocolate, warm amber iris, black pupil and catchlights.
        outer = r4.ellipsoid(f"Finni.Eye.{label}", (side * .43, -.695, 2.51), (.285, .070, .325), eye_dark, collection, 32, 20)
        warm = r4.ellipsoid(f"Finni.Iris.{label}", (side * .43, -.755, 2.50), (.205, .020, .235), iris, collection, 30, 18)
        dark = r4.ellipsoid(f"Finni.Pupil.{label}", (side * .43, -.777, 2.49), (.094, .012, .155), pupil, collection, 24, 16)
        catch_a = r4.ellipsoid(f"Finni.CatchlightLarge.{label}", (side * .385, -.795, 2.60), (.055, .008, .073), glint, collection, 16, 12)
        catch_b = r4.ellipsoid(f"Finni.CatchlightSmall.{label}", (side * .488, -.794, 2.42), (.023, .006, .032), glint, collection, 12, 10)
        lid = r4.ellipsoid(f"Finni.Lid.{label}", (side * .43, -.773, 2.72), (.300, .028, .065), materials["orange"], collection, 32, 12)
        details.extend(((outer, f"Joint.Eye.{label}"), (warm, f"Joint.Eye.{label}"), (dark, f"Joint.Eye.{label}"), (catch_a, f"Joint.Eye.{label}"), (catch_b, f"Joint.Eye.{label}"), (lid, f"Joint.Lid.{label}")))
    nose = button_nose(nose_material, collection)
    mouth_l = r4.ellipsoid("Finni.Smile.L", (-.068, -.875, 2.01), (.075, .018, .025), nose_material, collection, 18, 10)
    mouth_r = r4.ellipsoid("Finni.Smile.R", (.068, -.875, 2.01), (.075, .018, .025), nose_material, collection, 18, 10)
    mouth_l.rotation_euler[1], mouth_r.rotation_euler[1] = -.28, .28
    tongue = r4.ellipsoid("Finni.Tongue", (0, -.889, 1.965), (.075, .014, .033), materials["tongue"], collection, 20, 12)
    collar = torus("Finni.Collar", (0, -.015, 1.67), .55, .48, .048, materials["collar"], collection)
    medal = r4.ellipsoid("Finni.PawMedallion", (0, -.558, 1.52), (.135, .030, .145), materials["gold"], collection, 30, 18)
    details.extend(((nose, "Joint.Head"), (mouth_l, "Joint.Head"), (mouth_r, "Joint.Head"), (tongue, "Joint.Head"), (collar, "Joint.Neck"), (medal, "Joint.Spine")))
    for object_, bone in details:
        r4.attach_rigid(object_, armature, bone)
    return [shell] + [object_ for object_, _ in details]


def camera_lights(scene: bpy.types.Scene, collection: bpy.types.Collection) -> None:
    data = bpy.data.cameras.new("Camera.Portrait")
    camera = bpy.data.objects.new("Camera.Portrait", data)
    collection.objects.link(camera)
    camera.location, data.lens = (0.0, -11.4, 2.10), 58
    r4.look_at(camera, (0.0, -.04, 1.70))
    scene.camera = camera
    for name, position, energy, size, color in (
        ("Light.Key", (-3.5, -4.8, 5.9), 900, 4.5, (1.0, .94, .84)),
        ("Light.Fill", (3.7, -3.0, 4.1), 760, 3.8, (.88, .94, 1.0)),
        ("Light.Rim", (0.0, 1.8, 5.5), 680, 3.2, (1.0, .88, .70)),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy, light_data.shape, light_data.size, light_data.color = energy, "DISK", size, color
        lamp = bpy.data.objects.new(name, light_data)
        collection.objects.link(lamp)
        lamp.location = position
        r4.look_at(lamp, (0, 0, 1.55))


r4.texture_pixels = texture_pixels
r4.world = world
r4.organic_shell = organic_shell
r4.ear = ear
r4.build_character = build_character
r4.camera_lights = camera_lights

if __name__ == "__main__":
    r4.main()
