"""Reproducibly export the S8-002 catalog thumbnails from exact imagegen masters.

Run: python -B build_assets.py
The five accepted room objects remain byte-for-byte unchanged.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SIZE = (192, 192)
CONTENT_SIZE = 168
ALPHA_BOUND_THRESHOLD = 8
OBJECT_IDS = (
    "OBJ-PLANNER", "OBJ-CHEST", "OBJ-CARE", "OBJ-GOAL-DISPLAY", "OBJ-COIN",
)
CATALOG_IDS = tuple(f"IT-{number:02d}" for number in range(1, 9)) + tuple(
    f"GL-{number:02d}" for number in range(1, 4)
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export_catalog(master: Path, output: Path) -> None:
    with Image.open(master) as loaded:
        if loaded.mode != "RGBA":
            raise ValueError(f"Expected RGBA master: {master}")
        image = loaded.copy()
    alpha = image.getchannel("A")
    bounds = alpha.point(
        lambda value: 255 if value > ALPHA_BOUND_THRESHOLD else 0
    ).getbbox()
    if bounds is None:
        raise ValueError(f"Empty imagegen master: {master}")
    cropped = image.crop(bounds)
    factor = min(CONTENT_SIZE / cropped.width, CONTENT_SIZE / cropped.height)
    scaled = cropped.resize(
        (round(cropped.width * factor), round(cropped.height * factor)),
        Image.Resampling.LANCZOS,
    )
    thumbnail = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    thumbnail.alpha_composite(
        scaled,
        ((SIZE[0] - scaled.width) // 2, (SIZE[1] - scaled.height) // 2),
    )
    if thumbnail.getchannel("A").getbbox() is None:
        raise ValueError(f"Empty exported thumbnail: {master}")
    thumbnail.save(output, format="PNG", optimize=True)


def main() -> None:
    output = ROOT / "png"
    output.mkdir(exist_ok=True)
    master_root = ROOT / "masters"
    source = json.loads((master_root / "source-manifest.json").read_text(
        encoding="utf-8"
    ))
    masters = {entry["assetId"]: entry for entry in source["assets"]}
    if set(masters) != set(CATALOG_IDS):
        raise ValueError("Master ID set differs from canonical catalog IDs")

    room = ROOT / "../../master/FINNI-2D-MASTER-V1/room_clean_v1.png"
    records = []
    for asset_id in OBJECT_IDS + CATALOG_IDS:
        name = asset_id.lower().replace("-", "_") + ".png"
        path = output / name
        master_record = masters.get(asset_id)
        if master_record is not None:
            master = master_root / master_record["path"]
            if not master.is_file() or sha256(master) != master_record["sha256"]:
                raise ValueError(f"Imagegen master hash mismatch: {asset_id}")
            export_catalog(master, path)
        elif not path.is_file():
            raise FileNotFoundError(f"Missing approved room object: {path}")

        with Image.open(path) as exported:
            dimensions, mode = list(exported.size), exported.mode
        if mode != "RGBA":
            raise ValueError(f"Expected RGBA PNG: {path}")
        if master_record is not None and dimensions != list(SIZE):
            raise ValueError(f"Wrong catalog export size: {path}")
        record = {
            "assetId": (
                f"CAT-{asset_id}" if master_record is not None else asset_id
            ),
            "path": f"png/{name}",
            "sha256": sha256(path),
            "dimensions": dimensions,
            "mode": mode,
            "sourceType": (
                "imagegen-export" if master_record is not None else "imagegen"
            ),
        }
        if master_record is not None:
            record["masterPath"] = f"masters/{master_record['path']}"
            record["masterSha256"] = master_record["sha256"]
        if asset_id.startswith("IT-"):
            record["itemId"] = asset_id
        elif asset_id.startswith("GL-"):
            record["goalId"] = asset_id
        records.append(record)

    manifest = {
        "packageId": "S8-002-ROOM-OBJECTS-V3",
        "version": 3,
        "status": "owner-art-approved-emulator-verified",
        "source": (
            "Exact imagegen masters for five room objects and eleven catalog "
            "illustrations; deterministic 192x192 catalog exports"
        ),
        "baseRoom": {
            "assetId": "ROOM-BASE",
            "path": "../../master/FINNI-2D-MASTER-V1/room_clean_v1.png",
            "sha256": sha256(room),
            "sourcePackage": "FINNI-2D-MASTER-V1",
        },
        "rights": (
            "Original project geometry and AI-generated assets; owner confirms "
            "visual-use authority for contest and public APK scope, as for "
            "the accepted S7-004 illustrations; provenance and hashes recorded"
        ),
        "catalogExport": {
            "size": list(SIZE),
            "maxContentSize": CONTENT_SIZE,
            "alphaBoundThreshold": ALPHA_BOUND_THRESHOLD,
            "resampling": "Pillow LANCZOS",
        },
        "assets": records,
    }
    (ROOT / "asset-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
