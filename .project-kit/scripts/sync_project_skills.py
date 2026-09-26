#!/usr/bin/env python3
"""Check or synchronize .agents/skills into .claude/skills."""

from __future__ import annotations

import argparse
import filecmp
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="?", type=Path, default=Path.cwd())
    parser.add_argument("--check", action="store_true", help="Check only (default)")
    parser.add_argument("--apply", action="store_true", help="Copy missing files")
    parser.add_argument("--force", action="store_true", help="Overwrite drifted mirror files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.target.expanduser().resolve()
    source_root = root / ".agents" / "skills"
    target_root = root / ".claude" / "skills"
    if not source_root.is_dir():
        print(f"Missing canonical skills directory: {source_root}")
        return 1

    missing: list[Path] = []
    drift: list[Path] = []
    for source in sorted(path for path in source_root.rglob("*") if path.is_file()):
        relative = source.relative_to(source_root)
        target = target_root / relative
        if not target.exists():
            missing.append(relative)
        elif not filecmp.cmp(source, target, shallow=False):
            drift.append(relative)

    if args.apply:
        for relative in missing:
            destination = target_root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_root / relative, destination)
        if args.force:
            for relative in drift:
                destination = target_root / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_root / relative, destination)

    print(f"Missing mirror files: {len(missing)}")
    print(f"Drifted mirror files: {len(drift)}")
    for relative in missing:
        print(f"  MISSING {relative.as_posix()}")
    for relative in drift:
        print(f"  DRIFT {relative.as_posix()}")
    if args.apply and drift and not args.force:
        print("Drift was preserved; use --apply --force to overwrite it intentionally.")
    return 1 if (missing or drift) and not args.apply else (1 if drift and not args.force else 0)


if __name__ == "__main__":
    raise SystemExit(main())
