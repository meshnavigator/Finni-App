"""Build an exact-pixel, editable layer prototype from the accepted Finni PNG.

This is an art review aid. It does not create the other shapes or patterns.
Run from any directory with: python -B build_layers.py
"""

from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageFilter


PACKAGE = Path(__file__).resolve().parent
APP_ROOT = PACKAGE.parents[2]
MASTER = APP_ROOT / "assets/2d/master/FINNI-2D-MASTER-V1"
NEUTRAL = MASTER / "pet_neutral_canvas_v1.png"
ROOM = MASTER / "room_clean_v1.png"
EXPECTED_SHA256 = {
    "pet_neutral_canvas_v1.png": "8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0",
    "room_clean_v1.png": "2c76a1e29090e61de615c5e228bf309d34016f89aa74cac9ea1b990821ac6140",
}
SIZE = (941, 1672)
FEET = (470, 1272)
LAYER_ORDER = (
    "room-base",
    "pet-back",
    "pet-body",
    "pet-pattern",
    "pet-ear-shape",
    "pet-face",
    "pet-expression",
    "pet-accessory",
    "room-foreground",
)

# Coordinates are on the accepted 941 x 1672 canvas. These contours follow
# visible fur overlaps and the collar/medallion edges, rather than broad
# straight clipping regions. Source alpha supplies the natural outside edge.
# This is still a neutral-only extraction; concealed fur cannot be recovered
# from a flattened PNG.
POLYGONS = {
    "pet-back": [
        [(559, 1016), (549, 1031), (543, 1046), (541, 1062),
         (544, 1080), (551, 1097), (562, 1113), (572, 1129),
         (578, 1147), (581, 1164), (581, 1180), (576, 1196),
         (567, 1210), (565, 1226), (565, 1250), (730, 1250),
         (730, 1000), (605, 1000)],
    ],
    "pet-ear-shape": [
        [(288, 863), (290, 814), (300, 776), (318, 737),
         (333, 714), (348, 713), (372, 728), (397, 749),
         (417, 769), (434, 790), (436, 803), (425, 801),
         (410, 805), (395, 811), (380, 820), (365, 830),
         (350, 840), (336, 847), (323, 854), (309, 861)],
        [(522, 803), (546, 796), (579, 795), (614, 792),
         (642, 797), (653, 812), (652, 841), (645, 873),
         (630, 904), (611, 927), (600, 940), (587, 937),
         (578, 928), (572, 911), (569, 892), (563, 870),
         (553, 846), (540, 826), (528, 814)],
    ],
    "pet-face": [
        # Capture every remaining pixel of the head above the chin line.
        # This prevents disconnected forehead wisps from leaking into body.
        [(0, 0), (941, 0), (941, 980), (650, 980),
         (628, 985), (609, 997), (590, 1010), (568, 1019),
         (544, 1026), (516, 1029), (487, 1030), (458, 1029),
         (430, 1025), (403, 1019), (380, 1011), (357, 1000),
         (333, 987), (309, 974), (288, 957), (270, 944),
         (0, 944)],
    ],
    "pet-accessory": [
        # Leather band: clipped closely to the brown material and not chest fur.
        [(357, 1007), (369, 1009), (385, 1016), (401, 1021),
         (420, 1026), (440, 1028), (460, 1029), (480, 1028),
         (497, 1027), (511, 1024), (518, 1021), (513, 1030),
         (500, 1037), (480, 1043), (460, 1046), (440, 1047),
         (420, 1044), (400, 1039), (382, 1032), (368, 1023),
         (358, 1014)],
        # Ring and medallion, with a narrow silhouette around the metal.
        [(422, 1027), (426, 1025), (430, 1027), (433, 1035),
         (432, 1045), (441, 1049), (448, 1058), (450, 1067),
         (448, 1077), (442, 1086), (433, 1091), (422, 1092),
         (412, 1089), (405, 1082), (402, 1073), (403, 1062),
         (407, 1053), (417, 1046), (420, 1038)],
    ],
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=False)


def mask_for(polygons: list[list[tuple[int, int]]]) -> Image.Image:
    mask = Image.new("L", SIZE, 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    return mask


def rgba_layer(source: Image.Image, mask: Image.Image) -> Image.Image:
    return Image.composite(source, Image.new("RGBA", SIZE, (0, 0, 0, 0)), mask)


def visible_pixel_differences(left: Image.Image, right: Image.Image) -> int:
    return sum(
        a != b and (a[3] > 0 or b[3] > 0)
        for a, b in zip(left.getdata(), right.getdata())
    )


def stage_preview(pet: Image.Image, room: Image.Image, scale: float) -> Image.Image:
    if scale == 1:
        scaled = pet
    else:
        scaled = pet.resize(
            (round(SIZE[0] * scale), round(SIZE[1] * scale)),
            Image.Resampling.LANCZOS,
        )
    stage = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    stage.alpha_composite(
        scaled,
        (round(FEET[0] * (1 - scale)), round(FEET[1] * (1 - scale))),
    )
    return Image.alpha_composite(room, stage)


def make_ora(layers: dict[str, Image.Image], flattened: Image.Image, path: Path) -> None:
    root = ET.Element("image", {"version": "0.0.1", "w": "941", "h": "1672",
                                "name": "Finni S8-001 exact neutral layer prototype"})
    stack = ET.SubElement(root, "stack", {"name": "Finni neutral"})
    for name in reversed(LAYER_ORDER):
        ET.SubElement(stack, "layer", {
            "name": name,
            "src": f"data/{name}.png",
            "visibility": "visible",
            "composite-op": "svg:src-over",
            "x": "0", "y": "0",
        })

    def png_bytes(image: Image.Image) -> bytes:
        output = io.BytesIO()
        image.save(output, format="PNG", optimize=False)
        return output.getvalue()

    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as archive:
        def write(name: str, data: bytes | str, compression: int = zipfile.ZIP_DEFLATED) -> None:
            info = zipfile.ZipInfo(name, (2026, 9, 23, 0, 0, 0))
            info.compress_type = compression
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)

        write("mimetype", "image/openraster", zipfile.ZIP_STORED)
        write("stack.xml", ET.tostring(root, encoding="utf-8", xml_declaration=True))
        write("mergedimage.png", png_bytes(flattened))
        thumb = flattened.copy()
        thumb.thumbnail((256, 256), Image.Resampling.LANCZOS)
        write("Thumbnails/thumbnail.png", png_bytes(thumb))
        for name in LAYER_ORDER:
            write(f"data/{name}.png", png_bytes(layers[name]))
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        assert archive.namelist()[0] == "mimetype"


def main() -> None:
    for source in (NEUTRAL, ROOM):
        actual = sha256(source)
        expected = EXPECTED_SHA256[source.name]
        if actual != expected:
            raise RuntimeError(f"Accepted source hash changed: {source} ({actual})")

    pet = Image.open(NEUTRAL).convert("RGBA")
    room = Image.open(ROOM).convert("RGBA")
    if pet.size != SIZE or room.size != SIZE:
        raise RuntimeError("Accepted canvas is no longer 941 x 1672")

    remaining = Image.new("L", SIZE, 255)
    masks: dict[str, Image.Image] = {}
    # Front-most regions own intersections; every source pixel belongs to one layer.
    for name in ("pet-accessory", "pet-ear-shape", "pet-face", "pet-back"):
        selected = ImageChops.multiply(mask_for(POLYGONS[name]), remaining)
        masks[name] = selected
        remaining = ImageChops.subtract(remaining, selected)
    masks["pet-body"] = remaining

    # The collar separates a few tiny under-chin wisps from the torso. Keep
    # those with the head, so the standalone body has no floating fragments.
    body_opaque = ImageChops.multiply(
        masks["pet-body"], pet.getchannel("A")
    ).point(lambda value: 255 if value > 8 else 0)
    ImageDraw.floodfill(body_opaque, (450, 1150), 128, thresh=0)
    disconnected = body_opaque.point(lambda value: 255 if value == 255 else 0)
    disconnected = disconnected.filter(ImageFilter.MaxFilter(3))
    upper_neck = Image.new("L", SIZE, 0)
    ImageDraw.Draw(upper_neck).rectangle((350, 960, 570, 1040), fill=255)
    wisps = ImageChops.multiply(
        masks["pet-body"], ImageChops.multiply(disconnected, upper_neck)
    )
    masks["pet-body"] = ImageChops.subtract(masks["pet-body"], wisps)
    masks["pet-face"] = ImageChops.lighter(masks["pet-face"], wisps)

    layers = {name: Image.new("RGBA", SIZE, (0, 0, 0, 0)) for name in LAYER_ORDER}
    layers["room-base"] = room
    for name, mask in masks.items():
        layers[name] = rgba_layer(pet, mask)

    rebuilt = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    for name in LAYER_ORDER[1:-1]:
        rebuilt = Image.alpha_composite(rebuilt, layers[name])
    differences = visible_pixel_differences(pet, rebuilt)
    if differences:
        raise RuntimeError(f"Neutral reassembly differs at {differences} visible pixels")

    for name, image in layers.items():
        save_png(image, PACKAGE / "layers" / f"{name}.png")
    save_png(rebuilt, PACKAGE / "review" / "reassembled-neutral.png")
    flattened = Image.alpha_composite(room, rebuilt)
    save_png(flattened, PACKAGE / "review" / "reassembled-home.png")

    crop = (240, 690, 730, 1310)
    cream = (248, 244, 235, 255)
    comparison = Image.new("RGBA", (980, 620), cream)
    comparison.alpha_composite(pet.crop(crop), (0, 0))
    comparison.alpha_composite(rebuilt.crop(crop), (490, 0))
    save_png(comparison, PACKAGE / "review" / "accepted-vs-reassembled.png")

    parts = ("pet-back", "pet-body", "pet-ear-shape", "pet-face", "pet-accessory")
    breakdown = Image.new("RGBA", (5 * 490, 650), cream)
    label = ImageDraw.Draw(breakdown)
    for index, name in enumerate(parts):
        breakdown.alpha_composite(layers[name].crop(crop), (index * 490, 30))
        label.text((index * 490 + 8, 8), name, fill=(30, 60, 70, 255))
    save_png(breakdown, PACKAGE / "review" / "layer-breakdown.png")

    audit = Image.new("RGBA", (5 * 490, 650), cream)
    for index, name in enumerate(parts):
        panel = Image.alpha_composite(Image.new("RGBA", SIZE, cream), pet)
        alpha = layers[name].getchannel("A").point(lambda value: 255 if value > 8 else 0)
        outline = ImageChops.subtract(
            alpha.filter(ImageFilter.MaxFilter(3)),
            alpha.filter(ImageFilter.MinFilter(3)),
        )
        ink = Image.new("RGBA", SIZE, (0, 174, 220, 0))
        ink.putalpha(outline.point(lambda value: 220 if value else 0))
        panel.alpha_composite(ink)
        audit.alpha_composite(panel.crop(crop), (index * 490, 30))
        ImageDraw.Draw(audit).text(
            (index * 490 + 8, 8), name, fill=(30, 60, 70, 255)
        )
    save_png(audit, PACKAGE / "review" / "contour-audit.png")

    stages = Image.new("RGBA", (3 * 470, 836), cream)
    for index, scale in enumerate((0.86, 1.0, 1.12)):
        frame = stage_preview(rebuilt, room, scale)
        stages.alpha_composite(frame.resize((470, 836), Image.Resampling.LANCZOS),
                               (index * 470, 0))
    save_png(stages, PACKAGE / "review" / "stage-1-2-3.png")

    ora_path = PACKAGE / "source" / "finni_neutral_layers_prototype.ora"
    make_ora(layers, flattened, ora_path)
    manifest = {
        "packageId": "S8-001-NEUTRAL-LAYER-PROTOTYPE",
        "status": "art-review-prototype-not-runtime",
        "sourcePackage": "FINNI-2D-MASTER-V1",
        "sourceHashes": EXPECTED_SHA256,
        "canvas": list(SIZE),
        "feetAnchor": list(FEET),
        "provisionalAppearance": "pointy/plain",
        "expression": "neutral",
        "layerOrderBackToFront": list(LAYER_ORDER),
        "visiblePixelDifferencesFromAcceptedNeutral": differences,
        "emptyLayers": ["pet-pattern", "pet-expression", "room-foreground"],
        "ora": {"path": "source/finni_neutral_layers_prototype.ora",
                "sha256": sha256(ora_path)},
        "layers": [
            {"name": name, "path": f"layers/{name}.png",
             "sha256": sha256(PACKAGE / "layers" / f"{name}.png"),
             "alphaBounds": layers[name].getchannel("A").getbbox()}
            for name in LAYER_ORDER
        ],
    }
    (PACKAGE / "prototype-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"ORA: {ora_path}")
    print(f"Visible pixel differences: {differences}")
    print("Status: review prototype; no runtime art was replaced")


if __name__ == "__main__":
    main()
