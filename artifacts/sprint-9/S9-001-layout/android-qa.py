"""AVD-only fixtures. Original data is backed up in C:/tmp/finni-s9-home-original."""
from pathlib import Path
import json
import re
import sqlite3
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'android'
OUT.mkdir(exist_ok=True)
ADB = 'C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe'
PKG = 'com.meshnavigator.finni'
BASE = Path('C:/tmp/finni-expression-qa-active/SQLite/finni-main.db')
FIXTURE = Path('C:/tmp/finni-s9-home-fixture.db')
REMOTE = f'/data/data/{PKG}/files/SQLite/finni-main.db'

def adb(*args):
    return subprocess.run([ADB, *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout

def fixture(shape='pointy', pattern='plain', stage=2, long=False, empty=False, state="ACTIVE"):
    adb('shell', 'am', 'force-stop', PKG)
    with sqlite3.connect(BASE) as source, sqlite3.connect(FIXTURE) as dest:
        source.backup(dest)
        dest.execute('PRAGMA journal_mode=DELETE')
        dest.execute('UPDATE profile SET shape_id=?, pattern_id=?, pet_name=?', (shape, pattern, 'Суперфинни-12345' if long else 'Финни'))
        dest.execute('UPDATE profile_state SET pet_stage=?', (stage,))
        if long:
            dest.execute('UPDATE wallet_projection SET available=1000000000, savings=1000000000')
            dest.execute('UPDATE period SET period_index=5')
            dest.execute("INSERT OR REPLACE INTO lesson_attempt(id,profile_id,period_id,lesson_id,content_version,variant_id,mechanic,parameters_json,hints_json,phase,solution_revision,solution_json,shown_hints_json,reward_eligible_at_start,started_at,updated_at) SELECT 'home-qa-long',id,NULL,'LS-S02','1.2.0','default','savings','{}','[\"one\",\"two\"]','draft',0,'{}','[]',0,'2026-09-25','2026-09-25' FROM profile")
        dest.execute('DELETE FROM goal_selection')
        dest.execute("INSERT INTO goal_selection(profile_id,goal_id,selected_at,revision) SELECT id,'GL-03','2026-09-25',0 FROM profile")
        if empty:
            dest.execute('UPDATE goal_selection SET goal_id=NULL')
        if state == 'DRAFT':
            dest.execute("UPDATE period SET state='DRAFT',confirmed_plan_json=NULL,confirmed_at=NULL,budget_at_confirm=NULL,ledger_seq_at_confirm=NULL")
        elif state in ('READY', 'WAITING'):
            dest.execute("UPDATE period SET state='CLOSED',closed_at='2026-09-25'")
            dest.execute("UPDATE game_clock SET max_opened_date=?,next_eligible_date=?", ('2000-01-01','2000-01-02') if state == 'READY' else ('2099-01-01','2099-01-02'))
        dest.commit()
    adb('push', str(FIXTURE), '/data/local/tmp/finni-s9-home.db')
    adb('shell', f'cp /data/local/tmp/finni-s9-home.db {REMOTE} && chown 10080:10080 {REMOTE} && chmod 600 {REMOTE} && rm -f {REMOTE}-wal {REMOTE}-shm')

def start(width, height, scale):
    adb('shell', 'am', 'force-stop', PKG)
    adb('shell', 'wm', 'size', f'{width}x{height}')
    adb('shell', 'wm', 'density', '160')
    adb('shell', 'settings', 'put', 'system', 'font_scale', str(scale))
    adb('shell', 'am', 'start', '-n', PKG + '/.MainActivity')
    time.sleep(2)

def capture(name):
    dumped = adb('shell', 'uiautomator', 'dump', '/sdcard/finni-s9.xml')
    assert b'UI hierchary dumped' in dumped or b'UI hierarchy dumped' in dumped, dumped
    raw = adb('shell', 'cat', '/sdcard/finni-s9.xml')
    (OUT / (name + '.xml')).write_bytes(raw)
    (OUT / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p'))
    tree = ET.fromstring(raw)
    nodes = [dict(n.attrib) for n in tree.iter('node')]
    return nodes

if __name__ == '__main__':
    fixture(long='long' in sys.argv)
    start(360, 640, 2 if 'large' in sys.argv else 1)
    nodes = capture('initial-large' if 'large' in sys.argv else 'initial-ordinary')
    print(json.dumps([n for n in nodes if n.get('text') or n.get('content-desc')], ensure_ascii=False))
