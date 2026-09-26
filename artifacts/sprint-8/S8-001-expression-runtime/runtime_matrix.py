"""Capture the real API 26 Home scene for each accepted appearance and stage.

This is a QA-only AVD fixture: app databases are backed up before replacement.
"""
from pathlib import Path
import json
import re
import sqlite3
import subprocess
import time
import xml.etree.ElementTree as ET
from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "matrix"
OUT.mkdir(exist_ok=True)
ADB = Path("C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe")
SOURCE = Path("C:/tmp/finni-expression-qa-active/SQLite/finni-main.db")
FIXTURE = Path("C:/tmp/finni-expression-qa-active/fixture.db")
DEVICE_DB = "/data/data/com.meshnavigator.finni/files/SQLite/finni-main.db"
PACKAGE = "com.meshnavigator.finni"
SHAPES = ("pointy", "round", "floppy")
PATTERNS = ("plain", "spots", "stripes")

def adb(*args, check=True):
    return subprocess.run([str(ADB), *args], check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout

def ui():
    adb("shell", "uiautomator", "dump", "/sdcard/finni-matrix.xml")
    return ET.fromstring(adb("shell", "cat", "/sdcard/finni-matrix.xml"))

with sqlite3.connect(SOURCE) as source, sqlite3.connect(FIXTURE) as fixture:
    source.backup(fixture)
    fixture.execute("PRAGMA journal_mode=DELETE")

results = []
for stage in (1, 2, 3):
    for shape in SHAPES:
        for pattern in PATTERNS:
            key = f"{shape}-{pattern}-stage{stage}"
            adb("shell", "am", "force-stop", PACKAGE)
            with sqlite3.connect(FIXTURE) as fixture:
                fixture.execute("UPDATE profile SET shape_id=?, pattern_id=?", (shape, pattern))
                fixture.execute("UPDATE profile_state SET pet_stage=?", (stage,))
                fixture.commit()
            adb("push", str(FIXTURE), "/data/local/tmp/finni-matrix.db")
            adb("shell", "cp /data/local/tmp/finni-matrix.db " + DEVICE_DB + " && chown u0_a80:u0_a80 " + DEVICE_DB + " && chmod 600 " + DEVICE_DB + " && rm -f " + DEVICE_DB + "-wal " + DEVICE_DB + "-shm")
            adb("shell", "am", "start", "-n", PACKAGE + "/.MainActivity")
            seen = False
            for _ in range(15):
                time.sleep(0.5)
                try:
                    tree = ui()
                except (subprocess.CalledProcessError, ET.ParseError):
                    continue
                descriptions = [n.attrib.get("content-desc", "") for n in tree.iter("node")]
                if any(f"Финни дома, стадия {stage}." in label for label in descriptions):
                    if any("Изображение недоступно" in label for label in descriptions):
                        raise RuntimeError(key + ": fallback image")
                    seen = True
                    break
            if not seen:
                raise RuntimeError(key + ": Home scene did not load")
            shot = OUT / (key + ".png")
            for image_attempt in range(12):
                time.sleep(0.5)
                adb("shell", "screencap", "-p", "/sdcard/finni-matrix.png")
                adb("pull", "/sdcard/finni-matrix.png", str(shot))
                with Image.open(shot) as image:
                    variance = ImageStat.Stat(image.convert("L").crop((35, 690, 1045, 1235))).var[0]
                if variance > 3000:
                    break
            else:
                raise RuntimeError(f"{key}: room image not rendered; variance={variance:.0f}")
            results.append({"id": key, "stage": stage, "appearance": shape + "/" + pattern, "screenshot": str(shot.relative_to(ROOT)), "status": "PASS"})
            print(key + " PASS", flush=True)
(ROOT / "matrix.json").write_text(json.dumps({"device": "emulator-5554 API 26", "scope": "debug + Metro; QA database fixture", "results": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
