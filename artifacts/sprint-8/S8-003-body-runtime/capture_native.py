"""Exercise the production scene via QA controls; never accesses app databases."""
from pathlib import Path
import json
import subprocess
import time

ROOT = Path(__file__).resolve().parent
ADB = ['C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe', '-s', 'emulator-5554']
def adb(*args):
    return subprocess.run(ADB + list(args), check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout
def tap(x,y):
    adb('shell','input','tap',str(x),str(y))
def shot(name):
    (ROOT / f'{name}.png').write_bytes(adb('exec-out','screencap','-p'))
clips = [(3,100,1100,1500),(4,285,1100,1100),(5,470,1100,750),(6,660,1100,900),(7,850,1100,1100),(8,100,1200,1400),(9,285,1200,2000),(10,470,1200,1600),(11,660,1200,500),(12,850,1200,800),(13,100,1300,3000),(14,285,1300,2200)]
records=[]
tap(100,1420); tap(100,1530)
for x,y in ((660,1100),(850,1100),(100,1200)):
    tap(x,y); time.sleep(3)
recorder = subprocess.Popen(ADB + ['shell','screenrecord','--time-limit','55','/sdcard/finni-body-review.mp4'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
for number,x,y,duration in clips:
    tap(x,y)
    time.sleep(duration / 2000)
    shot(f'clip-AN-{number:03d}')
    time.sleep(duration / 2000 + .6)
    records.append({'clip':f'AN-{number:03d}','appearance':'pointy/plain','stage':2,'screenshot':f'clip-AN-{number:03d}.png'})
    print(f'captured AN-{number:03d}',flush=True)
recorder.wait(timeout=60)
adb('pull','/sdcard/finni-body-review.mp4',str(ROOT / 'clips-api26.mp4'))
for stage in (2,3,1):
    if stage != 2:
        tap(580,1650)
    for sx,shape in ((100,'pointy'),(285,'round'),(470,'floppy')):
        tap(sx,1420)
        for px,pattern in ((100,'plain'),(285,'spots'),(470,'stripes')):
            tap(px,1530); time.sleep(.5)
            tap(285,1100); time.sleep(.55)
            key=f'matrix-{shape}-{pattern}-s{stage}'
            shot(key); time.sleep(.9)
            records.append({'clip':'AN-004','appearance':f'{shape}/{pattern}','stage':stage,'screenshot':f'{key}.png'})
            print(key,flush=True)
(ROOT/'captures.json').write_text(json.dumps({'device':'Android API26 emulator-5554 1080x1920 density420','scope':'debug APK + Metro; QA controls around production FinniHomeScene','records':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
