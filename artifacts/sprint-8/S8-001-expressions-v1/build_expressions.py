"""Build face-only expression layers over the accepted FINNI-MATRIX-V1 frames."""
from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageFilter


HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
PACKAGE = APP / "assets/2d/variants/FINNI-MATRIX-V1"
SIZE = (941, 1672)
ORDER = [
    "room-base", "pet-back", "pet-body", "pet-pattern", "pet-ear-shape",
    "pet-face", "pet-expression", "pet-accessory", "room-foreground",
]
EXPRESSIONS = ("happy", "thoughtful", "inspired")
STAGES = {1: .86, 2: 1.0, 3: 1.12}
FEET = (470, 1272)


def load(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    assert image.size == SIZE, (path, image.size)
    return image


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def compose(layers: dict[str, Image.Image]) -> Image.Image:
    image = Image.new("RGBA", SIZE)
    for name in ORDER[1:-1]:
        image = Image.alpha_composite(image, layers[name])
    return image


def feature_mask(expression: str) -> Image.Image:
    mask = Image.new("L", SIZE)
    draw = ImageDraw.Draw(mask)
    if expression != "happy":
        draw.ellipse((340, 826, 451, 956), fill=255)
        draw.ellipse((462, 841, 562, 974), fill=255)
    draw.ellipse((388, 922, 518, 1014), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(7))


def expression_layer(donor: Image.Image, expression: str, neutral: Image.Image) -> Image.Image:
    # A new layer changes facial features only. Accepted alpha, fur silhouettes,
    # coats, ears, paws, tail and medal come exclusively from the neutral frame.
    alpha = ImageChops.multiply(feature_mask(expression), neutral.getchannel("A"))
    layer = donor.copy()
    layer.putalpha(alpha)
    return layer


def write_ora(path: Path, states: dict[str, dict[str, Image.Image]]) -> None:
    root = ET.Element("image", {"version": "0.0.1", "w": "941", "h": "1672", "name": path.parent.name + "-expressions"})
    stack = ET.SubElement(root, "stack", {"name": "Finni expressions"})
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("mimetype", "image/openraster", compress_type=zipfile.ZIP_STORED)
        for expression in EXPRESSIONS:
            group = ET.SubElement(stack, "stack", {"name": expression, "visibility": "visible" if expression == "happy" else "hidden", "composite-op": "svg:src-over"})
            for name in reversed(ORDER):
                member = f"data/{expression}/{name}.png"
                image_bytes = io.BytesIO()
                states[expression][name].save(image_bytes, format="PNG")
                archive.writestr(member, image_bytes.getvalue())
                ET.SubElement(group, "layer", {"name": name, "src": member, "x": "0", "y": "0", "opacity": "1.0", "visibility": "visible", "composite-op": "svg:src-over"})
        merged = io.BytesIO()
        preview = Image.alpha_composite(states["happy"]["room-base"], compose(states["happy"]))
        preview = Image.alpha_composite(preview, states["happy"]["room-foreground"])
        preview.save(merged, format="PNG")
        archive.writestr("mergedimage.png", merged.getvalue())
        archive.writestr("stack.xml", ET.tostring(root, encoding="utf-8"))


def review_sheet(frames: dict[tuple[str, str], Image.Image]) -> None:
    sheet = Image.new("RGB", (9 * 240, 3 * 355), "#f8f3e9")
    draw = ImageDraw.Draw(sheet)
    variants = list(dict.fromkeys(variant for variant, _ in frames))
    for column, variant in enumerate(variants):
        for row, expression in enumerate(EXPRESSIONS):
            crop = frames[variant, expression].crop((250, 710, 715, 1275))
            crop.thumbnail((220, 320))
            left, top = column * 240 + 10, row * 355 + 25
            sheet.paste(crop, (left, top), crop)
            draw.text((left, row * 355 + 5), f"{variant} {expression}", fill="#263b47")
    save(sheet, HERE / "review/expressions-27.jpg")


def main() -> None:
    manifest = json.loads((PACKAGE / "asset-manifest.json").read_text(encoding="utf-8"))
    assert manifest["revision"] == "ear-seams-v3" and manifest["status"] == "owner-accepted"
    assert len(manifest["variants"]) == 9
    donors = {name: load(HERE / "input" / f"{name}-imagegen.png") for name in EXPRESSIONS}
    records = []
    review_frames = {}
    for variant in manifest["variants"]:
        variant_id = variant["id"]
        original = PACKAGE / variant_id
        neutral = load(original / "neutral.png")
        assert sha(original / "neutral.png") == variant["neutralSha256"]
        assert sha(original / "blink.png") == variant["blinkSha256"]
        assert sha(original / "source.ora") == variant["oraSha256"]
        base_layers = {name: load(original / "export/neutral" / f"{name}.png") for name in ORDER}
        states = {}
        destination = HERE / "variants" / variant_id
        for expression in EXPRESSIONS:
            layers = dict(base_layers)
            layers["pet-expression"] = expression_layer(donors[expression], expression, neutral)
            frame = compose(layers)
            assert frame.getchannel("A").getbbox() == neutral.getchannel("A").getbbox(), (variant_id, expression)
            states[expression] = layers
            save(frame, destination / f"{expression}.png")
            for name in ORDER:
                save(layers[name], destination / "export" / expression / f"{name}.png")
            review_frames[variant_id, expression] = frame
        write_ora(destination / "expressions.ora", states)
        records.append({
            "id": variant_id,
            "acceptedNeutralSha256": variant["neutralSha256"],
            "acceptedBlinkSha256": variant["blinkSha256"],
            "acceptedOraSha256": variant["oraSha256"],
            "expressions": {name: sha(destination / f"{name}.png") for name in EXPRESSIONS},
            "expressionsOraSha256": sha(destination / "expressions.ora"),
        })
    review_sheet(review_frames)
    result = {
        "packageId": "FINNI-EXPRESSIONS-V1", "basePackage": "FINNI-MATRIX-V1",
        "canvas": list(SIZE), "feetAnchor": list(FEET), "stageScales": STAGES,
        "layerOrder": ORDER, "artStatus": "pending-owner-review",
        "variants": records,
    }
    (HERE / "manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Built 27 expression frames, 243 export layers and 9 editable ORA files")


if __name__ == "__main__":
    main()
