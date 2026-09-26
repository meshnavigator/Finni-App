"""Refresh R3 evidence hashes, budgets and video metadata after validation."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struc
import subprocess
from pathlib import Path


IGNORED = {"slice-manifest.json", "SHA256SUMS.txt"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def records(output: Path) -> list[dict[str, object]]:
    paths = (
        path for path in output.rglob("*")
        if path.is_file() and path.name not in IGNORED
        and not any(part.startswith(".") for part in path.relative_to(output).parts)
    )
    return [
        {
            "path": path.relative_to(output).as_posix(),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
        for path in sorted(paths, key=lambda item: item.relative_to(output).as_posix().lower())
    ]


def glb_document(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total != len(data):
        raise RuntimeError("Invalid GLB header")
    length, kind = struct.unpack_from("<I4s", data, 12)
    if kind != b"JSON":
        raise RuntimeError("GLB JSON chunk is unavailable")
    return json.loads(data[20:20 + length].decode("utf-8").rstrip(" \t\r\n\0"))


def glb_budgets(path: Path) -> dict[str, object]:
    document = glb_document(path)
    accessors = document.get("accessors", [])
    triangles = 0
    vertices = 0
    primitives = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitives += 1
            position = primitive.get("attributes", {}).get("POSITION")
            if position is not None:
                vertices += int(accessors[position]["count"])
            indices = primitive.get("indices")
            count = int(accessors[indices]["count"]) if indices is not None else (
                int(accessors[position]["count"]) if position is not None else 0
            )
            if primitive.get("mode", 4) == 4:
                triangles += count // 3
    return {
        "bytes": path.stat().st_size,
        "meshes": len(document.get("meshes", [])),
        "primitives": primitives,
        "verticesSummedPerPrimitive": vertices,
        "triangles": triangles,
        "materials": len(document.get("materials", [])),
        "embeddedImages": sum(1 for item in document.get("images", []) if "bufferView" in item),
        "animations": [item.get("name") for item in document.get("animations", [])],
        "skins": len(document.get("skins", [])),
        "nodes": len(document.get("nodes", [])),
    }


def video_metadata(path: Path, ffprobe: str) -> dict[str, object]:
    result = subprocess.run(
        (
            ffprobe, "-v", "error", "-select_streams", "v:0",
            "-show_entries",
            "stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_frames:format=duration,size",
            "-of", "json", str(path),
        ),
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    payload = json.loads(result.stdout)
    stream = payload["streams"][0]
    fmt = payload["format"]
    return {
        "path": path.as_posix(),
        "codec": stream["codec_name"],
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "pixelFormat": stream["pix_fmt"],
        "frameRate": stream["r_frame_rate"],
        "frames": int(stream["nb_frames"]),
        "durationSeconds": float(fmt["duration"]),
        "bytes": int(fmt["size"]),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output).resolve()
    manifest_path = output / "slice-manifest.json"
    report_path = output / "validator-report.json"
    if not manifest_path.is_file() or not report_path.is_file():
        raise RuntimeError("Manifest and official validator report are required")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    validator = json.loads(report_path.read_text(encoding="utf-8"))
    issues = validator["issues"]
    if issues["numErrors"] or issues["numWarnings"]:
        raise RuntimeError(f"glTF validation is not clean: {issues}")
    glb = output / "Finni_R3.glb"
    manifest["glb"]["sha256"] = sha256(glb)
    manifest["budgets"] = glb_budgets(glb)
    manifest["validation"] = {
        "tool": "Khronos glTF Validator",
        "report": "validator-report.json",
        "errors": issues["numErrors"],
        "warnings": issues["numWarnings"],
        "infos": issues["numInfos"],
        "hints": issues["numHints"],
    }
    ffprobe = shutil.which("ffprobe")
    if ffprobe is None:
        raise RuntimeError("ffprobe is unavailable")
    manifest["videoProbe"] = [
        video_metadata(output / "previews" / f"{name}.mp4", ffprobe)
        for name in ("idle", "blink", "joy", "curiosity")
    ]
    current_records = records(output)
    manifest["files"] = current_records
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output / "SHA256SUMS.txt").write_text(
        "\n".join(f"{record['sha256']}  {record['path']}" for record in current_records) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "glb": manifest["glb"]["sha256"],
        "validation": manifest["validation"],
        "budgets": manifest["budgets"],
        "videos": manifest["videoProbe"],
        "files": len(current_records),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
