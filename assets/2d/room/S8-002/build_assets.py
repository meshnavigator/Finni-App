"""Deterministic editable source for the S8-002 functional object icons.

Run: python -B build_assets.py
Only Pillow is required. All shapes are original project geometry; no fonts,
external imagery, generated text, or network resources are embedded.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
S = 4
SIZE = 192
INK = "#285164"
TEAL = "#479C9C"
LIGHT = "#DDF2EA"
CREAM = "#FFF2D5"
GOLD = "#E5AC4E"
CORAL = "#DB8172"
BLUE = "#78B8CA"

ASSETS = {
    "OBJ-PLANNER": "planner",
    "OBJ-CHEST": "chest",
    "OBJ-CARE": "care",
    "OBJ-GOAL-DISPLAY": "goal_display",
    "OBJ-COIN": "coin",
    "IT-01": "food",
    "IT-02": "festive_food",
    "IT-03": "brush",
    "IT-04": "care_set",
    "IT-05": "ball",
    "IT-06": "book",
    "IT-07": "walk_set",
    "IT-08": "party",
    "GL-01": "kite",
    "GL-02": "scooter",
    "GL-03": "house",
}


def draw_icon(kind: str) -> Image.Image:
    image = Image.new("RGBA", (SIZE * S, SIZE * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)

    def box(coords, fill, outline=INK, width=3, radius=0):
        xy = tuple(round(v * S) for v in coords)
        if radius:
            d.rounded_rectangle(xy, radius=radius * S, fill=fill, outline=outline, width=width * S)
        else:
            d.rectangle(xy, fill=fill, outline=outline, width=width * S)

    def ellipse(coords, fill, outline=INK, width=3):
        d.ellipse(tuple(round(v * S) for v in coords), fill=fill, outline=outline, width=width * S)

    def line(points, fill=INK, width=3):
        d.line([(round(x * S), round(y * S)) for x, y in points], fill=fill, width=width * S, joint="curve")

    def polygon(points, fill, outline=INK, width=3):
        p = [(round(x * S), round(y * S)) for x, y in points]
        d.polygon(p, fill=fill)
        d.line(p + [p[0]], fill=outline, width=width * S, joint="curve")

    # A quiet translucent plinth makes the silhouettes visible on both white
    # catalog cards and the accepted green room without adding baked-in text.
    ellipse((20, 156, 172, 176), (39, 81, 100, 29), None)

    if kind == "planner":
        box((43, 38, 149, 151), CREAM, radius=10)
        box((43, 38, 149, 60), TEAL, radius=10)
        for x in (61, 131):
            box((x, 29, x + 7, 48), GOLD, radius=3)
        for y in (80, 103, 126):
            ellipse((58, y, 67, y + 9), CORAL, None)
            line([(76, y + 5), (133, y + 5)], BLUE, 3)
    elif kind == "chest":
        box((34, 77, 158, 150), GOLD, radius=13)
        box((34, 55, 158, 91), CREAM, radius=18)
        box((88, 89, 105, 119), TEAL, radius=5)
        line([(47, 103), (75, 103)], CREAM, 3)
        line([(119, 103), (146, 103)], CREAM, 3)
    elif kind == "care":
        ellipse((35, 114, 157, 155), TEAL)
        ellipse((39, 105, 153, 132), CREAM)
        box((117, 46, 132, 111), GOLD, radius=5)
        box((108, 40, 141, 62), CORAL, radius=5)
        for x in (113, 121, 129, 137):
            line([(x, 40), (x, 30)], INK, 2)
    elif kind == "goal_display":
        box((30, 42, 162, 153), CREAM, radius=15)
        box((42, 53, 150, 137), LIGHT, radius=8)
        polygon([(96, 69), (117, 90), (96, 111), (75, 90)], GOLD)
        ellipse((87, 81, 105, 99), CORAL, None)
    elif kind == "coin":
        ellipse((39, 38, 153, 152), GOLD)
        ellipse((49, 48, 143, 142), CREAM, GOLD, 3)
        ellipse((77, 80, 90, 94), TEAL, None)
        ellipse((102, 80, 115, 94), TEAL, None)
        for x, y in ((78, 67), (94, 61), (110, 67)):
            ellipse((x, y, x + 9, y + 9), TEAL, None)
    elif kind in ("food", "festive_food"):
        ellipse((35, 103, 157, 151), TEAL)
        ellipse((39, 97, 153, 126), CREAM)
        for x, y in ((62, 91), (90, 80), (119, 91)):
            ellipse((x, y, x + 21, y + 20), GOLD if kind == "food" else CORAL)
        if kind == "festive_food":
            polygon([(93, 40), (103, 56), (87, 56)], GOLD)
            line([(95, 56), (95, 79)], INK, 3)
    elif kind == "brush":
        box((88, 61, 111, 150), GOLD, radius=9)
        box((55, 44, 143, 84), CORAL, radius=16)
        for x in range(64, 138, 10):
            line([(x, 84), (x, 99)], INK, 2)
    elif kind == "care_set":
        box((44, 66, 148, 151), CREAM, radius=11)
        box((70, 52, 122, 70), GOLD, radius=7)
        box((59, 85, 87, 125), TEAL, radius=8)
        box((104, 85, 132, 125), CORAL, radius=8)
        ellipse((91, 131, 101, 141), GOLD, None)
    elif kind == "ball":
        ellipse((40, 41, 152, 153), CORAL)
        line([(46, 104), (145, 104)], CREAM, 6)
        line([(95, 45), (95, 149)], CREAM, 6)
        ellipse((76, 84, 114, 122), GOLD, CREAM, 4)
    elif kind == "book":
        polygon([(35, 57), (93, 68), (93, 151), (35, 137)], CREAM)
        polygon([(99, 68), (157, 57), (157, 137), (99, 151)], LIGHT)
        line([(96, 67), (96, 153)], GOLD, 5)
        for y in (86, 101, 116):
            line([(47, y), (79, y + 5)], BLUE, 2)
            line([(113, y + 5), (145, y)], BLUE, 2)
    elif kind == "walk_set":
        box((48, 62, 146, 148), TEAL, radius=15)
        box((70, 45, 125, 75), CREAM, radius=12)
        box((68, 92, 128, 126), CREAM, radius=8)
        line([(48, 79), (34, 118), (48, 128)], GOLD, 7)
        line([(146, 79), (159, 118), (146, 128)], GOLD, 7)
    elif kind == "party":
        polygon([(96, 36), (145, 139), (49, 139)], CORAL)
        ellipse((43, 130, 149, 151), CREAM)
        for x, y in ((68, 88), (95, 65), (118, 101)):
            ellipse((x, y, x + 8, y + 8), GOLD, None)
        for x, y in ((45, 52), (139, 57), (40, 105)):
            line([(x - 6, y), (x + 6, y)], GOLD, 3)
            line([(x, y - 6), (x, y + 6)], GOLD, 3)
    elif kind == "kite":
        polygon([(96, 33), (148, 85), (96, 139), (44, 85)], GOLD)
        line([(44, 85), (148, 85)], CORAL, 4)
        line([(96, 33), (96, 139)], CORAL, 4)
        line([(96, 139), (84, 159), (108, 172)], INK, 3)
    elif kind == "scooter":
        ellipse((39, 128, 70, 159), INK)
        ellipse((124, 128, 155, 159), INK)
        line([(56, 136), (116, 136), (132, 59)], TEAL, 9)
        line([(110, 58), (150, 58)], GOLD, 8)
        line([(54, 122), (114, 122)], CORAL, 8)
    elif kind == "house":
        polygon([(31, 84), (96, 37), (161, 84)], CORAL)
        box((48, 82, 144, 152), CREAM, radius=5)
        box((82, 107, 112, 152), TEAL, radius=5)
        ellipse((116, 95, 135, 114), BLUE)
    else:
        raise ValueError(kind)

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    output = ROOT / "png"
    output.mkdir(exist_ok=True)
    room = ROOT / ".." / ".." / "master" / "FINNI-2D-MASTER-V1" / "room_clean_v1.png"
    records = []
    for asset_id, kind in ASSETS.items():
        name = asset_id.lower().replace("-", "_") + ".png"
        path = output / name
        draw_icon(kind).save(path, optimize=True)
        record = {
            "assetId": f"CAT-{asset_id}" if asset_id.startswith(("IT-", "GL-")) else asset_id,
            "path": f"png/{name}",
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        if asset_id.startswith("IT-"):
            record["itemId"] = asset_id
        elif asset_id.startswith("GL-"):
            record["goalId"] = asset_id
        records.append(record)
    manifest = {
        "packageId": "S8-002-ROOM-OBJECTS-V1",
        "version": 1,
        "status": "engineering-candidate-art-acceptance-open",
        "source": "build_assets.py",
        "baseRoom": {
            "assetId": "ROOM-BASE",
            "path": "../../master/FINNI-2D-MASTER-V1/room_clean_v1.png",
            "sha256": hashlib.sha256(room.read_bytes()).hexdigest(),
            "sourcePackage": "FINNI-2D-MASTER-V1",
        },
        "license": "original project geometry; no third-party images or fonts",
        "export": {"size": [SIZE, SIZE], "mode": "RGBA", "supersampling": S},
        "assets": records,
    }
    (ROOT / "asset-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
