"""Package verified expression sources without changing accepted neutral/blink files."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image


HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
OUT = APP / "assets/2d/variants/FINNI-EXPRESSIONS-V1"


def main() -> None:
    report = json.loads((HERE / "verification.json").read_text(encoding="utf-8"))
    assert report["status"] == "PASS" and report["renderChecks"] == 81
    manifest = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    assert len(manifest["variants"]) == 9
    acceptance = json.loads((HERE / "acceptance.json").read_text(encoding="utf-8"))
    approved = {variant["id"]: variant for variant in acceptance["variants"]}
    def is_accepted(variant: dict) -> bool:
        expected = approved.get(variant["id"], {})
        source = HERE / "variants" / variant["id"]
        hashes_match = all(
            hashlib.sha256((source / f"{name}.png").read_bytes()).hexdigest() == digest
            for name, digest in variant["expressions"].items()
        )
        ora_matches = hashlib.sha256((source / "expressions.ora").read_bytes()).hexdigest() == variant["expressionsOraSha256"]
        return hashes_match and ora_matches and all(
            variant.get(field) == expected.get(field) for field in (
                "acceptedNeutralSha256", "acceptedBlinkSha256", "expressions", "expressionsOraSha256"
            )
        )
    review_sha = hashlib.sha256((HERE / "review/expressions-27.jpg").read_bytes()).hexdigest()
    all_accepted = (
        acceptance["status"] == "owner-accepted"
        and acceptance["reviewSheetSha256"] == review_sha
        and len(approved) == len(manifest["variants"])
        and all(is_accepted(variant) for variant in manifest["variants"])
    )
    manifest["artStatus"] = "owner-accepted" if all_accepted else "art-review-candidate"
    if all_accepted:
        manifest["artAcceptance"] = {
            "date": acceptance["date"], "revision": acceptance["revision"],
            "record": "artifacts/sprint-8/S8-001-expressions-v1/acceptance.json",
            "scope": acceptance["scope"], "excludes": acceptance["excludes"],
        }
    else:
        manifest.pop("artAcceptance", None)
    for variant in manifest["variants"]:
        variant["artStatus"] = "owner-accepted" if is_accepted(variant) and all_accepted else "pending-owner-review"
    OUT.mkdir(parents=True, exist_ok=True)
    assets = []
    for variant in manifest["variants"]:
        source = HERE / "variants" / variant["id"]
        destination = OUT / variant["id"]
        shutil.copytree(source, destination, dirs_exist_ok=True)
        for file in sorted(destination.rglob("*")):
            if not file.is_file():
                continue
            asset = {"path": file.relative_to(OUT).as_posix(), "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}
            if file.suffix == ".png":
                with Image.open(file) as image:
                    asset["dimensions"] = list(image.size)
            assets.append(asset)
    manifest["assets"] = assets
    manifest["source"] = "artifacts/sprint-8/S8-001-expressions-v1"
    (OUT / "asset-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Packaged {len(manifest['variants'])} variants and {len(assets)} files")


if __name__ == "__main__":
    main()
