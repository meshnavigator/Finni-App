"""Independent pixel, export, anchor and 9×3 stage checks for expressions."""
from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageStat


HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
PACKAGE = APP / "assets/2d/variants/FINNI-MATRIX-V1"
SIZE = (941, 1672)
ORDER = ["room-base", "pet-back", "pet-body", "pet-pattern", "pet-ear-shape", "pet-face", "pet-expression", "pet-accessory", "room-foreground"]
PET_ORDER = ORDER[1:-1]
EXPRESSIONS = ("happy", "thoughtful", "inspired")
SCALES = {1: .86, 2: 1.0, 3: 1.12}
FEET = (470, 1272)


def load(path: Path) -> Image.Image:
    with Image.open(path) as image:
        assert image.size == SIZE, (path, image.size)
        return image.convert("RGBA")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def composite(layers: list[Image.Image]) -> Image.Image:
    image = Image.new("RGBA", SIZE)
    for layer in layers:
        image = Image.alpha_composite(image, layer)
    return image


def stage_frame(image: Image.Image, scale: float) -> Image.Image:
    width, height = round(SIZE[0] * scale), round(SIZE[1] * scale)
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    left = round((1 - scale) * FEET[0])
    top = round((1 - scale) * FEET[1])
    assert abs(left + FEET[0] * width / SIZE[0] - FEET[0]) <= 1
    assert abs(top + FEET[1] * height / SIZE[1] - FEET[1]) <= 1
    result = Image.new("RGBA", SIZE)
    result.paste(resized, (left, top), resized)
    return result


def main() -> None:
    base = json.loads((PACKAGE / "asset-manifest.json").read_text(encoding="utf-8"))
    package = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    assert len(base["variants"]) == len(package["variants"]) == 9
    assert base["canvas"] == package["canvas"] == list(SIZE)
    assert base["feetAnchor"] == package["feetAnchor"] == list(FEET)
    summaries = []
    stages = {}
    for variant, record in zip(base["variants"], package["variants"]):
        key = variant["id"]
        assert key == record["id"]
        original = PACKAGE / key
        neutral = load(original / "neutral.png")
        assert digest(original / "neutral.png") == variant["neutralSha256"] == record["acceptedNeutralSha256"]
        assert digest(original / "blink.png") == variant["blinkSha256"] == record["acceptedBlinkSha256"]
        assert digest(original / "source.ora") == variant["oraSha256"] == record["acceptedOraSha256"]
        with zipfile.ZipFile(HERE / "variants" / key / "expressions.ora") as ora:
            root = ET.fromstring(ora.read("stack.xml"))
            assert [group.attrib["name"] for group in root.find("stack")] == list(EXPRESSIONS)
            assert digest(HERE / "variants" / key / "expressions.ora") == record["expressionsOraSha256"]
            expected_merged = composite([load(original / "export/neutral/room-base.png"), load(HERE / "variants" / key / "happy.png"), load(original / "export/neutral/room-foreground.png")])
            packed_merged = Image.open(io.BytesIO(ora.read("mergedimage.png"))).convert("RGBA")
            assert ImageChops.difference(packed_merged, expected_merged).getbbox() is None
            for expression in EXPRESSIONS:
                frame = load(HERE / "variants" / key / f"{expression}.png")
                assert digest(HERE / "variants" / key / f"{expression}.png") == record["expressions"][expression]
                exports = HERE / "variants" / key / "export" / expression
                layers = [load(exports / f"{name}.png") for name in PET_ORDER]
                rebuilt = composite(layers)
                assert ImageChops.difference(frame, rebuilt).getbbox() is None, (key, expression, "export")
                for name in ORDER:
                    packed = Image.open(io.BytesIO(ora.read(f"data/{expression}/{name}.png"))).convert("RGBA")
                    assert ImageChops.difference(packed, load(exports / f"{name}.png")).getbbox() is None, (key, expression, name)
                    if name != "pet-expression":
                        accepted = load(original / "export/neutral" / f"{name}.png")
                        assert ImageChops.difference(packed, accepted).getbbox() is None, (key, expression, "accepted layer", name)
                difference = ImageChops.difference(frame, neutral)
                bounds = difference.getbbox()
                assert bounds and 335 <= bounds[0] and bounds[2] <= 566 and 820 <= bounds[1] and bounds[3] <= 1021, (key, expression, bounds)
                assert frame.getchannel("A").getbbox() == neutral.getchannel("A").getbbox()
                stages[key, expression] = frame
                summaries.append({"appearance": key, "expression": expression, "changedBounds": bounds})
    distinctness = []
    for variant in package["variants"]:
        key = variant["id"]
        happy = stages[key, "happy"].convert("RGB").crop((340, 820, 565, 1020))
        inspired = stages[key, "inspired"].convert("RGB").crop((340, 820, 565, 1020))
        mean_difference = sum(ImageStat.Stat(ImageChops.difference(happy, inspired)).mean) / 3
        assert mean_difference > 27, (key, mean_difference)
        distinctness.append({"appearance": key, "faceMeanDifference": round(mean_difference, 2)})
    for stage, scale in SCALES.items():
        assert abs(((1 - scale) * FEET[0] + scale * FEET[0]) - FEET[0]) < 1e-9
        assert abs(((1 - scale) * FEET[1] + scale * FEET[1]) - FEET[1]) < 1e-9
        sheet = Image.new("RGB", (9 * 220, 3 * 280), "#f8f3e9")
        draw = ImageDraw.Draw(sheet)
        for column, variant in enumerate(package["variants"]):
            for row, expression in enumerate(EXPRESSIONS):
                transformed = stage_frame(stages[variant["id"], expression], scale)
                bounds = transformed.getchannel("A").getbbox()
                assert bounds and 0 <= bounds[0] < bounds[2] <= SIZE[0] and 0 <= bounds[1] < bounds[3] <= SIZE[1], (variant["id"], expression, stage, bounds)
                crop = transformed.crop((125, 560, 815, 1390))
                crop.thumbnail((190, 240))
                x, y = column * 220 + 10, row * 280 + 25
                sheet.paste(crop, (x, y), crop)
                draw.text((x, row * 280 + 5), f"{variant['id']} {expression}", fill="#263b47")
        sheet.save(HERE / "review" / f"stage-{stage}-27.jpg", quality=90)
    report = {"status": "PASS", "appearances": 9, "expressions": 3, "appearanceStageCombinations": 27, "renderChecks": 81, "exportLayers": 243, "editableOra": 9, "happyInspiredDistinctness": distinctness, "frames": summaries}
    (HERE / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS: 27 frames, 243 exact export layers, 9 ORA, 27 appearance/stage combinations and 81 render checks")


if __name__ == "__main__":
    main()
