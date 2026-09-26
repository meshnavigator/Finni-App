#!/usr/bin/env python3
"""Audit a Project Governance Kit installation without changing it."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class Finding:
    severity: str
    check: str
    message: str


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="?", type=Path, default=Path.cwd())
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--max-map-age-days", type=int, default=7)
    return parser.parse_args()


def add(findings: list[Finding], severity: str, check: str, message: str) -> None:
    findings.append(Finding(severity, check, message))


def check_required(root: Path, findings: list[Finding]) -> None:
    required = [
        "AGENTS.md",
        "CONTRIBUTING.md",
        ".project-kit/config.json",
        ".project-kit/model-routing.json",
        "docs/INDEX.md",
        "docs/IMPLEMENTATION_DECISIONS.md",
        "docs/CURRENT_IMPLEMENTATION.md",
        "tasks/TASKS.md",
        ".agents/skills",
    ]
    for relative in required:
        path = root / relative
        if not path.exists():
            add(findings, "error", "required", f"Missing {relative}")


def load_config(root: Path, findings: list[Finding]) -> dict:
    path = root / ".project-kit" / "config.json"
    if not path.is_file():
        return {}
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        add(findings, "error", "config", f"Invalid config.json: {exc}")
        return {}
    code_root = root / config.get("code_root", ".")
    if not code_root.is_dir():
        add(findings, "error", "config", f"code_root does not exist: {code_root}")
    return config


def check_model_routing(root: Path, findings: list[Finding]) -> None:
    path = root / ".project-kit" / "model-routing.json"
    if not path.is_file():
        return
    try:
        policy = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        add(findings, "error", "model-routing", f"Invalid model-routing.json: {exc}")
        return

    aliases = policy.get("aliases", {})
    expected_aliases = {
        "astra": "gpt-6-astra",
        "sol": "gpt-6-sol",
        "luna": "gpt-6-luna",
        "uno": "gpt-6-luna",
    }
    if aliases != expected_aliases:
        add(findings, "error", "model-routing", "Aliases must use only GPT-6 Astra, Sol and Luna")

    direct = policy.get("direct", {})
    expected = {
        "single_executor": True,
        "bypass_adaptive": True,
        "automatic_escalation": False,
        "cross_model_review": False,
        "fallback_model": None,
    }
    for key, value in expected.items():
        if direct.get(key) != value:
            add(findings, "error", "model-routing", f"direct.{key} must be {value!r}")

    defaults = direct.get("default_reasoning", {})
    if defaults != {model: "high" for model in set(expected_aliases.values())}:
        add(findings, "error", "model-routing", "DIRECT default reasoning must be high for GPT-6 Astra, Sol and Luna")

    solo = policy.get("solo", {})
    solo_expected = {
        "preserve_current_model": True,
        "preserve_current_reasoning": True,
        "delegation": False,
    }
    for key, value in solo_expected.items():
        if solo.get(key) != value:
            add(findings, "error", "model-routing", f"solo.{key} must be {value!r}")

    astra_approval = policy.get("astra_approval", {})
    approval_expected = {
        "required_before_routing_or_dispatch": True,
        "direct_request_counts_as_approval": False,
        "manual_primary_task_selection_counts_as_approval": True,
        "approval_scope": "current_task_or_package_only",
        "on_direct_decline": "stop_without_fallback",
    }
    for key, value in approval_expected.items():
        if astra_approval.get(key) != value:
            add(findings, "error", "model-routing", f"astra_approval.{key} must be {value!r}")
    adaptive_decline = astra_approval.get("on_adaptive_decline", {})
    if adaptive_decline != {"model": "gpt-6-sol", "reasoning": "high"}:
        add(findings, "error", "model-routing", "Astra decline in ADAPTIVE must route to Sol High")

    known_models = set(expected_aliases.values())
    adaptive = policy.get("adaptive", {})
    routes = adaptive.get("routes", {})
    expected_routes = {
        "mechanical_low_risk": ("gpt-6-luna", "high"),
        "standard_implementation": ("gpt-6-sol", "medium"),
        "architecture_and_integration": ("gpt-6-sol", "high"),
        "complex_architecture_or_review": ("gpt-6-sol", "xhigh"),
        "highest_risk_or_ambiguity": ("gpt-6-astra", "high"),
    }
    for route_name, (model, reasoning) in expected_routes.items():
        if routes.get(route_name) != {"model": model, "reasoning": reasoning}:
            add(findings, "error", "model-routing", f"Invalid GPT-6 route: {route_name}")
    for profile_name, profile in adaptive.get("profiles", {}).items():
        for model in profile.get("prefer", []):
            if model not in known_models:
                add(findings, "error", "model-routing", f"Unknown model in profile {profile_name}: {model!r}")
    for route_name, route in routes.items():
        if route.get("model") not in known_models:
            add(findings, "error", "model-routing", f"Unknown model in route {route_name}: {route.get('model')!r}")
    supported = policy.get("codex_desktop_reasoning", {})
    if set(supported) != known_models:
        add(findings, "error", "model-routing", "Reasoning capabilities must list only GPT-6 Astra, Sol and Luna")
    for route_name, route in routes.items():
        if route.get("reasoning") not in supported.get(route.get("model"), []):
            add(findings, "error", "model-routing", f"Unsupported reasoning in route {route_name}")


def check_skills(root: Path, findings: list[Finding]) -> None:
    canonical = root / ".agents" / "skills"
    mirror = root / ".claude" / "skills"
    if not canonical.is_dir():
        return
    for skill_file in sorted(canonical.glob("*/SKILL.md")):
        expected = skill_file.parent.name
        name_line = next(
            (line for line in skill_file.read_text(encoding="utf-8").splitlines() if line.startswith("name:")),
            "",
        )
        actual = name_line.partition(":")[2].strip()
        if actual != expected:
            add(findings, "error", "skill-frontmatter", f"{skill_file}: name={actual!r}, expected {expected!r}")
    if not mirror.is_dir():
        add(findings, "warning", "skill-mirror", "Missing .claude/skills mirror")
        return
    for source in sorted(path for path in canonical.rglob("*") if path.is_file()):
        relative = source.relative_to(canonical)
        target = mirror / relative
        if not target.is_file():
            add(findings, "warning", "skill-mirror", f"Mirror missing {relative.as_posix()}")
        elif digest(source) != digest(target):
            add(findings, "warning", "skill-mirror", f"Mirror drift {relative.as_posix()}")


def check_map(root: Path, config: dict, findings: list[Finding], max_age_days: int) -> None:
    code_root = root / config.get("code_root", ".")
    map_file = code_root / ".belief_map.sexp"
    if not map_file.is_file():
        add(findings, "warning", "belief-map", f"Missing {map_file}")
        return
    age_days = (time.time() - map_file.stat().st_mtime) / 86400
    if age_days > max_age_days:
        add(findings, "warning", "belief-map", f"Map is {age_days:.1f} days old")
    try:
        noisy = sum(1 for line in map_file.open(encoding="utf-8", errors="ignore") if "worktrees/" in line or "codex-worktrees/" in line)
    except OSError as exc:
        add(findings, "warning", "belief-map", f"Cannot inspect map: {exc}")
        return
    if noisy:
        add(findings, "warning", "belief-map", f"Map contains {noisy} worktree facts")


def check_tools(findings: list[Finding]) -> None:
    for command in ("git", "rg", "python"):
        if shutil.which(command) is None:
            add(findings, "warning", "tool", f"Command not found: {command}")


def main() -> int:
    args = parse_args()
    root = args.target.expanduser().resolve()
    findings: list[Finding] = []
    if not root.is_dir():
        add(findings, "error", "root", f"Target does not exist: {root}")
    else:
        check_required(root, findings)
        config = load_config(root, findings)
        check_model_routing(root, findings)
        check_skills(root, findings)
        check_map(root, config, findings, args.max_map_age_days)
        check_tools(findings)

    errors = sum(item.severity == "error" for item in findings)
    warnings = sum(item.severity == "warning" for item in findings)
    if args.as_json:
        print(json.dumps({"root": str(root), "errors": errors, "warnings": warnings, "findings": [asdict(item) for item in findings]}, ensure_ascii=False, indent=2))
    else:
        print(f"Project doctor: {root}")
        for item in findings:
            print(f"[{item.severity.upper()}] {item.check}: {item.message}")
        print(f"Result: errors={errors}, warnings={warnings}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
